# OfficeHours — Database Schema Specification
### Derived from `capstone-officehours-plan.md` (Draft v0.1) — ERD §10, Design Notes §10.1

| | |
|---|---|
| **Engine** | PostgreSQL 15+ |
| **Required extensions** | `btree_gist` (exclusion constraints on scalar+range), `pgcrypto` or `pg_uuid_ossp` (if UUIDs preferred over bigserial — this doc uses `bigserial` per the ERD) |
| **Naming** | `snake_case`, singular column names, plural table names |
| **Timestamps** | `timestamptz` throughout — never naive `timestamp` (multi-timezone-safe even for a single-institution deploy) |
| **Source mapping** | Every table cites the FR / entity it implements from the plan |

> This is a proposed DDL contract, not yet applied via migration. Written as sequential Flyway/Liquibase-style migrations. Adjust once Dev 1 (backend lead, schema owner per §15) reviews.

---

## 0. Extensions & Setup

```sql
-- migration: V1__extensions.sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

`btree_gist` is required because the double-booking guard (§4.4) is a GiST exclusion constraint mixing an equality column (`lecturer_id`) with a range overlap (`time_range`) — plain `gist` alone doesn't index scalar equality efficiently, `btree_gist` bridges that. This is the single most defense-relevant line in the schema (NFR-2).

---

## 1. Identity & Org

### 1.1 `users` (FR-1)

```sql
CREATE TYPE user_role AS ENUM ('STUDENT', 'LECTURER', 'ADMIN');

