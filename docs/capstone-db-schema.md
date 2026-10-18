# OfficeHours — Database Schema Specification
### Derived from `capstone-officehours-plan.md` (Draft v0.2) — ERD §10, Design Notes §10.1

| | |
|---|---|
| **Engine** | PostgreSQL 15+ |
| **Required extensions** | `btree_gist` (exclusion constraints on scalar+range), `citext`; primary keys are `uuid DEFAULT gen_random_uuid()` (built into PostgreSQL 13+, no `pgcrypto` needed) |
| **Naming** | `snake_case`, singular column names, plural table names |
| **Timestamps** | `timestamptz` throughout — never naive `timestamp` (multi-timezone-safe even for a single-institution deploy) |
| **Source mapping** | Every table cites the FR / entity it implements from the plan |

> **Storage baseline — 15 October 2026.** This proposed DDL has not been applied via migration. It owns column names, nullability and constraints; the API baseline in `capstone-api-endpoints.md` owns JSON DTO names. `DB-SCHEMA-PROTOTYPE.md`, Word tables and draw.io are derived views, not competing schemas. Use `id` for entity PKs except shared `lecturer_profiles.user_id` and composite `booking_participants` keys.

---

## 0. Extensions & Setup

```sql
-- migration: V1__extensions.sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS citext;
```

`btree_gist` is required because the double-booking guard (§4.4) is a GiST exclusion constraint mixing an equality column (`lecturer_id`) with a range overlap (`time_range`) — plain `gist` alone doesn't index scalar equality efficiently, `btree_gist` bridges that. This is the single most defense-relevant line in the schema (NFR-2).

---

## 1. Identity & Org

### 1.1 `users` (FR-1)

```sql
CREATE TYPE user_role AS ENUM ('STUDENT', 'LECTURER', 'ADMIN');

CREATE TABLE users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email           citext NOT NULL UNIQUE,      -- requires citext extension; else use LOWER(email) unique index
    password_hash   text NOT NULL,                -- bcrypt/argon2, never plaintext (NFR-4)
    full_name       varchar(150) NOT NULL,
    role            user_role NOT NULL,
    department      varchar(100),
    notification_prefs jsonb NOT NULL DEFAULT '{"bookingConfirmed":true,"bookingDeclined":true,"waitlistOffer":true,"reminders":true}',
    is_active       boolean NOT NULL DEFAULT true, -- soft-delete flag
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_department ON users (department) WHERE department IS NOT NULL;
```

> Enable `citext` in the initial migration. `notification_prefs` contains the four boolean keys from `NotificationPrefs`; partial profile updates merge supplied keys and preserve others. JSON `active` maps from `is_active`.

### 1.1a `password_reset_tokens` (FR-1; backs `POST /auth/forgot-password` / `/auth/reset-password`)

```sql
CREATE TABLE password_reset_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  text NOT NULL UNIQUE,          -- SHA-256 of the raw token; raw value only ever exists in the emailed link
    expires_at  timestamptz NOT NULL,          -- created_at + 30 min
    used_at     timestamptz,                   -- set on successful reset; NULL = still redeemable
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens (user_id);
```

> One-time use, short TTL. On successful reset, all rows for the user (or at least all their refresh tokens) should be invalidated so a leaked old session can't survive a password change.

### 1.1c `refresh_tokens` (FR-1; backs `POST /auth/refresh` / `/auth/logout`)

```sql
CREATE TABLE refresh_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  text NOT NULL UNIQUE,          -- SHA-256 of the raw 256-bit token; the raw value lives only in the BFF's httpOnly cookie
    expires_at  timestamptz NOT NULL,          -- created_at + 30 days (matches the BFF cookie)
    revoked_at  timestamptz,                   -- set on rotation, logout, password change/reset, deactivation
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
```

> Server-side session registry (Postgres instead of Redis). `/auth/refresh` rotates: revokes the submitted row and inserts a new one. Presenting an already-revoked token revokes every token of that user (reuse detection). Logout, password change/reset and soft delete revoke all rows of the user.

### 1.1b `lecturer_profiles` (FR-6 support; backs `GET /lecturers`, `GET /lecturers/{id}`)

