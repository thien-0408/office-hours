# OfficeHours — API Endpoint Specification
### Derived from `capstone-officehours-plan.md` (Draft v0.1)

| | |
|---|---|
| **Base URL (dev)** | `http://localhost:8080/api/v1` |
| **Auth** | JWT bearer token (`Authorization: Bearer <token>`) unless marked `Public` |
| **Format** | JSON request/response; timestamps in ISO-8601 UTC (`timestamptz`) |
| **Roles** | `STUDENT` · `LECTURER` · `ADMIN` · `SYSTEM` (internal jobs, not externally callable) |
| **Source mapping** | Each endpoint cites the FR / UC / entity it implements from the plan |

> This document is a proposed contract, not yet implemented. Endpoint shapes follow REST conventions consistent with the ERD (§10) and workflows (§9) in the plan. Adjust once the Spring Boot controllers exist.

---

## 0. Conventions

- **Pagination:** list endpoints accept `?page=0&size=20&sort=field,dir` (Spring Data default) and return `{ content[], totalElements, totalPages, page, size }`.
- **Errors:** RFC 7807-style problem JSON — `{ status, error, message, path, timestamp, details? }`.
- **Idempotency:** mutating POSTs that create bookings/allocations accept an optional `Idempotency-Key` header to guard against double-submit on flaky networks.
- **Concurrency:** booking creation relies on a DB exclusion constraint (§10.1); a 409 response means "lost the race," not a client bug — the FE should re-fetch slots.
- **RBAC:** every endpoint enforces role at minimum; row-level checks (e.g., a student can only cancel their own booking) are noted per-endpoint. Maps to NFR-4.

---

## 1. Auth & Accounts (FR-1)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account. Body: `{ email, password, fullName, role, department? }`. `role` self-select may be restricted to `STUDENT`/`LECTURER`; `ADMIN` created by seed/another admin only. |
| POST | `/auth/login` | Public | `{ email, password }` → `{ accessToken, refreshToken, expiresIn, user }`. |
| POST | `/auth/refresh` | Public | `{ refreshToken }` → new access token. |
| POST | `/auth/logout` | Authenticated | Invalidate refresh token (server-side blacklist in Redis). |
| POST | `/auth/forgot-password` | Public | `{ email }` → always `202` regardless of whether the email exists (no account enumeration). If the account exists, generates a single-use, short-lived (30 min) reset token, stores its hash (never the raw token) against the user, and emails a link `{FRONTEND_URL}/reset-password?token=...`. |
| POST | `/auth/reset-password` | Public | `{ token, newPassword }`. Validates token (unexpired, unused, hash match) → updates `password_hash`, marks token used, invalidates all existing refresh tokens for the user (forces re-login everywhere). `400` for invalid/expired/already-used token. |
| GET | `/users/me` | Authenticated | Current user profile. |
| PATCH | `/users/me` | Authenticated | Update own `fullName`, `department`, notification prefs. |
| POST | `/users/me/change-password` | Authenticated | `{ oldPassword, newPassword }`. |
| GET | `/users` | Admin | List/search users, filter by `role`, `department`. |
| GET | `/users/{id}` | Admin | Fetch a specific user. |
| PATCH | `/users/{id}` | Admin | Edit role/department (admin override). |
| DELETE | `/users/{id}` | Admin | Deactivate (soft-delete) a user. |

Maps to `USERS` entity (§10). Passwords bcrypt/argon2-hashed per NFR-4.

---

## 2. Semesters (FR-2)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/semesters` | Authenticated | List all semesters. |
| GET | `/semesters/active` | Authenticated | The current active semester (used to scope most other calls). |
| POST | `/semesters` | Admin | `{ name, startDate, endDate }`. |
| PATCH | `/semesters/{id}` | Admin | Update dates/name. |
| POST | `/semesters/{id}/activate` | Admin | Marks this semester `is_active = true`, deactivates others. |
| DELETE | `/semesters/{id}` | Admin | Only if no dependent data (or soft-delete). |

Maps to `SEMESTERS` entity.

---

