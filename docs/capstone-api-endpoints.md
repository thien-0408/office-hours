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
| POST | `/lecturers/{lecturerId}/availability-rules` | Lecturer (self) / Admin | `{ semesterId, dayOfWeek, startTime, endTime, slotMinutes, effectiveFrom, effectiveTo }`. Generates `SLOTS` rows per design note §10.1. |
| PATCH | `/availability-rules/{id}` | Lecturer (owner) / Admin | Edit a rule. Regenerates future, unbooked `SLOTS`. |
| DELETE | `/availability-rules/{id}` | Lecturer (owner) / Admin | Removes rule; cancels/blocks future unbooked slots it generated. |
| GET | `/lecturers/{lecturerId}/availability-exceptions` | Public/Authenticated | List one-off exceptions (`BLOCK`/`ADD`). |
| POST | `/lecturers/{lecturerId}/availability-exceptions` | Lecturer (self) / Admin | `{ exceptionDate, type: BLOCK|ADD, startTime, endTime, reason }`. |
| DELETE | `/availability-exceptions/{id}` | Lecturer (owner) / Admin | Remove an exception. |

Maps to `AVAILABILITY_RULES`, `AVAILABILITY_EXCEPTIONS`.

---

## 4. Schedule Import — Conflict Source (FR-5; UC10)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/schedule-imports` | Admin | `multipart/form-data`: CSV file + `semesterId`. Validated by MIME + schema per NFR-4. Async job; returns `{ importId, status: QUEUED }`. |
| GET | `/schedule-imports/{importId}` | Admin | Poll import status: `{ status: QUEUED\|PROCESSING\|COMPLETED\|FAILED, rowsProcessed, rowsFailed, errors[] }`. |
| GET | `/schedule-imports` | Admin | History of past imports. |
| GET | `/users/{userId}/schedule-entries` | Owner / Admin | List a user's busy blocks (classes/teaching) for the active semester. |
| POST | `/users/{userId}/schedule-entries` | Admin | Manually add one entry (fallback to bulk CSV). `{ semesterId, title, dayOfWeek, startTime, endTime, room }`. |
| DELETE | `/schedule-entries/{id}` | Admin | Remove a manually- or CSV-imported busy block. |

Maps to `SCHEDULE_ENTRIES`. Feeds conflict detection in §5.

---

## 5. Slots & Conflict-Aware Booking (FR-6, FR-7; UC1, UC2; workflow §9.1)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/lecturers/{lecturerId}/slots` | Authenticated | **Core query.** `?week=YYYY-Www` or `?from=&to=`. Returns bookable slots = availability − lecturer conflicts − existing bookings, further filtered against **the requesting student's** own `SCHEDULE_ENTRIES` so only conflict-free-for-this-student slots appear. Redis-cached with short TTL (§9.1). Target < 300 ms (NFR-1). |
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
| GET | `/bookings/recurring/{id}` | Owner / Admin | View the recurring series and its generated occurrences. |
| DELETE | `/bookings/recurring/{id}` | Owner / Admin | Cancel the series (future occurrences only). |

---

## 6. Waitlist (FR-12, Stretch — research vehicle; UC3)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/slots/{id}/waitlist` | Student | Join the waitlist for an oversubscribed/full slot. `{ }` (student inferred from token). Creates `WAITLIST_ENTRIES` row, `status: WAITING`. |
| GET | `/waitlist/me` | Student | List own waitlist entries across all slots, with position/estimated status. |
| GET | `/slots/{id}/waitlist` | Lecturer (owner) / Admin | View queue for a slot (for transparency/audit). |
| DELETE | `/waitlist/{id}` | Student (owner) | Leave the waitlist. → `status: CANCELLED`. |
| POST | `/waitlist/{id}/accept` | Student (owner, while `OFFERED`) | Accept an offered slot before expiry → creates `CONFIRMED` booking, `status: FULFILLED` (workflow §9.2). |
| POST | `/waitlist/{id}/decline` | Student (owner, while `OFFERED`) | Explicitly decline an offer → re-run allocation for next candidate. |

Maps to `WAITLIST_ENTRIES`.

---