```sql
CREATE TABLE lecturer_profiles (
    user_id     uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    slug        varchar(80)  NOT NULL UNIQUE,   -- derived from full_name, e.g. 'amara-chen'; used in URLs
    photo_url   text,
    blurb       varchar(280),                   -- short description shown on the directory card
    specialty   varchar(100)                    -- e.g. 'Algorithms & Capstone' (feeds suggested-slot tags)
);
```

> `users` deliberately has no `slug`/`photo_url`/`blurb`; those exist only for lecturers. App-level guard (not expressible as a `CHECK` across tables): `user_id` must reference a user with `role = 'LECTURER'`.

### 1.2 `semesters` (FR-2)

```sql
CREATE TABLE semesters (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    semester_id     uuid NOT NULL REFERENCES semesters (id) ON DELETE CASCADE,
    day_of_week     smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- ISO: 1=Monday .. 7=Sunday (same as schedule_entries and the API/FE)
    start_time      time NOT NULL,
    end_time        time NOT NULL,
    slot_minutes    int NOT NULL CHECK (slot_minutes > 0),
    effective_from  date NOT NULL,
    effective_to    date,                       -- NULL = semester.end_date
    meeting_url     varchar(500),               -- optional online-meeting link (Meet/Zoom/Teams...), copied to generated slots
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_rule_time_order CHECK (end_time > start_time),
    CONSTRAINT chk_rule_meeting_url CHECK (meeting_url IS NULL OR meeting_url ~ '^https://'),
    CONSTRAINT chk_rule_effective_range CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_rule_slot_fits CHECK (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60 >= slot_minutes
    )
);

-- app-level guard: lecturer_id in this table must resolve to a user with role = LECTURER
-- (enforced in application/service layer or via trigger — Postgres CHECK cannot cross-reference another table)
-- Effective dates must be within the semester. Slot generation uses COALESCE(effective_to, semester.end_date).
-- The API's derived active flag compares the institution-local date to that effective interval.

CREATE INDEX idx_avail_rules_lecturer_semester ON availability_rules (lecturer_id, semester_id);
```

### 2.2 `availability_exceptions` (FR-4; UC7)

```sql
CREATE TYPE exception_type AS ENUM ('BLOCK', 'ADD');

CREATE TABLE availability_exceptions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    exception_date  date NOT NULL,
    type            exception_type NOT NULL,
    start_time      time NOT NULL,
    end_time        time NOT NULL,
    reason          varchar(255),
    meeting_url     varchar(500),               -- only meaningful for type = 'ADD'; copied to generated slots
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_exception_time_order CHECK (end_time > start_time),
    CONSTRAINT chk_exception_meeting_url CHECK (meeting_url IS NULL OR meeting_url ~ '^https://')
);

CREATE INDEX idx_avail_exceptions_lecturer_date ON availability_exceptions (lecturer_id, exception_date);
```

### 2.3 `schedule_entries` (FR-5; UC10) — generic busy blocks for both students and lecturers

```sql
CREATE TYPE schedule_location_type AS ENUM ('LAB', 'ROOM', 'ONLINE', 'OTHER');

CREATE TABLE schedule_entries (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    semester_id     uuid NOT NULL REFERENCES semesters (id) ON DELETE CASCADE,
    title           varchar(200) NOT NULL,      -- e.g. "Thiết kế trải nghiệm người dùng (CSW 437)"
    subject_code    varchar(30),                -- e.g. "CSW 437", "CSE 422"
    subject_name    varchar(150),               -- e.g. "Thiết kế trải nghiệm người dùng"
    group_code      varchar(20),                -- e.g. "E1", "01" (AAO course group)
    day_of_week     smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday (Thứ 2) .. 7=Sunday (Chủ Nhật)
    date_label      varchar(20),                -- e.g. "13/07" (scanned specific calendar date from column header)
    start_time      time NOT NULL,              -- 07:30 AM onward standard
    end_time        time NOT NULL,
    room            varchar(100),               -- e.g. "LAB405.B08", "213.B08", "ONLINE 3"
    location_type   schedule_location_type NOT NULL DEFAULT 'ROOM',
    lecturer_name   varchar(150),               -- e.g. "Dr. Amara Chen" or teaching instructor
    color_hue       varchar(20),                -- 'brand' | 'coral' | 'rose' | 'mint' | 'info' | 'warning'
    notes           text,                       -- optional user/import notes
    source          varchar(20) NOT NULL DEFAULT 'AAO_IMPORT', -- 'AAO_IMPORT' | 'MANUAL'
    import_batch_id uuid REFERENCES schedule_imports (id) ON DELETE SET NULL,
    CONSTRAINT chk_schedule_time_order CHECK (end_time > start_time)
);

CREATE INDEX idx_schedule_entries_user_semester ON schedule_entries (user_id, semester_id);
CREATE INDEX idx_schedule_entries_day ON schedule_entries (semester_id, day_of_week);
-- MERGE-mode de-duplication. UNIQUE (not just an index) so `INSERT ... ON CONFLICT DO NOTHING` can use it;
-- NULLS NOT DISTINCT (PostgreSQL 15+) so rows without a subject_code (MANUAL blocks) also collapse.
CREATE UNIQUE INDEX uq_schedule_entries_dedup ON schedule_entries (user_id, semester_id, day_of_week, start_time, end_time, subject_code) NULLS NOT DISTINCT;
```