CREATE TABLE users (
    id              bigserial PRIMARY KEY,
    email           citext NOT NULL UNIQUE,      -- requires citext extension; else use LOWER(email) unique index
    password_hash   text NOT NULL,                -- bcrypt/argon2, never plaintext (NFR-4)
    full_name       varchar(150) NOT NULL,
    role            user_role NOT NULL,
    department      varchar(100),
    is_active       boolean NOT NULL DEFAULT true, -- soft-delete flag
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_department ON users (department) WHERE department IS NOT NULL;
```

> If `citext` is unavailable/undesired, replace with `varchar(255) NOT NULL` + `CREATE UNIQUE INDEX idx_users_email_lower ON users (LOWER(email));` and enforce lowercasing at the application layer.

### 1.1a `password_reset_tokens` (FR-1; backs `POST /auth/forgot-password` / `/auth/reset-password`)

```sql
CREATE TABLE password_reset_tokens (
    id          bigserial PRIMARY KEY,
    user_id     bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  text NOT NULL UNIQUE,          -- SHA-256 of the raw token; raw value only ever exists in the emailed link
    expires_at  timestamptz NOT NULL,          -- created_at + 30 min
    used_at     timestamptz,                   -- set on successful reset; NULL = still redeemable
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens (user_id);
```

> One-time use, short TTL. On successful reset, all rows for the user (or at least all their refresh tokens) should be invalidated so a leaked old session can't survive a password change.

### 1.2 `semesters` (FR-2)

```sql
CREATE TABLE semesters (
    id          bigserial PRIMARY KEY,
    name        varchar(100) NOT NULL,
    start_date  date NOT NULL,
    end_date    date NOT NULL,
    is_active   boolean NOT NULL DEFAULT false,
    CONSTRAINT chk_semester_dates CHECK (end_date > start_date)
);

-- Only one active semester at a time
CREATE UNIQUE INDEX uq_semesters_one_active ON semesters (is_active) WHERE is_active = true;
```

---

## 2. Availability & Conflict Sources

### 2.1 `availability_rules` (FR-3; UC6)

```sql
CREATE TABLE availability_rules (
    id              bigserial PRIMARY KEY,
    lecturer_id     bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    semester_id     bigint NOT NULL REFERENCES semesters (id) ON DELETE CASCADE,
    day_of_week     smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time      time NOT NULL,
    end_time        time NOT NULL,
    slot_minutes    int NOT NULL CHECK (slot_minutes > 0),
    effective_from  date NOT NULL,
    effective_to    date NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_rule_time_order CHECK (end_time > start_time),
    CONSTRAINT chk_rule_effective_range CHECK (effective_to >= effective_from),
    CONSTRAINT chk_rule_slot_fits CHECK (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60 >= slot_minutes
    )
);

-- app-level guard: lecturer_id in this table must resolve to a user with role = LECTURER
-- (enforced in application/service layer or via trigger — Postgres CHECK cannot cross-reference another table)

CREATE INDEX idx_avail_rules_lecturer_semester ON availability_rules (lecturer_id, semester_id);
```

### 2.2 `availability_exceptions` (FR-4; UC7)

```sql
CREATE TYPE exception_type AS ENUM ('BLOCK', 'ADD');

CREATE TABLE availability_exceptions (
    id              bigserial PRIMARY KEY,
    lecturer_id     bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    exception_date  date NOT NULL,
    type            exception_type NOT NULL,
    start_time      time NOT NULL,
    end_time        time NOT NULL,
    reason          varchar(255),
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_exception_time_order CHECK (end_time > start_time)
);

CREATE INDEX idx_avail_exceptions_lecturer_date ON availability_exceptions (lecturer_id, exception_date);
```

### 2.3 `schedule_entries` (FR-5; UC10) — generic busy blocks for both students and lecturers

```sql
CREATE TABLE schedule_entries (
    id              bigserial PRIMARY KEY,
    user_id         bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    semester_id     bigint NOT NULL REFERENCES semesters (id) ON DELETE CASCADE,
    title           varchar(150) NOT NULL,      -- e.g. "CS304 Lecture"
    day_of_week     smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      time NOT NULL,
    end_time        time NOT NULL,
    room            varchar(50),
    source          varchar(20) NOT NULL DEFAULT 'CSV_IMPORT', -- 'CSV_IMPORT' | 'MANUAL'
    import_batch_id bigint REFERENCES schedule_imports (id) ON DELETE SET NULL,
    CONSTRAINT chk_schedule_time_order CHECK (end_time > start_time)
);

CREATE INDEX idx_schedule_entries_user_semester ON schedule_entries (user_id, semester_id);
CREATE INDEX idx_schedule_entries_day ON schedule_entries (semester_id, day_of_week);
```

> Design note (§10.1 of the plan): storing both student classes and lecturer teaching in one generic table keeps the conflict query uniform — `EXISTS (SELECT 1 FROM schedule_entries WHERE user_id = ? AND day_of_week = ? AND (start_time, end_time) OVERLAPS (?, ?))`.

### 2.4 `schedule_imports` — audit trail for CSV ingestion (supports FR-5 endpoint `/schedule-imports`)

```sql
CREATE TYPE import_status AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE schedule_imports (
    id              bigserial PRIMARY KEY,
    semester_id     bigint NOT NULL REFERENCES semesters (id),
    uploaded_by     bigint NOT NULL REFERENCES users (id),
    original_filename varchar(255) NOT NULL,
    status          import_status NOT NULL DEFAULT 'QUEUED',
    rows_processed  int NOT NULL DEFAULT 0,
    rows_failed     int NOT NULL DEFAULT 0,
    error_log       jsonb,                        -- array of {row, message}
    created_at      timestamptz NOT NULL DEFAULT now(),
    completed_at    timestamptz
);
```

> `schedule_entries.import_batch_id` forward-references this table — in a real migration, create `schedule_imports` **before** `schedule_entries`, or add the FK in a later `ALTER TABLE`. Order noted here for readability only.

---

## 3. Slots & Bookings

### 3.1 `slots` — materialized concrete slots (design choice §10.1: materialized over computed-on-the-fly, for referenceable waitlist/allocation targets)

```sql
CREATE TYPE slot_status AS ENUM ('OPEN', 'FULL', 'CLOSED');

CREATE TABLE slots (
    id          bigserial PRIMARY KEY,
    lecturer_id bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    rule_id     bigint REFERENCES availability_rules (id) ON DELETE SET NULL, -- null if generated from an exception
    start_at    timestamptz NOT NULL,
    end_at      timestamptz NOT NULL,
    capacity    int NOT NULL DEFAULT 1 CHECK (capacity >= 1), -- 1 = single booking, N = group
    status      slot_status NOT NULL DEFAULT 'OPEN',
    CONSTRAINT chk_slot_time_order CHECK (end_at > start_at)
);

CREATE INDEX idx_slots_lecturer_start ON slots (lecturer_id, start_at);
CREATE INDEX idx_slots_status ON slots (status) WHERE status = 'OPEN';

-- A lecturer cannot have two overlapping slot definitions (independent of bookings)
ALTER TABLE slots ADD CONSTRAINT excl_slots_no_overlap
    EXCLUDE USING gist (
        lecturer_id WITH =,
        tstzrange(start_at, end_at) WITH &&
    );
```

### 3.2 `bookings` (FR-7, FR-9, FR-10; §9.3 state machine) — **the correctness centerpiece (NFR-2)**

```sql
CREATE TYPE booking_status AS ENUM (
    'PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'
);

CREATE TABLE bookings (
    id              bigserial PRIMARY KEY,
    slot_id         bigint NOT NULL REFERENCES slots (id) ON DELETE RESTRICT,
    student_id      bigint NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    semester_id     bigint NOT NULL REFERENCES semesters (id),
    status          booking_status NOT NULL DEFAULT 'PENDING',
    is_group        boolean NOT NULL DEFAULT false,
    topic           varchar(255),
    time_range      tstzrange NOT NULL,     -- denormalized copy of the slot's [start_at, end_at) for the EXCLUDE constraint
    decline_reason  varchar(255),
    created_at      timestamptz NOT NULL DEFAULT now(),
    confirmed_at    timestamptz,
    cancelled_at    timestamptz,
    cancelled_by    bigint REFERENCES users (id)
);

CREATE INDEX idx_bookings_student ON bookings (student_id, status);
CREATE INDEX idx_bookings_slot ON bookings (slot_id);
CREATE INDEX idx_bookings_semester ON bookings (semester_id);

-- THE double-booking guard (§10.1 design note):
-- No two CONFIRMED bookings for the same lecturer may have overlapping time ranges,
-- enforced at the storage layer — survives concurrent requests, not just app-level checks.
-- Requires a lecturer_id column reachable without a join; denormalize it onto bookings.
ALTER TABLE bookings ADD COLUMN lecturer_id bigint NOT NULL REFERENCES users (id);

ALTER TABLE bookings ADD CONSTRAINT excl_bookings_no_double_booking
    EXCLUDE USING gist (
        lecturer_id WITH =,
        time_range WITH &&
    ) WHERE (status = 'CONFIRMED');
```

> **Why denormalize `lecturer_id` and `time_range` onto `bookings`** instead of deriving them via a join to `slots`: PostgreSQL `EXCLUDE` constraints cannot reference columns through a join — the constrained columns must live on the table itself. A `BEFORE INSERT/UPDATE` trigger (or application-layer population) copies `slots.lecturer_id` / `tstzrange(slots.start_at, slots.end_at)` onto the new booking row at creation time. This is the concrete mechanism behind the sequence diagram in §9.1 ("INSERT booking (EXCLUDE constraint guards overlap)").

```sql
-- Populate denormalized fields automatically
CREATE OR REPLACE FUNCTION fn_bookings_denormalize_slot()
RETURNS trigger AS $$
BEGIN
    SELECT s.lecturer_id, tstzrange(s.start_at, s.end_at)
    INTO NEW.lecturer_id, NEW.time_range
    FROM slots s WHERE s.id = NEW.slot_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_denormalize_slot
    BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION fn_bookings_denormalize_slot();
```

### 3.3 `booking_participants` (FR-15, Stretch; UC5) — group bookings

```sql
CREATE TABLE booking_participants (
    booking_id  bigint NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
    student_id  bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    joined_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (booking_id, student_id)
);
```

> Capacity enforcement (`COUNT(participants) <= slots.capacity`) is application-layer or a trigger — not expressible as a plain CHECK across tables.

### 3.4 `meeting_records` (FR-10) — attendance & optional notes

```sql
CREATE TABLE meeting_records (
    id          bigserial PRIMARY KEY,
    booking_id  bigint NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
    attended    boolean NOT NULL,
    notes       text,          -- optional free text; explicitly NOT an LMS field (scope guard §5.3)
    recorded_at timestamptz NOT NULL DEFAULT now()
);
```

### 3.5 `recurring_bookings` (FR-16, Stretch) — standing weekly series

```sql
CREATE TABLE recurring_bookings (
    id              bigserial PRIMARY KEY,
    student_id      bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    lecturer_id     bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    semester_id     bigint NOT NULL REFERENCES semesters (id),
    day_of_week     smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      time NOT NULL,
    end_time        time NOT NULL,
    is_cancelled    boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_recurring_time_order CHECK (end_time > start_time)
);

-- Links each concrete weekly occurrence back to its series
ALTER TABLE bookings ADD COLUMN recurring_booking_id bigint REFERENCES recurring_bookings (id) ON DELETE SET NULL;
```

---

## 4. Waitlist & Allocation — the research backbone (§11)

### 4.1 `waitlist_entries` (FR-12, Stretch; UC3)

```sql
CREATE TYPE waitlist_status AS ENUM ('WAITING', 'OFFERED', 'EXPIRED', 'FULFILLED', 'CANCELLED');

CREATE TABLE waitlist_entries (
    id              bigserial PRIMARY KEY,
    slot_id         bigint NOT NULL REFERENCES slots (id) ON DELETE CASCADE,
    student_id      bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    requested_at    timestamptz NOT NULL DEFAULT now(),
    priority_score  numeric(10,4),          -- computed by the active allocation policy at evaluation time
    status          waitlist_status NOT NULL DEFAULT 'WAITING',
    offered_at      timestamptz,
    offer_expires_at timestamptz,
    UNIQUE (slot_id, student_id)             -- a student can only queue once per slot
);

CREATE INDEX idx_waitlist_slot_status ON waitlist_entries (slot_id, status);
CREATE INDEX idx_waitlist_student ON waitlist_entries (student_id, status);
```

### 4.2 `allocation_policies` (FR-13; UC12)

```sql
CREATE TABLE allocation_policies (
    id          bigserial PRIMARY KEY,
    name        varchar(30) NOT NULL UNIQUE CHECK (name IN ('FCFS', 'NEED', 'ROUND_ROBIN', 'HYBRID')),
    config      jsonb NOT NULL DEFAULT '{}', -- e.g. {"needWeight":0.5,"waitWeight":0.3,"randomWeight":0.2}
    is_active   boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX uq_allocation_policies_one_active ON allocation_policies (is_active) WHERE is_active = true;
```

### 4.3 `allocation_events` (FR-14; UC14) — **reproducibility backbone (NFR-3)**

```sql
CREATE TYPE allocation_decision AS ENUM ('SELECTED', 'SKIPPED', 'OVERRIDDEN');

CREATE TABLE allocation_events (
    id                  bigserial PRIMARY KEY,
    waitlist_entry_id   bigint NOT NULL REFERENCES waitlist_entries (id) ON DELETE CASCADE,
    policy_id           bigint REFERENCES allocation_policies (id),   -- NULL when decision = OVERRIDDEN (no policy ran)
    computed_score      numeric(10,4),                                -- NULL when decision = OVERRIDDEN
    decision            allocation_decision NOT NULL,
    random_seed         int,                                          -- NULL when decision = OVERRIDDEN
    overridden_by        bigint REFERENCES users (id),                -- admin who issued the override; set only when decision = OVERRIDDEN
    override_reason       varchar(255),                                -- set only when decision = OVERRIDDEN
    allocated_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_allocation_event_policy_fields CHECK (
        (decision <> 'OVERRIDDEN' AND policy_id IS NOT NULL AND computed_score IS NOT NULL AND random_seed IS NOT NULL
            AND overridden_by IS NULL AND override_reason IS NULL)
        OR
        (decision = 'OVERRIDDEN' AND overridden_by IS NOT NULL AND override_reason IS NOT NULL
            AND policy_id IS NULL AND computed_score IS NULL AND random_seed IS NULL)
    )
);

CREATE INDEX idx_allocation_events_waitlist ON allocation_events (waitlist_entry_id);
CREATE INDEX idx_allocation_events_policy_date ON allocation_events (policy_id, allocated_at);
CREATE INDEX idx_allocation_events_overridden ON allocation_events (overridden_by) WHERE decision = 'OVERRIDDEN';
```

> Every waitlist evaluation — winner *and* every candidate considered but skipped — gets a row here (`decision = SELECTED` vs `SKIPPED`), because the fairness study (§11.4) needs the full candidate set per run to compute Gini/variance, not just the winner.
>
> **`OVERRIDDEN` rows** are written when an Admin uses `POST /slots/{id}/override` to bypass the active policy (e.g., the policy misbehaves, or a lecturer objects to the algorithmic pick — Risk #1 mitigation). They carry no `policy_id`/`computed_score`/`random_seed` since no policy actually ran; the `chk_allocation_event_policy_fields` constraint enforces that the two field sets are mutually exclusive so a row can never claim both an algorithmic score and a human override. **Exclude `OVERRIDDEN` rows from `/research/experiments` metric computations by default** (`WHERE decision <> 'OVERRIDDEN'`) — they represent a human intervention, not policy output, and mixing them into Gini/variance calculations would silently bias the fairness comparison you're defending.

### 4.4 Research support tables (backing §11.4/§7.1 experiment endpoints — not core product data)

```sql
CREATE TABLE synthetic_demand_runs (
    id                  bigserial PRIMARY KEY,
    seed                int NOT NULL,
    popularity_skew     numeric(5,2),
    arrival_pattern     varchar(30),          -- e.g. 'POISSON', 'BURST_BEFORE_DEADLINE'
    num_students        int NOT NULL,
    num_lecturers       int NOT NULL,
    generated_at        timestamptz NOT NULL DEFAULT now(),
    dataset             jsonb NOT NULL         -- generated demand stream, or a pointer/URI to an external blob if large
);

CREATE TABLE experiments (
    id                  bigserial PRIMARY KEY,
    demand_run_id       bigint REFERENCES synthetic_demand_runs (id),
    policy_id           bigint NOT NULL REFERENCES allocation_policies (id),
    seed                int NOT NULL,
    gini_slots_per_student      numeric(6,4),
    gini_lecturer_access        numeric(6,4),
    max_min_ratio               numeric(10,4),
    slot_utilization_pct        numeric(5,2),
    avg_time_to_fill_seconds    int,
    offer_rejection_rate_pct    numeric(5,2),
    avg_wait_time_seconds       int,
    wait_time_variance          numeric(14,4),
    run_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_experiments_policy ON experiments (policy_id);
```

> `dataset jsonb` is fine at pilot scale (§11.4 "small but genuine" real data + synthetic stress runs); if synthetic runs grow large (the NFR-1 target is 10k lecturers / 100k students), swap for an external object store reference (`dataset_uri text`) rather than inflating Postgres rows.

---

## 5. Notifications (FR-11; UC15)

```sql
CREATE TABLE notifications (
    id          bigserial PRIMARY KEY,
    user_id     bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type        varchar(50) NOT NULL,   -- e.g. 'booking.confirmed', 'waitlist.offered'
    payload     jsonb NOT NULL DEFAULT '{}',
    read_at     timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON notifications (user_id) WHERE read_at IS NULL;
```

---

## 6. Full Table Inventory & Requirement Traceability

| Table | Source (FR / UC / ERD) | Notes |
|---|---|---|
| `users` | FR-1 | Root identity table; role enum drives RBAC |
| `semesters` | FR-2 | Single active semester enforced by partial unique index |
| `availability_rules` | FR-3, UC6 | Generates `slots` |
| `availability_exceptions` | FR-4, UC7 | `BLOCK`/`ADD`, applied at slot-generation time |
| `schedule_entries` | FR-5, UC10 | Generic busy blocks — students & lecturers alike |
| `schedule_imports` | FR-5, UC10 | CSV import audit trail |
| `slots` | §10.1 design note | Materialized, not computed-on-fly |
| `bookings` | FR-7–10, §9.3 | `EXCLUDE` constraint = the correctness centerpiece (NFR-2) |
| `booking_participants` | FR-15, UC5 | Group bookings |
| `meeting_records` | FR-10 | Attendance + optional notes (hard scope ceiling) |
| `recurring_bookings` | FR-16 | Standing weekly series |
| `waitlist_entries` | FR-12, UC3 | Research demand queue |
| `allocation_policies` | FR-13, UC12 | Pluggable, one active at a time |
| `allocation_events` | FR-14, UC14; Risk #1 mitigation | Reproducibility backbone (NFR-3); `OVERRIDDEN` decision backs the admin override endpoint |
| `synthetic_demand_runs`, `experiments` | §11.4 | Research-only, supports defense chapter |
| `notifications` | FR-11, UC15 | Backs both SSE stream and email trigger |

---

## 7. Key Design Decisions Worth Defending

1. **Exclusion constraint over application-layer locking** for double-booking (`bookings.excl_bookings_no_double_booking`) — correctness holds under concurrent requests without needing `SELECT ... FOR UPDATE` or distributed locks. Directly answers NFR-2.
2. **Denormalized `lecturer_id`/`time_range` on `bookings`**, populated by trigger — required because Postgres `EXCLUDE` constraints can't span a join to `slots`. Trade-off: a small sync-on-write cost for a storage-layer correctness guarantee.
3. **Materialized `slots`** over computed-on-the-fly — costs storage/regeneration complexity on rule edits, buys referenceable rows for waitlist/allocation-event foreign keys. Directly serves the research thread (§11).
4. **`allocation_events` logs `SKIPPED` candidates too**, not just winners — required for Gini/variance computation across the full candidate pool, not an audit nicety.
5. **`schedule_entries` is deliberately generic** (one table, not `student_classes` + `lecturer_teaching`) — keeps the conflict-detection query identical regardless of caller role.
6. **`OVERRIDDEN` is a decision outcome, not a bypass of the audit trail** — an admin override still produces an `allocation_events` row (via `chk_allocation_event_policy_fields`), just with `overridden_by`/`override_reason` instead of `policy_id`/`computed_score`/`random_seed`. This keeps NFR-3's "every decision is logged" guarantee true even when a human, not a policy, made the call — and gives the pilot an operational safety net (Risk #1: lecturer trust) without punching a hole in the research data's integrity, since `/research/experiments` filters overrides out by default.

---

## 8. Open Schema Questions (flag for Dev 1 before locking migrations)

1. **`citext` availability** — confirm the pilot Postgres install can enable `citext`, or fall back to the `LOWER(email)` unique-index pattern noted in §1.1.
2. **Capacity enforcement for group bookings** — a `CHECK` can't count sibling rows in `booking_participants`; decide between an `AFTER INSERT` trigger raising an exception, or application-layer enforcement with periodic reconciliation.
3. **`recurring_bookings` conflict semantics** — does a cancelled single occurrence of a recurring series get its own `bookings` row with `status = CANCELLED`, or is "skip this week" tracked separately from the `bookings` table? Current design assumes the former (simpler, consistent with the state machine in §9.3).
4. **Migration ordering** — `schedule_entries.import_batch_id` references `schedule_imports`, which is defined later in this document for readability; the actual Flyway migration must create `schedule_imports` first or add the FK via a later `ALTER TABLE`.
5. **Retention** — `allocation_events` and `notifications` grow unboundedly; decide a partitioning/archival strategy before the pilot's 4-week window if experiment volume is high (§11.4 synthetic stress runs could generate a lot of rows fast).
6. **Override authorization scope** — mirrors the open question in the API doc: should `overridden_by` be restricted to department-scoped admins at the query/service layer, or does the schema need an explicit `department` scoping column on `allocation_events` to enforce it at the data layer too?