## 7. Allocation Engine (FR-13, FR-14; UC12, UC14; research core §11)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/allocation-policies` | Admin | List available policies: `FCFS`, `NEED`, `ROUND_ROBIN`, `HYBRID`, each with `config` JSON and `isActive`. |
| POST | `/allocation-policies` | Admin | Register a new policy config (e.g., a tuned `HYBRID` weighting). |
| PATCH | `/allocation-policies/{id}` | Admin | Update `config` (weights, decay factors, randomization seed range). |
| POST | `/allocation-policies/{id}/activate` | Admin | UC12. Sets this policy `is_active = true` (only one active at a time, or per-department if extended). |
| POST | `/slots/{id}/run-allocation` | System (internal) / Admin (manual trigger for demo/testing) | UC14. Triggered automatically on cancel/decline, or manually invocable by Admin for the live policy-comparison demo (Risk #6 mitigation). Executes `allocate(slot, candidates, activePolicy)`, writes `ALLOCATION_EVENTS`, sends offer notification. |
| POST | `/slots/{id}/override` | Admin | **Manual override, bypasses the active policy.** `{ studentId, reason }`. Admin directly assigns the freed slot to a specific waitlisted (or new) student — e.g., the policy misbehaves, a lecturer objects to the algorithmic pick, or an edge case needs a human call during the pilot. Cancels any outstanding `OFFERED` waitlist entry for the slot, creates a `CONFIRMED` booking for `studentId`, and writes an `ALLOCATION_EVENTS` row with `decision: OVERRIDDEN` so the deviation is still logged and auditable — it does not bypass the reproducibility trail, only the automated selection. |
| GET | `/allocation-events` | Admin | Full audit log, filterable by `slotId`, `policyId`, `decision` (incl. `OVERRIDDEN`), `dateRange` — the reproducibility backbone (§10.1). |
| GET | `/allocation-events/{id}` | Admin | Single decision detail: `computedScore`, `decision`, `randomSeed`, `allocatedAt`, and — for `OVERRIDDEN` entries — `overriddenBy`, `overrideReason`. |

Maps to `ALLOCATION_POLICIES`, `ALLOCATION_EVENTS`. This cluster is the **research API surface** — every field here should be exposed because the defense chapter depends on being able to pull and replay this data (NFR-3). `OVERRIDDEN` events should be **excluded by default** from the fairness/efficiency metric computations in §7.1 (they're human interventions, not policy output) but retained in the raw log for operational transparency — flag this in the experiment query filters.

### 7.1 Research / Experiment Endpoints (supporting §11.4, not user-facing product features)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/research/synthetic-demand` | Admin (dev/research tooling) | `{ seed, popularitySkew, arrivalPattern, numStudents, numLecturers }`. Generates a synthetic demand stream for experiments; may be a batch job endpoint rather than sync REST if long-running. |
| POST | `/research/experiments` | Admin | `{ demandStreamId, policyIds[], seed }`. Replays the same demand stream through each listed policy. |
| GET | `/research/experiments/{id}` | Admin | Fetch computed metrics: Gini coefficient, max–min ratio, utilization, time-to-fill, wait-time variance per policy (§11.3). |
| GET | `/research/experiments/{id}/export` | Admin | Export raw results (CSV/JSON) for the notebook/plotting pipeline. |

---

## 8. Notifications (FR-11; UC15)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/notifications` | Authenticated | List own notifications, `?unreadOnly=true`. |
| POST | `/notifications/{id}/read` | Authenticated (owner) | Mark one as read. |
| POST | `/notifications/read-all` | Authenticated | Mark all read. |
| GET | `/notifications/stream` | Authenticated | **SSE** endpoint (`text/event-stream`) — push booking lifecycle & allocation-offer events in real time. Events: `booking.pending`, `booking.confirmed`, `booking.declined`, `booking.cancelled`, `waitlist.offered`, `waitlist.expired`. |

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
| GET | `/public/office-hours` | Public (no auth) | "Office hours this week" — read-only listing of open slots across all lecturers, `?department=`. No student/lecturer PII beyond lecturer name/department. |

---

## 11. Endpoint-to-Requirement Traceability

| FR / UC | Endpoints |
|---|---|
| FR-1 (auth/roles) | §1 |
| FR-2 (semesters) | §2 |
| FR-3, FR-4 (availability) | §3 |
| FR-5 (CSV import) | §4 |
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