## 3. Availability Management (FR-3, FR-4; UC6, UC7)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/lecturers/{lecturerId}/availability-rules` | Public/Authenticated | List recurring weekly rules for a lecturer (scoped to active semester by default; `?semesterId=`). |
| POST | `/lecturers/{lecturerId}/availability-rules` | Lecturer (self) / Admin | `{ semesterId, dayOfWeek, startTime, endTime, slotLengthMinutes, effectiveFrom, effectiveTo }`. Generates `SLOTS` rows per design note §10.1. (Field is `slotLengthMinutes`, not `slotMinutes` — matches the FE's `AvailabilityRule` type in `lib/office-hours/types.ts`, though that type doesn't carry `semesterId` client-side since it's scoped by the active-semester context instead.) |
| PATCH | `/availability-rules/{id}` | Lecturer (owner) / Admin | Edit a rule. Regenerates future, unbooked `SLOTS`. |
| DELETE | `/availability-rules/{id}` | Lecturer (owner) / Admin | Removes rule; cancels/blocks future unbooked slots it generated. |
| GET | `/lecturers/{lecturerId}/availability-exceptions` | Public/Authenticated | List one-off exceptions (`BLOCK`/`ADD`). |
| POST | `/lecturers/{lecturerId}/availability-exceptions` | Lecturer (self) / Admin | `{ date, type: BLOCK|ADD, startTime, endTime, reason }`. (Field is `date`, not `exceptionDate` — matches the FE's `AvailabilityException` type; the DB column itself is `exception_date` per `capstone-db-schema.md` §2.2, so the API layer is expected to rename on the way out.) |
| DELETE | `/availability-exceptions/{id}` | Lecturer (owner) / Admin | Remove an exception. |

Maps to `AVAILABILITY_RULES`, `AVAILABILITY_EXCEPTIONS`.

---

## 4. Schedule Import — Conflict Source (FR-5, FR-5a; UC10)

Self-service by default: students and lecturers each upload their **own** official AAO (Academic Affairs Office) timetable export. Trust doesn't depend on who uploads — every import path validates that the file is a genuine AAO export (format/signature + MIME + schema per NFR-4) and rejects anything else, so a student's own upload is exactly as trustworthy as an admin's. Admin's role is a support fallback (upload on a user's behalf) and oversight (aggregated view), not the sole ingestion path.

**Timetable Standard & Ingestion Features:**
- **07:30 AM Shift Standard:** Divided into Ca Sáng (`07:30–12:30`), Ca Chiều (`12:30–16:30`), and Ca Tối (`16:30–20:30`).
- **7-Day Support:** Day indices 1 (Thứ 2) to 7 (Chủ Nhật), accommodating weekend labs and seminars.
- **Specific Date Scanner:** Extracts column header dates (e.g. `Thứ 2 (13/07)`) into `dateLabel`.
- **Multi-File & Ingestion Modes:** Supports batch uploads (e.g., lecture PDF + lab PDF) with `mode: REPLACE` (replaces old imported blocks while keeping manual ones) or `mode: MERGE` (deduplicates identical sessions).

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/users/me/schedule-imports` | Student / Lecturer | `multipart/form-data`: 1 or more AAO timetable PDFs (`files[]`), `semesterId`, `mode: REPLACE\|MERGE`. Parser validates genuine AAO export; extracts course codes, groups, rooms, instructors, shift, and date labels. Async job; returns `{ importId, status: QUEUED, addedCount, skippedCount }`. |
| GET | `/users/me/schedule-imports/{importId}` | Student / Lecturer (owner) | Poll own import status: `{ status: QUEUED\|PROCESSING\|COMPLETED\|FAILED, rowsProcessed, rowsFailed, rowsSkipped, errors[] }`. |
| GET | `/users/me/schedule-imports` | Student / Lecturer | Own import history. **Not yet backed by any FE mock** — the current stand-in, `getMockMyScheduleImportHistory()` (`lib/office-hours/mock-data.ts`), always returns `[]`, and the only related type, `ScheduleImportHistoryEntry`, models a different, simpler shape (`fileName`, `importedAt`, `rowCount`, `status: SUCCESS\|FAILED`) than this section's async-job fields (`importId`, `rowsProcessed`/`rowsFailed`/`rowsSkipped`, `errors[]`). Flag for Dev 3/4: either the FE import-history UI needs to grow to match this doc's richer job shape, or this doc should shrink to match the simpler shape actually rendered today — currently neither side has converged. |
| GET | `/users/me/schedule-entries` | Student / Lecturer | List own busy blocks (classes/teaching) for the active semester with full metadata (`title`, `subjectCode`, `subjectName`, `group`, `room`, `locationType: LAB\|ROOM\|ONLINE\|OTHER`, `lecturerName`, `dayOfWeek: 1-7`, `date`, `startTime`, `endTime`, `colorHue`, `notes`, `source: IMPORTED\|MANUAL`). Field names/values here match the FE's `ScheduleBlock` type (`lib/office-hours/types.ts`) rather than the DB column names in `capstone-db-schema.md` §2.3 (`group_code`→`group`, `date_label`→`date`, `AAO_IMPORT`→`IMPORTED`) — the API layer is expected to do that renaming; treat the FE names as this endpoint's actual response contract. |
| DELETE | `/schedule-entries/{id}` | Owner / Admin | Remove a busy block — the owning user or admin. |
| POST | `/schedule-imports` | Admin | Admin uploads AAO exports **on behalf of** a user who can't self-serve. Body adds `targetUserId`, `mode`. |
| GET | `/schedule-imports` | Admin | Aggregated import history across all users (oversight). |
| GET | `/users/{userId}/schedule-entries` | Owner / Admin | List a specific user's busy blocks (classes/teaching) for the active semester — admin support/oversight view. |
| POST | `/users/{userId}/schedule-entries` | Admin | Manually add one entry (fallback for a user who can't self-serve). `{ semesterId, title, dayOfWeek, startTime, endTime, room, locationType?, lecturerName? }`. |

### 4.1 Large-Scale & Massive Timetable Ingestion Architecture

When ingesting university-wide or department-level AAO timetable PDFs (e.g. 50–200 pages with 10,000+ to 100,000+ course sessions), the API implements a **staged, asynchronous producer-consumer pipeline** to avoid HTTP timeouts, OOM errors, and database lock contention:

```
[Client Upload] ──> [202 Accepted + Job ID] ──> [Worker Pool (Streaming PDF Parse)]
                                                              │
                                                              ▼
[Atomic Commit] <── [Paginated Staging Preview] <── [Staging DB + Deduplication Index]
```

#### Ingestion Lifecycle Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/schedule-imports/jobs` | Admin / Faculty Lead | **Initiate Bulk Ingestion.** Accepts massive PDF files (`files[]`) or a pre-signed storage URL. Returns `202 Accepted` with `{ importJobId, status: "QUEUED", totalFiles }`. Spawns streaming worker job. |
| GET | `/schedule-imports/jobs/{id}/progress` | Owner / Admin | **Live Progress Stream (SSE).** Server-Sent Events stream: `{ phase: "PARSING"\|"DEDUPLICATING"\|"READY_FOR_REVIEW", percentComplete, pagesProcessed, totalPages, extractedRows, duplicateCount, errorCount }`. |
| GET | `/schedule-imports/jobs/{id}/preview` | Owner / Admin | **Paginated Staging Inspection.** `?page=0&size=50&filterStatus=VALID,CONFLICT,DUPLICATE`. Returns parsed entries from staging table with conflict flags, shift tags, and duplicate references before writing to master tables. |
| POST | `/schedule-imports/jobs/{id}/commit` | Owner / Admin | **Atomic Staged Commit.** `{ action: "COMMIT"\|"ROLLBACK", resolutionStrategy: "SKIP_DUPLICATES"\|"OVERWRITE", excludedTempIds[] }`. Uses PostgreSQL `COPY` or `JdbcTemplate.batchUpdate()` with batch size 1000 for high-throughput bulk insertion. |
| POST | `/users/me/schedule-entries/batch` | Student / Lecturer | **Client Fast-Path (Self-Service).** For single student/lecturer schedules (1-2 pages), the frontend parses the PDF in browser via Web Worker (`pdfjs-dist`) and sends pre-structured JSON directly, offloading 100% of parse CPU from the backend. |

Maps to `SCHEDULE_ENTRIES`, `SCHEDULE_IMPORTS`, and `SCHEDULE_IMPORT_STAGING`. Feeds conflict detection in §5.

---

## 5. Slots & Conflict-Aware Booking (FR-6, FR-7; UC1, UC2; workflow §9.1)

### 5.0 Lecturer Directory & Proactive Suggestions (FR-6 support; Pages.txt #10)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/lecturers` | Authenticated | Browse/search lecturers — the entry point into slot browsing. `?q=` (free-text over name + department), `?department=` (exact match), `?dayOfWeek=1-7` (Mon=1..Sun=7 — only lecturers with ≥1 remaining open slot that weekday), `?availableOnly=true` (has any open slot left this week). Returns `{ content: Lecturer[], totalElements, totalPages, page, size }` per §0 pagination convention, where `Lecturer = { id, slug, name, department, photoUrl, blurb }`. |
| GET | `/lecturers/{id}` | Authenticated | Single lecturer profile (same `Lecturer` shape) — backs the slot-picker page header. |
| GET | `/users/me/suggested-slots` | Student | **Proactive Recommendation Feed.** Surfaces verified conflict-free open slots across faculty advisors (checked against the student's 07:30 AM class schedule). Filterable by `?category=ALL\|CS\|MATH\|SOON`, where `MATH` is actually a "Math & Physics" bucket that also folds in Economics (department name matches "math", "physic", or "econ" — see the FE's `SuggestedSlotsCard.tsx`, whose own tab label reads "Math & Physics"; consider renaming the query value to match once the backend exists). Returns `{ id, lecturerId, lecturerName, department, photoUrl, startAt, endAt, dayOfWeek, dayLabel, formattedTime, specialtyTag, blurb, isConflictFree }` — `dayOfWeek` (1-7, used for conflict-day filtering) and `blurb` (short lecturer description, part of the shape though not yet rendered by the card) were missing from earlier drafts of this row. The FE card caps display at 6 results (`.slice(0, 6)`); paginate server-side if the real feed can exceed that. Powers the student dashboard 1-click booking card. |

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/lecturers/{lecturerId}/slots` | Authenticated | **Core query.** `?week=YYYY-Www` or `?from=&to=`. Returns bookable slots = availability − lecturer conflicts − existing bookings, further filtered against **the requesting student's** own `SCHEDULE_ENTRIES` (populated by the student's own AAO import per §4) so only conflict-free-for-this-student slots appear. Redis-cached with short TTL (§9.1). Target < 300 ms (NFR-1). |
| GET | `/slots/{id}` | Authenticated | Slot detail incl. `status: OPEN\|FULL\|CLOSED`, capacity, current waitlist count. |
| GET | `/slots` | Admin | Cross-lecturer slot search/filter (for analytics/ops). |
| POST | `/bookings` | Student | `{ slotId, topic, participantIds? }`. Server re-validates conflicts server-side (never trust cached FE view). DB `EXCLUDE` constraint guards overlap under concurrency. Returns `201` with `status: PENDING`, or `409` (slot taken — race) with `{ waitlistAvailable: true }`, or `422` (conflict detected). |
| GET | `/bookings` | Authenticated | List own bookings (student) or bookings-to-review (lecturer), filterable by `status`. Admin can filter by any user. |
| GET | `/bookings/{id}` | Owner (student/lecturer) / Admin | Booking detail. |
| POST | `/bookings/{id}/confirm` | Lecturer (owner of slot) | UC8. → `status: CONFIRMED`; notifies student. |
| POST | `/bookings/{id}/decline` | Lecturer (owner of slot) | `{ reason? }`. → `status: DECLINED`; notifies student; may trigger waitlist allocation (§7) if others are queued. |
| POST | `/bookings/{id}/cancel` | Student or Lecturer (participant) | FR-9. Enforces configurable notice-period rule (reject if inside window, unless Admin override). → `status: CANCELLED`; triggers waitlist allocation if slot had a queue. |
| POST | `/bookings/{id}/reschedule` | Student | `{ newSlotId }`. Equivalent to cancel + create, executed atomically; subject to same conflict checks and notice-period rule. |
| POST | `/bookings/{id}/complete` | Lecturer | Marks a past `CONFIRMED` booking `COMPLETED` (or auto-job does this after `end_at`). |
| POST | `/bookings/{id}/no-show` | Lecturer | FR-10. → `status: NO_SHOW`. |
| PATCH | `/bookings/{id}/meeting-record` | Lecturer | `{ attended, notes? }`. Optional text field only — explicitly **not** an LMS field (§5.3 scope guard). |

Maps to `SLOTS`, `BOOKINGS`, `MEETING_RECORDS`. State machine per §9.3.

### 5.1 Group Bookings (FR-15, Stretch; UC5)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/bookings/group` | Student | `{ slotId, topic, participantStudentIds[] }`. Requires slot `capacity > 1`. Creates one `BOOKINGS` row + `BOOKING_PARTICIPANTS` rows. |
| POST | `/bookings/{id}/participants` | Student (existing participant) | Add a participant to an existing group booking (capacity permitting). |
| DELETE | `/bookings/{id}/participants/{studentId}` | Student (self) / Admin | Leave/remove from a group booking. |

### 5.2 Recurring Bookings (FR-16, Stretch)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/bookings/recurring` | Student | `{ lecturerId, dayOfWeek, startTime, endTime, semesterId }`. Creates a standing weekly booking across the semester, each occurrence subject to normal conflict checks; skips weeks with lecturer exceptions. |
| GET | `/bookings/recurring` | Student | List own recurring series (active + cancelled) — powers the series list on the recurring-booking setup page (Pages.txt #14). |
| GET | `/bookings/recurring/{id}` | Owner / Admin | View the recurring series and its generated occurrences. |
| DELETE | `/bookings/recurring/{id}` | Owner / Admin | Cancel the series (future occurrences only). |

---

## 6. Waitlist (FR-12, Stretch — research vehicle; UC3)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/slots/{id}/waitlist` | Student | Join the waitlist for an oversubscribed/full slot. `{ }` (student inferred from token). Creates `WAITLIST_ENTRIES` row, `status: WAITING`. |
| GET | `/waitlist/me` | Student | List own waitlist entries across all slots, with position/estimated status. |
| GET | `/slots/{id}/waitlist` | Lecturer (owner) / Admin | View queue for a slot (for transparency/audit). |
| GET | `/lecturers/me/slot-waitlist` | Lecturer | Aggregate, read-only queue transparency across all of the lecturer's own upcoming slots, grouped by slot (Pages.txt #20) — distinct from the single-slot `GET /slots/{id}/waitlist` above, which this list-view is built from. |
| DELETE | `/waitlist/{id}` | Student (owner) | Leave the waitlist. → `status: CANCELLED`. |
| POST | `/waitlist/{id}/accept` | Student (owner, while `OFFERED`) | Accept an offered slot before expiry → creates `CONFIRMED` booking, `status: FULFILLED` (workflow §9.2). |
| POST | `/waitlist/{id}/decline` | Student (owner, while `OFFERED`) | Explicitly decline an offer → re-run allocation for next candidate. |

Maps to `WAITLIST_ENTRIES`.

---

## 7. Allocation Engine (FR-13, FR-14; UC12, UC14; research core §11)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/allocation-policies` | Admin | List available policies: `FCFS`, `NEED`, `ROUND_ROBIN`, `HYBRID`, each with `config` JSON (e.g. `HYBRID`: `{ needWeight, waitTimeWeight, fairnessWeight }` — matches capstone-db-schema.md §4.2) and `isActive`. |
| POST | `/allocation-policies` | Admin | Register a new policy config (e.g., a tuned `HYBRID` weighting). |
| PATCH | `/allocation-policies/{id}` | Admin | Update `config` (weights, decay factors, randomization seed range). |
| POST | `/allocation-policies/{id}/activate` | Admin | UC12. Sets this policy `is_active = true`. **Global, single active policy** — the schema's `uq_allocation_policies_one_active` unique index is unscoped (no `department` column). Per-department policies were floated as a stretch idea but are explicitly cut from scope, not deferred: no doc models a department-scoped policy and none should be assumed. |
| POST | `/slots/{id}/run-allocation` | System (internal) / Admin (manual trigger for demo/testing) | UC14. Triggered automatically on cancel/decline, or manually invocable by Admin for the live policy-comparison demo (Risk #6 mitigation). Executes `allocate(slot, candidates, activePolicy)`, writes `ALLOCATION_EVENTS`, sends offer notification. |
| POST | `/slots/{id}/override` | Admin | **Manual override, bypasses the active policy.** `{ studentId, reason }`. Admin directly assigns the freed slot to a specific waitlisted (or new) student — e.g., the policy misbehaves, a lecturer objects to the algorithmic pick, or an edge case needs a human call during the pilot. Cancels any outstanding `OFFERED` waitlist entry for the slot, creates a `CONFIRMED` booking for `studentId`, and writes an `ALLOCATION_EVENTS` row with `decision: OVERRIDDEN` so the deviation is still logged and auditable — it does not bypass the reproducibility trail, only the automated selection. |
| GET | `/allocation-events` | Admin | Full audit log, filterable by `slotId`, `policyId`, `decision` (incl. `OVERRIDDEN`), `dateRange` — the reproducibility backbone (§10.1). |
| GET | `/allocation-events/{id}` | Admin | Single decision detail: `computedScore`, `decision`, `randomSeed`, `allocatedAt`, and — for `OVERRIDDEN` entries — `overriddenBy`, `overrideReason`. (The FE's `AllocationEvent` type names the field `overriddenByName` — a display name, not the `overridden_by` FK id from `capstone-db-schema.md` §4.3. Decide whether the API returns the id, the name, or both; the FE currently only needs the name for display.) |

Maps to `ALLOCATION_POLICIES`, `ALLOCATION_EVENTS`. This cluster is the **research API surface** — every field here should be exposed because the defense chapter depends on being able to pull and replay this data (NFR-3). `OVERRIDDEN` events should be **excluded by default** from the fairness/efficiency metric computations in §7.1 (they're human interventions, not policy output) but retained in the raw log for operational transparency — flag this in the experiment query filters.

### 7.1 Research / Experiment Endpoints (supporting §11.4, not user-facing product features)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/research/synthetic-demand` | Admin (dev/research tooling) | `{ seed, popularitySkew, arrivalPattern, numStudents, numLecturers }`. Generates a synthetic demand stream for experiments; may be a batch job endpoint rather than sync REST if long-running. |
| POST | `/research/experiments` | Admin | `{ demandRunId, policyNames[], seed }`. Replays the same demand stream through each listed policy. (FE's `Experiment` type uses `demandRunId`/`policyNames: AllocationPolicyName[]` — not `demandStreamId`/`policyIds` — since policies are looked up by their fixed `FCFS\|NEED\|ROUND_ROBIN\|HYBRID` name rather than a numeric id in the client-side model.) |
| GET | `/research/experiments/{id}` | Admin | Fetch computed metrics: Gini coefficient, max–min ratio, utilization, time-to-fill, wait-time variance per policy (§11.3). |
| GET | `/research/experiments/{id}/export` | Admin | Export raw results (CSV/JSON) for the notebook/plotting pipeline. |

---

## 8. Notifications (FR-11; UC15)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/notifications` | Authenticated | List own notifications, `?unreadOnly=true`. |
| POST | `/notifications/{id}/read` | Authenticated (owner) | Mark one as read. |
| POST | `/notifications/read-all` | Authenticated | Mark all read. |
| GET | `/notifications/stream` | Authenticated | **SSE** endpoint (`text/event-stream`) — push booking lifecycle & allocation-offer events in real time. Events: `booking.pending`, `booking.confirmed`, `booking.declined`, `booking.cancelled`, `waitlist.offered`, `waitlist.expired`. (The FE's `NotificationType` enum — `BOOKING_CONFIRMED\|BOOKING_DECLINED\|BOOKING_CANCELLED\|WAITLIST_OFFERED\|REMINDER` — only covers a subset: no `booking.pending`/`waitlist.expired` equivalent exists yet, and `REMINDER` isn't in this doc's event list at all. Reconcile before the backend locks the event catalogue — likely `booking.pending` and `waitlist.expired` notifications, and a `reminder.*` event, are all still missing from one side or the other.) |

Backing delivery (not directly called by FE, triggered internally on lifecycle events per §9.1/§9.2):
- Email via SMTP for the same event set — no separate REST surface, fired server-side alongside the SSE push and `NOTIFICATIONS` row insert.

Maps to `NOTIFICATIONS`.

---

## 9. Admin Analytics (FR-17, Stretch; UC13)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/admin/analytics/advisor-load` | Admin | Bookings/hours per lecturer over a date range — load-balancing view. |
| GET | `/admin/analytics/no-show-rate` | Admin | No-show % overall, by lecturer, by department. |
| GET | `/admin/analytics/equity` | Admin | Access-equity dashboard: Gini coefficient of slots-per-student and lecturer-access-per-student, live-computed or backed by latest `/research/experiments` run. |
| GET | `/admin/analytics/policy-comparison` | Admin | Live side-by-side metrics for the active vs. alternative policies — powers the demo simulation (Risk #6 mitigation). |

---

## 10. Public Read-Only View (FR-18, Stretch)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/public/office-hours` | Public (no auth) | "Office hours this week" — read-only listing of open (`slots.status = 'OPEN'`) slots across all lecturers, bounded to the current week, `?department=` (exact match, optional) `&page=&size=` (§0 pagination convention). Returns `{ content: PublicSlot[], totalElements, totalPages, page, size }` where `PublicSlot = { lecturerName, department, startAt, endAt }`. No student/lecturer PII beyond lecturer name/department — no email, no booking/student data joined in. |

---

## 11. Endpoint-to-Requirement Traceability

| FR / UC | Endpoints |
|---|---|
| FR-1 (auth/roles) | §1 |
| FR-2 (semesters) | §2 |
| FR-3, FR-4 (availability) | §3 |
| FR-5 (self-service AAO import) | §4 `POST /users/me/schedule-imports` |
| FR-5a (admin schedule support/oversight) | §4 `POST /schedule-imports`, `POST /users/{userId}/schedule-entries` |
| FR-6 (lecturer discovery) | `GET /lecturers`, `GET /lecturers/{id}` (§5.0) |
| FR-6 (bookable slots) | `GET /lecturers/{id}/slots` |
| FR-7 (conflict-safe booking) | `POST /bookings` |
| FR-8 (confirm/decline) | `POST /bookings/{id}/confirm`\|`decline` |
| FR-9 (cancel/reschedule) | `POST /bookings/{id}/cancel`\|`reschedule` |
| FR-10 (attendance) | `POST /bookings/{id}/complete`\|`no-show` |
| FR-11 (notifications) | §8 |
| FR-12 (waitlist) | §6 |
| FR-13 (pluggable policy) | §7 |
| FR-14 (allocation audit log) | `GET /allocation-events*` |
| Risk #1 mitigation (admin trust/safety net) | `POST /slots/{id}/override` |
| FR-15 (group bookings) | §5.1 |
| FR-16 (recurring bookings) | §5.2 |
| FR-17 (admin analytics) | §9 |
| FR-18 (public view) | §10 |

---

## 12. Open Design Questions (flag for the team before locking the contract)

1. **Slot listing scope** — should `GET /lecturers/{id}/slots` require auth (to compute per-student conflicts) or offer an unauthenticated "raw availability" mode? Currently modeled as requiring auth for the conflict-aware view, with §10 offering an unauthenticated aggregate alternative.
2. **Allocation trigger visibility** — is `POST /slots/{id}/run-allocation` ever called by anything other than the system job? If not, it may not need to exist as a REST endpoint at all outside of the demo/admin use case — worth cutting if unused, per the "no speculative endpoints" principle.
3. **Reschedule vs. cancel+create** — decide whether reschedule is truly atomic (one endpoint) or a documented client-side pattern (two calls) — affects whether the exclusion constraint needs to span both operations in one transaction.
4. **SSE vs. polling fallback** — confirm PWA offline/backgrounded behavior doesn't require a polling `GET /notifications?since=` fallback in addition to `/notifications/stream`.
5. **Override authorization scope** — should `POST /slots/{id}/override` be limited to department-scoped admins, or does any Admin have global override rights? Also decide whether the affected lecturer/bumped student get a distinct notification copy ("an administrator reassigned this slot") vs. the standard offer/confirmation text, since silently reusing normal booking-confirmed language could be misleading about how the decision was made.