> **Design notes (§10.1 of the plan):**
> 1. **Campus Shift Standard:** Timetable intervals align to the university 07:30 AM system divided into three shifts:
>    - **Ca Sáng (Morning Shift):** `07:30` – `12:30`
>    - **Ca Chiều (Afternoon Shift):** `12:30` – `16:30`
>    - **Ca Tối (Evening Shift):** `16:30` – `20:30`
> 2. **7-Day Support:** `day_of_week` spans 1 (Mon) to 7 (Sun) to fully support Saturday/Sunday lab sessions, capstone studios, and weekend seminars.
> 3. **Specific Date Association:** `date_label` preserves scanned calendar dates (e.g. `13/07`) directly from PDF headers.
> 4. **Batch Ingestion Modes:** `REPLACE` removes prior imported rows for the owner/semester and preserves `MANUAL`; `MERGE` appends. Both modes skip duplicate input and existing retained keys using `uq_schedule_entries_dedup`; normalize empty `subject_code` to NULL first. The browser parses PDFs; JSON batch validation and database deduplication remain server responsibilities.
> 5. **Uniform Conflict Detection:** Storing both student enrolled classes and lecturer teaching in one generic table keeps conflict queries uniform: `EXISTS (SELECT 1 FROM schedule_entries WHERE user_id = ? AND day_of_week = ? AND (start_time, end_time) OVERLAPS (?, ?))`.

### 2.4 `schedule_imports` — audit trail for timetable batches (supports FR-5 `POST /users/me/schedule-entries/batch`, FR-5a `POST /users/{userId}/schedule-entries/batch` and the history endpoints)

> **Import is client-parsed.** Validate first, then write `schedule_entries` and one `COMPLETED` batch audit in one transaction. No queue lifecycle in the MVP. Auth/schema/size rejection writes no audit; persistence failure rolls back all schedule changes and may record one `FAILED` audit in a separate transaction with mutation counts zero. Map `COMPLETED` to API `SUCCESS`, `created_at` to `importedAt`, and `rows_added/rows_skipped/rows_replaced` to the DTO counts. `QUEUED`/`PROCESSING` remain reserved for the deferred pipeline (§2.5).

```sql
CREATE TYPE import_status AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE import_mode AS ENUM ('REPLACE', 'MERGE');

CREATE TABLE schedule_imports (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id     uuid NOT NULL REFERENCES semesters (id),
    uploaded_by     uuid NOT NULL REFERENCES users (id),  -- who performed the upload
    target_user_id  uuid REFERENCES users (id),           -- whose schedule this import populates (NULL = self)
    source_files    text[] NOT NULL DEFAULT '{}',            -- original PDF names sent by the client (audit only)
    mode            import_mode NOT NULL DEFAULT 'REPLACE', -- 'REPLACE' or 'MERGE'
    status          import_status NOT NULL DEFAULT 'COMPLETED',
    rows_processed  int NOT NULL DEFAULT 0,                 -- rows received in the payload
    rows_added      int NOT NULL DEFAULT 0,                 -- rows inserted into schedule_entries
    rows_replaced   int NOT NULL DEFAULT 0,                 -- previously imported rows removed by REPLACE
    rows_failed     int NOT NULL DEFAULT 0,
    rows_skipped    int NOT NULL DEFAULT 0,                 -- duplicate count skipped during MERGE mode
    error_log       jsonb,                                  -- array of {row, message}
    created_at      timestamptz NOT NULL DEFAULT now(),
    completed_at    timestamptz
);
```

> `schedule_entries.import_batch_id` forward-references this table — in a real migration, create `schedule_imports` **before** `schedule_entries`, or add the FK in a later `ALTER TABLE`. Order noted here for readability only.
>
> `uploaded_by` records who sent the batch. `target_user_id` is already part of this schema: NULL for self-service, the named owner when an Admin imports on their behalf. One audit row covers all `source_files`; do not split it into per-file records.

### 2.5 `schedule_import_staging` — **DEFERRED / not planned for the MVP.** Temporary buffer for server-side massive ingestion

> Only needed if an Admin must ingest department-wide PDFs without a browser parse (see `capstone-api-endpoints.md` §4.3). Do **not** create this table in the first migrations; it is kept as a design sketch.

```sql
CREATE TYPE staging_row_status AS ENUM ('VALID', 'DUPLICATE', 'CONFLICT', 'INVALID');

CREATE TABLE schedule_import_staging (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    import_batch_id uuid NOT NULL REFERENCES schedule_imports (id) ON DELETE CASCADE,
    temp_row_num    int NOT NULL,
    user_id         uuid REFERENCES users (id) ON DELETE CASCADE,
    semester_id     uuid NOT NULL REFERENCES semesters (id) ON DELETE CASCADE,
    title           varchar(200) NOT NULL,
    subject_code    varchar(30),
    subject_name    varchar(150),
    group_code      varchar(20),
    day_of_week     smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    date_label      varchar(20),
    start_time      time NOT NULL,
    end_time        time NOT NULL,
    room            varchar(100),
    location_type   schedule_location_type NOT NULL DEFAULT 'ROOM',
    lecturer_name   varchar(150),
    status          staging_row_status NOT NULL DEFAULT 'VALID',
    conflict_notes  text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staging_batch_status ON schedule_import_staging (import_batch_id, status);
```

> **Ingestion & Commit Pattern (deferred — not part of the MVP):**
> 1. Ingestion workers stream PDF pages and bulk-insert raw records into `schedule_import_staging`.
> 2. An automated staging query flags duplicates and conflicts against existing `schedule_entries`.
> 3. After client review (`GET /preview`), the commit endpoint executes:
>    ```sql
>    INSERT INTO schedule_entries (user_id, semester_id, title, subject_code, subject_name, group_code, day_of_week, date_label, start_time, end_time, room, location_type, lecturer_name, source, import_batch_id)
>    SELECT user_id, semester_id, title, subject_code, subject_name, group_code, day_of_week, date_label, start_time, end_time, room, location_type, lecturer_name, 'AAO_IMPORT', import_batch_id
>    FROM schedule_import_staging
>    WHERE import_batch_id = :batchId AND status = 'VALID'
>    ON CONFLICT (user_id, semester_id, day_of_week, start_time, end_time, subject_code) DO NOTHING;
>    ```
> 4. The staging rows are cleared automatically upon completion.

---

## 3. Slots & Bookings

### 3.1 `slots` — materialized concrete slots (design choice §10.1: materialized over computed-on-the-fly, for referenceable waitlist/allocation targets)

```sql
CREATE TYPE slot_status AS ENUM ('OPEN', 'FULL', 'CLOSED');

CREATE TABLE slots (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    rule_id     uuid REFERENCES availability_rules (id) ON DELETE SET NULL, -- null if generated from an exception
    start_at    timestamptz NOT NULL,
    end_at      timestamptz NOT NULL,
    capacity    int NOT NULL DEFAULT 1 CHECK (capacity >= 1), -- 1 = single booking, N = group
    status      slot_status NOT NULL DEFAULT 'OPEN',
    meeting_url varchar(500),                   -- copied from the rule/ADD exception at generation time; null = in person
    CONSTRAINT chk_slot_time_order CHECK (end_at > start_at),
    CONSTRAINT chk_slot_meeting_url CHECK (meeting_url IS NULL OR meeting_url ~ '^https://')
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
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id         uuid NOT NULL REFERENCES slots (id) ON DELETE RESTRICT,
    student_id      uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    semester_id     uuid NOT NULL REFERENCES semesters (id),
    status          booking_status NOT NULL DEFAULT 'PENDING',
    is_group        boolean NOT NULL DEFAULT false,
    topic           varchar(255),
    time_range      tstzrange NOT NULL,     -- denormalized copy of the slot's [start_at, end_at) for the EXCLUDE constraint
    decline_reason  varchar(255),
    meeting_url     varchar(500),           -- optional per-booking override of slots.meeting_url (effective link = COALESCE(bookings, slots))
    created_at      timestamptz NOT NULL DEFAULT now(),
    confirmed_at    timestamptz,
    cancelled_at    timestamptz,
    cancelled_by    uuid REFERENCES users (id),
    CONSTRAINT chk_booking_meeting_url CHECK (meeting_url IS NULL OR meeting_url ~ '^https://')
);

CREATE INDEX idx_bookings_student ON bookings (student_id, status);
CREATE INDEX idx_bookings_slot ON bookings (slot_id);
CREATE INDEX idx_bookings_semester ON bookings (semester_id);

-- THE double-booking guard (§10.1 design note):
-- No two CONFIRMED bookings for the same lecturer may have overlapping time ranges,
-- enforced at the storage layer — survives concurrent requests, not just app-level checks.
-- Requires a lecturer_id column reachable without a join; denormalize it onto bookings.
ALTER TABLE bookings ADD COLUMN lecturer_id uuid NOT NULL REFERENCES users (id);

ALTER TABLE bookings ADD CONSTRAINT excl_bookings_no_double_booking
    EXCLUDE USING gist (
        lecturer_id WITH =,
        time_range WITH &&
    ) WHERE (status = 'CONFIRMED');
```

> **Only `CONFIRMED` rows are constrained.** Several `PENDING` bookings may target the same slot. The first successful confirm also declines its competing PENDING rows atomically; a later confirm of a loser returns `409 SLOT_ALREADY_CONFIRMED`. An exclusion violation aborts the PostgreSQL transaction: roll back/retry before any further writes, or serialize transitions on the slot row. The constraint remains the final overlap guard.

> **Why denormalize `lecturer_id` and `time_range` onto `bookings`** instead of deriving them via a join to `slots`: PostgreSQL `EXCLUDE` constraints cannot reference columns through a join. The `BEFORE INSERT` trigger below copies the slot's lecturer and interval. A booking's slot reference and a booked slot's lecturer/interval are immutable; reschedule cancels and creates a new booking atomically rather than changing `slot_id` on the old row.

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
    booking_id  uuid NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
    student_id  uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    joined_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (booking_id, student_id)
);
```

> Capacity is `1 + COUNT(booking_participants) <= slots.capacity` because the requester is the first attendee. Enforce it in a service transaction holding the slot-row lock before participant changes (§8); a plain cross-table CHECK cannot express it. The requester must not also be inserted as an additional participant.
>
> **Decided — add by email.** The API takes `participantEmails[]` (what `ParticipantManager` collects) and the backend resolves each to an existing `users.id` before inserting into this table. An unresolvable email fails the request with `422` (no account auto-provisioning, no invite table in the MVP).

### 3.4 `meeting_records` (FR-10) — attendance & optional notes

```sql
CREATE TABLE meeting_records (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id  uuid NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
    attended    boolean NOT NULL,
    notes       text,          -- optional free text; explicitly NOT an LMS field (scope guard §5.3)
    recorded_at timestamptz NOT NULL DEFAULT now()
);
```

### 3.5 `recurring_bookings` (FR-16, Stretch) — standing weekly series

```sql
CREATE TABLE recurring_bookings (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    lecturer_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    semester_id     uuid NOT NULL REFERENCES semesters (id),
    day_of_week     smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- ISO: 1=Monday .. 7=Sunday
    start_time      time NOT NULL,
    end_time        time NOT NULL,
    is_cancelled    boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_recurring_time_order CHECK (end_time > start_time)
);

-- Links each concrete weekly occurrence back to its series
ALTER TABLE bookings ADD COLUMN recurring_booking_id uuid REFERENCES recurring_bookings (id) ON DELETE SET NULL;
```

---

## 4. Waitlist & Allocation — the research backbone (§11)

### 4.1 `waitlist_entries` (FR-12, Stretch; UC3)

```sql
CREATE TYPE waitlist_status AS ENUM ('WAITING', 'OFFERED', 'EXPIRED', 'FULFILLED', 'CANCELLED');

CREATE TABLE waitlist_entries (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id         uuid NOT NULL REFERENCES slots (id) ON DELETE CASCADE,
    student_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    requested_at    timestamptz NOT NULL DEFAULT now(),
    priority_score  numeric(10,4),          -- last-computed score for this entry, written whenever allocation runs against it (see note below)
    status          waitlist_status NOT NULL DEFAULT 'WAITING',
    offered_at      timestamptz,
    offer_expires_at timestamptz,
    UNIQUE (slot_id, student_id)             -- a student can only queue once per slot
);

CREATE INDEX idx_waitlist_slot_status ON waitlist_entries (slot_id, status);
CREATE INDEX idx_waitlist_student ON waitlist_entries (student_id, status);
```

> A waitlist entry belongs to one concrete slot (`slot_id`); the UI's "position" and slot label are **derived on read** (rank by `requested_at`/`priority_score` among `WAITING` entries of that slot) — there is no `position` column. A scheduled job moves `OFFERED` entries past `offer_expires_at` to `EXPIRED` and re-runs allocation.
>
> **Resolved:** `priority_score` caches the most recent policy evaluation. Every SELECTED/SKIPPED event writes the same score to this cache and the permanent `allocation_events` row in one transaction. It is not a continuously changing independent score; a new entry has NULL until evaluated.

### 4.2 `allocation_policies` (FR-13; UC12)

```sql
CREATE TABLE allocation_policies (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar(30) NOT NULL UNIQUE CHECK (name IN ('FCFS', 'NEED', 'ROUND_ROBIN', 'HYBRID')),
    config      jsonb NOT NULL DEFAULT '{}', -- HYBRID: {"needWeight":0.5,"waitTimeWeight":0.3,"fairnessWeight":0.2} (matches the FE's getMockAllocationPolicies()/admin allocation page field names — NOT "waitWeight"/"randomWeight", an earlier naming this doc used that the FE didn't follow)
    is_active   boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX uq_allocation_policies_one_active ON allocation_policies (is_active) WHERE is_active = true;
```

### 4.3 `allocation_events` (FR-14; UC14) — **reproducibility backbone (NFR-3)**

```sql
CREATE TYPE allocation_decision AS ENUM ('SELECTED', 'SKIPPED', 'OVERRIDDEN');

CREATE TABLE allocation_events (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    waitlist_entry_id   uuid NOT NULL REFERENCES waitlist_entries (id) ON DELETE CASCADE,
    policy_id           uuid REFERENCES allocation_policies (id),   -- NULL when decision = OVERRIDDEN (no policy ran)
    computed_score      numeric(10,4),                                -- NULL when decision = OVERRIDDEN
    decision            allocation_decision NOT NULL,
    random_seed         int,                                          -- NULL when decision = OVERRIDDEN. One seed per allocation RUN (i.e. per slot free-up event), shared by every SELECTED/SKIPPED row that run produces — not a fresh seed per candidate. This is what makes a run replayable: re-running allocate(slot, sameCandidates, config, seed) must reproduce the same winner. Distinct from experiments.seed/synthetic_demand_runs.seed (§4.4), which seed an entire synthetic demand stream, not a single allocation decision.
    overridden_by        uuid REFERENCES users (id),                -- admin who issued the override; set only when decision = OVERRIDDEN
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
> An override for a student not previously waitlisted must create/reuse that student's slot-specific waitlist entry before inserting the event; `waitlist_entry_id` remains NOT NULL. Any Admin has global override authority for the MVP, while normal conflict/capacity checks still apply.
>
> **`OVERRIDDEN` rows** are written when an Admin uses `POST /slots/{id}/override` to bypass the active policy (e.g., the policy misbehaves, or a lecturer objects to the algorithmic pick — Risk #1 mitigation). They carry no `policy_id`/`computed_score`/`random_seed` since no policy actually ran; the `chk_allocation_event_policy_fields` constraint enforces that the two field sets are mutually exclusive so a row can never claim both an algorithmic score and a human override. **Exclude `OVERRIDDEN` rows from `/research/experiments` metric computations by default** (`WHERE decision <> 'OVERRIDDEN'`) — they represent a human intervention, not policy output, and mixing them into Gini/variance calculations would silently bias the fairness comparison you're defending.

### 4.4 Research support tables (backing §11.4/§7.1 experiment endpoints — not core product data)

```sql
CREATE TABLE synthetic_demand_runs (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seed                int NOT NULL,
    popularity_skew     numeric(5,2),
    arrival_pattern     varchar(30),          -- e.g. 'POISSON', 'BURST_BEFORE_DEADLINE'
    num_students        int NOT NULL,
    num_lecturers       int NOT NULL,
    generated_at        timestamptz NOT NULL DEFAULT now(),
    dataset             jsonb NOT NULL         -- generated demand stream, or a pointer/URI to an external blob if large
);

CREATE TABLE experiment_groups (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    demand_run_id       uuid NOT NULL REFERENCES synthetic_demand_runs (id),
    seed                int NOT NULL,
    run_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE experiments (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_group_id uuid NOT NULL REFERENCES experiment_groups (id) ON DELETE CASCADE,
    policy_id           uuid NOT NULL REFERENCES allocation_policies (id),
    policy_order        smallint NOT NULL CHECK (policy_order BETWEEN 0 AND 3),
    gini_slots_per_student      numeric(6,4),
    gini_lecturer_access        numeric(6,4),
    max_min_ratio               numeric(10,4),
    pct_students_with_slot      numeric(5,2),        -- % of the candidate population that won >= 1 slot — plan.md §11.3's 4th fairness metric ("% of students who got >= 1 slot"), missing from earlier drafts of this table
    slot_utilization_pct        numeric(5,2),
    avg_time_to_fill_seconds    int,
    offer_rejection_rate_pct    numeric(5,2),
    avg_wait_time_seconds       int,
    wait_time_variance          numeric(14,4),
    UNIQUE (experiment_group_id, policy_id),
    UNIQUE (experiment_group_id, policy_order)
);

CREATE INDEX idx_experiments_policy ON experiments (policy_id);
```

> `dataset jsonb` is fine at pilot scale (§11.4 "small but genuine" real data + synthetic stress runs); if synthetic runs grow large (the NFR-1 target is 10k lecturers / 100k students), swap for an external object store reference (`dataset_uri text`) rather than inflating Postgres rows.
>
> **Experiment identity:** API `Experiment.id` is `experiment_groups.id`; `demandRunId`, `seed` and `runAt` come from that parent. `policyNames` and `results[]` come from its `experiments` rows joined to policies, ordered by zero-based `policy_order`. Create the parent and all requested results atomically; never infer groups from equal seeds/timestamps. Child uniqueness prevents duplicate policy results/orders. Research remains a stretch module.

---

## 5. Notifications (FR-11; UC15)

```sql
CREATE TABLE notifications (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type        varchar(50) NOT NULL,   -- catalogue: booking.pending | booking.confirmed | booking.declined | booking.cancelled | waitlist.offered | waitlist.expired | reminder.upcoming (see API doc §8)
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
| `password_reset_tokens` | FR-1 | Hashed, expiring, single-use password-reset tokens |
| `refresh_tokens` | FR-1 | Hashed refresh-token sessions; rotation + revoke-all on logout/password change |
| `lecturer_profiles` | FR-6 | slug / photo / blurb for the lecturer directory (1-to-1 with a LECTURER user) |
| `semesters` | FR-2 | Single active semester enforced by partial unique index |
| `availability_rules` | FR-3, UC6 | Generates `slots` |
| `availability_exceptions` | FR-4, UC7 | `BLOCK`/`ADD`, applied at slot-generation time |
| `schedule_entries` | FR-5, UC10 | Generic busy blocks — students & lecturers alike |
| `schedule_imports` | FR-5, UC10 | Timetable batch import audit trail (client-parsed JSON) |
| `slots` | §10.1 design note | Materialized, not computed-on-fly |
| `bookings` | FR-7–10, §9.3 | `EXCLUDE` constraint = the correctness centerpiece (NFR-2) |
| `booking_participants` | FR-15, UC5 | Group bookings |
| `meeting_records` | FR-10 | Attendance + optional notes (hard scope ceiling) |
| `recurring_bookings` | FR-16 | Standing weekly series |
| `waitlist_entries` | FR-12, UC3 | Research demand queue |
| `allocation_policies` | FR-13, UC12 | Pluggable, one active at a time |
| `allocation_events` | FR-14, UC14; Risk #1 mitigation | Reproducibility backbone (NFR-3); `OVERRIDDEN` decision backs the admin override endpoint |
| `synthetic_demand_runs`, `experiment_groups`, `experiments` | §11.4 | Research-only; one parent group has one result per requested policy |
| `notifications` | FR-11, UC15 | Backs both SSE stream and email trigger |

---

## 7. Key Design Decisions Worth Defending

1. **Exclusion constraint over application-layer locking** for double-booking (`bookings.excl_bookings_no_double_booking`) — correctness holds under concurrent requests without needing `SELECT ... FOR UPDATE` or distributed locks. Directly answers NFR-2.
2. **Denormalized `lecturer_id`/`time_range` on `bookings`**, populated by trigger — required because Postgres `EXCLUDE` constraints can't span a join to `slots`. Trade-off: a small sync-on-write cost for a storage-layer correctness guarantee.
3. **Materialized `slots`** over computed-on-the-fly — costs storage/regeneration complexity on rule edits, buys referenceable rows for waitlist/allocation-event foreign keys. Directly serves the research thread (§11).
4. **`allocation_events` logs `SKIPPED` candidates too**, not just winners — required for Gini/variance computation across the full candidate pool, not an audit nicety.
5. **`schedule_entries` is deliberately generic** (one table, not `student_classes` + `lecturer_teaching`) — keeps the conflict-detection query identical regardless of caller role. This genericness is also what makes self-service student/lecturer import a zero-schema-change feature: the same row shape is produced regardless of uploader role.
6. **`OVERRIDDEN` is a decision outcome, not a bypass of the audit trail** — an admin override still produces an `allocation_events` row (via `chk_allocation_event_policy_fields`), just with `overridden_by`/`override_reason` instead of `policy_id`/`computed_score`/`random_seed`. This keeps NFR-3's "every decision is logged" guarantee true even when a human, not a policy, made the call — and gives the pilot an operational safety net (Risk #1: lecturer trust) without punching a hole in the research data's integrity, since `/research/experiments` filters overrides out by default.

---

## 8. Resolved migration decisions and operational follow-ups

1. **`citext` — resolved:** enable it in V1 alongside `btree_gist`.
2. **Group capacity — resolved:** service transactions lock the slot row before participant changes and enforce total attendees ≤ capacity. The requester counts as one attendee and is not duplicated in `booking_participants`; that table stores additional students. A rejected addition returns `409`; no periodic reconciliation is the correctness mechanism.
3. **Recurring cancellation — resolved:** cancelling one occurrence keeps its booking row with `status = CANCELLED`; cancelling a series cancels future occurrences only, preserving past records.
4. **Migration ordering** — `schedule_entries.import_batch_id` references `schedule_imports`, which is defined later in this document for readability; the actual Flyway migration must create `schedule_imports` first or add the FK via a later `ALTER TABLE`.
5. **Retention** — `allocation_events` and `notifications` grow unboundedly; decide a partitioning/archival strategy before the pilot's 4-week window if experiment volume is high (§11.4 synthetic stress runs could generate a lot of rows fast).
6. **Override authorization scope — resolved:** any Admin globally for the MVP, with actor/reason audit and ordinary conflict/capacity checks. No department scoping column is required.
7. **Import ownership vs uploader** — resolved: `schedule_imports.target_user_id` (§2.4) is NULL for self-service and set when an Admin imports for a user. A fresh import defaults to `REPLACE` for that user and semester (keeps `MANUAL` blocks), which avoids stale duplicates; `MERGE` is opt-in.
8. **AAO export file format** — resolved: **PDF only**, parsed in the browser (`lib/timetable/parse-pdf.ts`); the backend receives validated JSON rows (`capstone-api-endpoints.md` §4). The "CSV" wording in older drafts of the plan was stale.

9. **Day-of-week convention** — resolved: ISO `1`–`7` (Mon–Sun) in every table (`availability_rules`, `recurring_bookings`, `schedule_entries`), in the API and in the FE.
