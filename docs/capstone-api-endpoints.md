# OfficeHours — API Endpoint Specification
### Derived from `capstone-officehours-plan.md` (Draft v0.2)

| | |
|---|---|
| **Base URL (dev)** | `http://localhost:8080/api/v1` |
| **Auth** | JWT bearer token (`Authorization: Bearer <token>`) unless marked `Public` |
| **Format** | JSON request/response; timestamps in ISO-8601 UTC (`timestamptz`) |
| **Roles** | `STUDENT` · `LECTURER` · `ADMIN` · `SYSTEM` (internal jobs, not externally callable) |
| **Source mapping** | Each endpoint cites the FR / UC / entity it implements from the plan |

> **Contract baseline — 15 October 2026.** This document defines the wire contract; `capstone-db-schema.md` defines storage, and `lib/auth/types.ts` / `lib/office-hours/types.ts` define the corresponding frontend DTOs. The Vietnamese guide and generated diagrams summarize these sources. Earlier audit/report notes are historical and do not override this baseline. The backend is not implemented in this repository. Change these sources together when revising a contract.

---

## 0. Conventions

- **Pagination:** list endpoints accept `?page=0&size=20&sort=field,dir` (Spring Data default) and return `{ content[], totalElements, totalPages, page, size }`.
- **Errors:** RFC 7807-style problem JSON — `{ status, code, error, message, path, timestamp, details? }`. `code` is the numeric absolute error code (error-domain base + relative code, ranges per module); `error` is the stable machine key (e.g. `INVALID_CREDENTIALS`, `SLOT_ALREADY_CONFIRMED`); `message` is human-readable English. Clients branch on `error`/`code`, never on `message`. Success responses are the DTO itself (no envelope).
  - **Aggregated errors (reported once):** bean validation lists every invalid/missing field in one `400` — `error: "VALIDATION_FAILED"`, `details.errors[{ field, code, error, message }]` (e.g. `FIELD_REQUIRED`). Independent business checks are collected server-side; two or more → `400`, `error: "MULTIPLE_ERRORS"`, `details.errors[{ code, error, message, context? }]`; exactly one keeps its own status/key.
- **Idempotency:** mutating POSTs that create bookings/allocations accept an optional `Idempotency-Key` header to guard against double-submit on flaky networks.
- **Concurrency:** booking creation relies on a DB exclusion constraint (§10.1); a 409 response means "lost the race," not a client bug — the FE should re-fetch slots.
- **Day of week:** every `dayOfWeek` in this API, the DB and the FE is **ISO — `1` = Monday … `7` = Sunday**. (An earlier draft used `0` = Sunday for availability/recurring; that was dropped to match `schedule_entries` and the FE.)
- **Time zone:** timestamps are UTC; availability-rule `time` values are the institution's local time (`Asia/Ho_Chi_Minh`, UTC+7, no DST) and are converted when slots are generated.
- **RBAC:** every endpoint enforces role at minimum; row-level checks (e.g., a student can only cancel their own booking) are noted per-endpoint. Maps to NFR-4.

### 0.1 Resolved field and response contracts

| Concern | Contract |
|---|---|
| API prefix | `API_BASE_URL=http://localhost:8080/api/v1`, with no trailing slash; server fetches append paths such as `/auth/login`. |
| Identifiers | Every `id` and named reference (`slotId`, `lecturerId`, etc.) is a **UUID string** in JSON and `uuid` in the DB (`gen_random_uuid()`); path params such as `/users/{id}` are UUIDs, malformed → `400`. DB entity PKs are `id`, except shared `lecturer_profiles.user_id` and composite `booking_participants(booking_id, student_id)`. Generated diagrams use the same columns. |
| Active flags | JSON uses `active` for users, semesters and allocation policies; DB uses `is_active`. Availability-rule `active` is derived from the current institution-local date and effective range. |
| Availability end | `effectiveTo` is an ISO date or `null`; `null` means through that rule's semester `endDate`. Store NULL and use the semester end when generating slots; reject ranges outside the semester. |
| Collection shapes | Paginated resources use §0's envelope. Calendar rules/exceptions, weekly slots, schedule blocks, own import history, recurring series, own waitlist, lecturer queue groups, policies and policy-comparison rows return arrays as specified by their DTOs. Admin import history is paginated. |
| Error details | `ProblemDetail` uses the fields above. Validation errors are `details: { errors: [{ rowIndex?, field, message }] }`; `rowIndex` is zero-based. Booking races use `details.waitlistAvailable`; confirmation conflicts use `error: "SLOT_ALREADY_CONFIRMED"`. |
| Notification types | REST `Notification.type` uses the uppercase FE enum in §8. DB types and SSE `event:` names use dotted names. SSE `data:` is the same `Notification` DTO as REST. |
| Override actor | `AllocationEvent` returns `overriddenByName` and `overrideReason` (null for policy decisions). Actor identity is persisted as `allocation_events.overridden_by`; a numeric actor ID is not currently part of this display DTO. |
| Scope | Group/recurring, waitlist/allocation, analytics, research and public listing retain their documented stretch priorities. Documenting a contract does not require implementing every stretch endpoint for the first backend milestone. Server PDF ingestion/staging is deferred. |

DTO optional fields may be omitted; fields explicitly typed `T | null` must be present and nullable. Do not expose raw database rows as responses.

---

## 1. Auth & Accounts (FR-1)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | `{ email, password, fullName, role, department? }` → `201 AuthUser` (no tokens). Only `STUDENT`/`LECTURER` may self-register; `ADMIN` is created by seed/another admin only. |
| POST | `/auth/login` | Public | `{ email, password }` → `{ accessToken, refreshToken, expiresIn, user }`. |
| POST | `/auth/refresh` | Public | `{ refreshToken }` → `200 { accessToken, refreshToken, expiresIn }` (`RefreshResponse`, expiry in seconds). Rotate and revoke the submitted refresh token (sessions stored hashed in `refresh_tokens`; reusing a revoked token revokes all of the user's sessions); all three response fields are required by the BFF cookie writer. |
| POST | `/auth/logout` | Authenticated | Bearer token, no body → `204` without a response body. Revoke the authenticated user's refresh sessions (`refresh_tokens` table). The BFF clears both cookies even if revocation is unavailable. |
| POST | `/auth/forgot-password` | Public | `{ email }` → always `202` regardless of whether the email exists (no account enumeration). If the account exists, generates a single-use, short-lived (30 min) reset token, stores its hash (never the raw token) against the user, and emails a link `{FRONTEND_URL}/reset-password?token=...`. |
| POST | `/auth/reset-password` | Public | `{ token, newPassword }`. Validates token (unexpired, unused, hash match) → updates `password_hash`, marks token used, invalidates all existing refresh tokens for the user (forces re-login everywhere). `400` for invalid/expired/already-used token. |
| GET | `/users/me` | Authenticated | `200 UserProfile`: `AuthUser` fields plus all four `notificationPrefs` booleans. |
| PATCH | `/users/me` | Authenticated | Partial `{ fullName?, department?, notificationPrefs? }` (`UpdateProfilePayload`). Merge supplied preference keys and preserve others. → `200 UserProfile`. |
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
| GET | `/lecturers/{lecturerId}/availability-rules` | Authenticated | List recurring weekly rules for a lecturer (scoped to active semester by default; `?semesterId=`). |
| POST | `/lecturers/{lecturerId}/availability-rules` | Lecturer (self) / Admin | `{ semesterId, dayOfWeek, startTime, endTime, slotLengthMinutes, effectiveFrom, effectiveTo, meetingUrl? }`. Generates `SLOTS` rows per design note §10.1. (Field is `slotLengthMinutes`, not `slotMinutes` — matches the FE's `AvailabilityRule` type in `lib/office-hours/types.ts`, though that type doesn't carry `semesterId` client-side since it's scoped by the active-semester context instead.) |
| PATCH | `/availability-rules/{id}` | Lecturer (owner) / Admin | Edit a rule. Regenerates future, unbooked `SLOTS`. |
| DELETE | `/availability-rules/{id}` | Lecturer (owner) / Admin | Removes rule; cancels/blocks future unbooked slots it generated. |
| GET | `/lecturers/{lecturerId}/availability-exceptions` | Authenticated | List one-off exceptions (`BLOCK`/`ADD`). |
| POST | `/lecturers/{lecturerId}/availability-exceptions` | Lecturer (self) / Admin | `{ date, type: BLOCK|ADD, startTime, endTime, reason, meetingUrl? }` (`meetingUrl` only applies to `ADD`). (Field is `date`, not `exceptionDate` — matches the FE's `AvailabilityException` type; the DB column itself is `exception_date` per `capstone-db-schema.md` §2.2, so the API layer is expected to rename on the way out.) |
| DELETE | `/availability-exceptions/{id}` | Lecturer (owner) / Admin | Remove an exception. |

`dayOfWeek` is ISO `1`–`7` (Mon–Sun), not `0`–`6`. `effectiveTo: null` means the semester end (§0.1). When generating slots: apply the rule, subtract `BLOCK` exceptions, add `ADD` exceptions, then subtract the lecturer's own `schedule_entries` (teaching). Editing/deleting a rule must never touch slots that already have a booking.

**Online meeting link (`meetingUrl`).** The platform does not host video; a lecturer pastes a Meet/Zoom/Teams link once per rule (or per `ADD` exception) and slot generation copies it to `slots.meeting_url`. It is optional (`null` = in person), must be an absolute `https://` URL of ≤ 500 chars, and is not restricted to specific domains. Editing a rule's link updates future unbooked slots only; a lecturer may override the link of a single booking via `PATCH /bookings/{id}` (§5). The booking DTO exposes the effective link `bookings.meeting_url ?? slots.meeting_url`, and only to the booking's participants, the slot's lecturer and Admin (never in the public slot listing before a booking is confirmed).

Maps to `AVAILABILITY_RULES`, `AVAILABILITY_EXCEPTIONS`.

---

## 4. Schedule Import — Conflict Source (FR-5, FR-5a; UC10)

**Decision: the browser parses the PDF; the backend only receives and stores JSON.** Students and lecturers each import their **own** official AAO (Academic Affairs Office) timetable. The Next.js client reads the PDF(s) in a Web Worker (`pdfjs-dist`, `lib/timetable/parse-pdf.ts`), gathers **every parsed row from every file into one array**, and sends that array in a single request. The backend therefore has no PDF/OCR pipeline, no upload storage and no async job — it validates the payload, applies the import mode and writes `schedule_entries`.

**Trust model.** The backend can no longer verify that a file is a genuine AAO export, and it does not need to: a user can only write to **their own** timetable (or, for an Admin, a named target user's), so the worst case is a user mis-describing their own busy time. What the backend **must** do instead is treat the payload as untrusted input:

- validate every row against the JSON schema below (types, enums, `dayOfWeek` 1–7, `HH:mm` times, `startTime < endTime`, string length caps);
- cap request size at 2 000 rows and 1 MiB (1 048 576 bytes); oversized bodies → `413`, row-count/schema violations → `422`;
- derive the owner from the token (`/users/me/...`) or from the path for Admin — **never** from a `userId` in the body;
- apply `mode` and de-duplication server-side (never trust client-side dedup);
- validate the whole batch before modifying schedules; any invalid row rejects the entire batch with `422` and `details.errors[] = { rowIndex, field, message }` (zero-based row indexes). No partial schedule writes. An authenticated, schema-valid batch that fails during persistence may be recorded as a separate `FAILED` audit entry after rollback; authentication/schema/size rejection creates no import record.

**Timetable standard (unchanged):**
- **07:30 AM shift standard:** Ca Sáng `07:30–12:30`, Ca Chiều `12:30–16:30`, Ca Tối `16:30–20:30`.
- **7-day support:** `dayOfWeek` 1 (Thứ 2) … 7 (Chủ Nhật), for weekend labs/seminars.
- **Specific date label:** the column-header date (e.g. `Thứ 2 (13/07)`) is kept as the informational `date` string; entries import as a recurring weekly pattern.
- **Multi-file + modes:** the client merges several PDFs (lecture + lab) into the one `rows[]` array. `mode: REPLACE` replaces the user's previously imported blocks for the semester and keeps `MANUAL` ones; `mode: MERGE` appends and skips exact duplicates. Default for a fresh import is `REPLACE` (avoids stale duplicates).

### 4.1 Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/users/me/schedule-entries/batch` | Student / Lecturer | **The import endpoint.** Body: `{ semesterId, mode: "REPLACE"\|"MERGE", sourceFiles: string[], rows: ParsedTimetableRow[] }` (schema in §4.2). Returns `201 { importId, mode, addedCount, skippedCount, replacedCount }`. Writes one `schedule_imports` audit row (counts + `sourceFiles`) and the `schedule_entries` rows in a single transaction. |
| POST | `/users/{userId}/schedule-entries/batch` | Admin | Same body, on behalf of a user who cannot self-serve (FR-5a). The target is the path `userId`. |
| GET | `/users/me/schedule-entries` | Student / Lecturer | List own busy blocks (classes/teaching) for the active semester → `ScheduleBlock[]`. Field names/values match the FE's `ScheduleBlock` (`lib/office-hours/types.ts`) rather than DB column names (`group_code`→`group`, `date_label`→`date`, `AAO_IMPORT`→`IMPORTED`); the API layer renames. |
| GET | `/users/{userId}/schedule-entries` | Owner / Admin | A specific user's busy blocks (admin support/oversight). |
| POST | `/users/{userId}/schedule-entries` | Admin | Manually add **one** entry (fallback). `{ semesterId, title, dayOfWeek, startTime, endTime, room, locationType?, lecturerName? }`. |
| POST | `/users/me/schedule-entries` | Student / Lecturer | Manually add one block of your own (backs the "Add schedule event" modal; stored with `source: MANUAL`). Same body as above minus `semesterId` default (active semester). |
| DELETE | `/schedule-entries/{id}` | Owner / Admin | Remove one busy block. |
| GET | `/users/me/schedule-imports` | Student / Lecturer | `ScheduleImportHistoryEntry[]`: `{ id, importedAt, mode, sourceFiles[], addedCount, skippedCount, replacedCount, status: SUCCESS\|FAILED }`. Exactly one record per batch, including every source file; `importedAt` maps from `created_at`, counts from `rows_added/rows_skipped/rows_replaced`, and DB `COMPLETED` maps to API `SUCCESS`. Failed batches have all three mutation counts zero. No `fileName`/`rowCount` aliases. |
| GET | `/schedule-imports` | Admin | Paginated import history using the same batch DTO, with additional `{ uploadedBy, targetUserId }` numeric fields; `targetUserId` is the resolved owner (`target_user_id ?? uploaded_by`). |

### 4.2 Batch payload schema (backend-defined; the FE type is `ScheduleBatchPayload` in `lib/office-hours/types.ts`)

```json
{
  "semesterId": 12,
  "mode": "REPLACE",
  "sourceFiles": ["TimeTable-lecture.pdf", "TimeTable-lab.pdf"],
  "rows": [
    {
      "day": "Thứ 2",
      "date": "13/07",
      "startTime": "07:30",
      "endTime": "11:30",
      "subjectCode": "CSE 422",
      "subjectName": "Kỹ năng lập trình chuyên nghiệp",
      "group": "E",
      "room": "LAB403.B08",
      "lecturerName": "Rohit Kumar Kasera"
    }
  ]
}
```

| Field | Type / rule |
|---|---|
| `semesterId` | required integer, existing semester; the FE explicitly sends the active semester id, no implicit backend default |
| `mode` | required `REPLACE` \| `MERGE`; the FE defaults its selection to `REPLACE` |
| `sourceFiles` | required array (may be empty), ≤ 20 names, each ≤ 255 chars (audit only) |
| `rows` | required array, 1–2 000 rows |
| `rows[].day` | required `"Thứ 2"`…`"Thứ 7"`, `"Chủ Nhật"` — server maps to `dayOfWeek` 1…7; do not send a second `dayOfWeek` field |
| `rows[].date` | required nullable string: `null`, `dd/MM` or `dd/MM/yyyy`, ≤ 20 chars |
| `rows[].startTime`, `endTime` | `HH:mm` 24 h, `startTime < endTime` |
| `rows[].subjectCode`, `subjectName`, `group`, `room`, `lecturerName` | required strings (empty allowed), max 30/150/20/100/150 chars respectively; derive `title` from subject name/code within 200 chars. Normalize empty `subjectCode` to DB NULL before deduplication. Derive `locationType` server-side from room/title (`LAB`/`ROOM`/`ONLINE`/`OTHER`); it is not part of `ParsedTimetableRow`. |

Both modes de-duplicate repeated input rows on `(user_id, semester_id, day_of_week, start_time, end_time, subject_code)` (unique index `uq_schedule_entries_dedup`). `MERGE` also skips rows already stored. `REPLACE` deletes only prior `AAO_IMPORT` rows for that owner/semester, preserves manual rows, and skips an input row if its key already exists as a manual block. `addedCount` counts inserted rows, `skippedCount` counts received rows not inserted, and `replacedCount` counts deleted imported rows.

### 4.3 Deferred / not planned: server-side PDF ingestion

The earlier design — multipart upload of PDFs, an async parse job, a staging table, SSE progress, paginated preview and an atomic commit (`/users/me/schedule-imports`, `/schedule-imports/jobs*`, `schedule_import_staging`) — is **not part of the MVP**. It only becomes relevant if a department-wide, hundreds-of-pages export must be ingested by an Admin without a browser parse. Do not implement it unless that requirement appears; the DB sketch is kept in `capstone-db-schema.md` §2.5 for reference.

Maps to `SCHEDULE_ENTRIES` and `SCHEDULE_IMPORTS`. Feeds conflict detection in §5.

---

## 5. Slots & Conflict-Aware Booking (FR-6, FR-7; UC1, UC2; workflow §9.1)

### 5.0 Lecturer Directory & Proactive Suggestions (FR-6 support; Pages.txt #10)

> `Lecturer.slug`, `photoUrl` and `blurb` are not columns of `users`; they come from the `lecturer_profiles` table (1-to-1 with a LECTURER user — `capstone-db-schema.md` §1.3). `slug` is derived from the name and unique.

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
| POST | `/bookings` | Student | `{ slotId, topic?, participantEmails? }` (group members by email; see §5.1). Server re-validates conflicts. Returns `201 Booking` with `status: PENDING`, or `409` (slot unavailable) with `details: { waitlistAvailable: true }`, or `422` (conflict detected). Multiple PENDING requests may coexist; the exclusion constraint guards confirmation. |
| GET | `/bookings` | Authenticated | List own bookings (student) or bookings-to-review (lecturer), filterable by `status`. Admin can filter by any user. |
| GET | `/bookings/{id}` | Owner (student/lecturer) / Admin | Booking detail. |
| POST | `/bookings/{id}/confirm` | Lecturer (owner of slot) | UC8. → `status: CONFIRMED`; notifies student. The first successful confirm atomically auto-`DECLINE`s the slot's other PENDING requests with notifications. A later confirm of a loser returns `409` with `error: "SLOT_ALREADY_CONFIRMED"`. See §12 for transaction handling. |
| POST | `/bookings/{id}/decline` | Lecturer (owner of slot) | `{ reason? }`. → `status: DECLINED`; notifies student; may trigger waitlist allocation (§7) if others are queued. |
| POST | `/bookings/{id}/cancel` | Student or Lecturer (participant) | FR-9. Enforces configurable notice-period rule (reject if inside window, unless Admin override). → `status: CANCELLED`; triggers waitlist allocation if slot had a queue. |
| POST | `/bookings/{id}/reschedule` | Student | `{ newSlotId }` — the FE reschedule dialog lists the lecturer's open, conflict-free slots (`GET /lecturers/{id}/slots`) and sends the chosen slot id; free-form date/time is not accepted. Equivalent to cancel + create, executed atomically; subject to same conflict checks and notice-period rule. |
| POST | `/bookings/{id}/complete` | Lecturer | Marks a past `CONFIRMED` booking `COMPLETED` (or auto-job does this after `end_at`). |
| POST | `/bookings/{id}/no-show` | Lecturer | FR-10. → `status: NO_SHOW`. |
| PATCH | `/bookings/{id}` | Lecturer (owner of slot) | `{ meetingUrl: string \| null }` — override (or clear, falling back to the slot's link) the online-meeting link of one booking. `https://` only, ≤ 500 chars; `422` otherwise. |
| PATCH | `/bookings/{id}/meeting-record` | Lecturer | `{ attended, notes? }`. Optional text field only — explicitly **not** an LMS field (§5.3 scope guard). |

**Booking response (DTO).** Besides display names, every booking carries the ids the UI needs: `{ id, slotId, lecturerId, studentId, lecturerName, studentName, department, topic, startAt, endAt, status, meetingUrl, participants? }` (`meetingUrl` is the effective link, `string | null`, see §3; FE type `Booking`, `lib/office-hours/types.ts`).

Maps to `SLOTS`, `BOOKINGS`, `MEETING_RECORDS`. State machine per §9.3.

### 5.1 Group Bookings (FR-15, Stretch; UC5)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/bookings/group` | Student | `{ slotId, topic, participantEmails[] }` — resolve additional students by email; unknown email → `422` with `details.unresolvedEmails[]`. No auto-provisioning/invites. Requires capacity > 1; count the requester once plus additional participants under a slot-row lock. Reject duplicate/self emails with `422`, capacity overflow with `409`. Creates one booking plus participant rows atomically. |
| POST | `/bookings/{id}/participants` | Student (existing participant) | `{ email }` — add a participant to an existing group booking (capacity permitting; same email-resolution rule as above). |
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

A waitlist entry always belongs to **one concrete slot** (`waitlist_entries.slot_id`), because allocation runs per slot. `GET /waitlist/me` returns `{ id, slotId, lecturerName, department, desiredSlotLabel, position, status, offeredStartAt?, offeredExpiresAt? }` where `desiredSlotLabel` is built server-side from the slot (e.g. `"Tue 10:00-10:30"`) and `position` is computed on read (rank among `WAITING` entries of that slot by `requested_at`, or by `priority_score` when a policy has scored them). A scheduled job moves `OFFERED` entries past `offer_expires_at` to `EXPIRED` and re-runs allocation.

Maps to `WAITLIST_ENTRIES`.

---

## 7. Allocation Engine (FR-13, FR-14; UC12, UC14; research core §11)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/allocation-policies` | Admin | `AllocationPolicy[]`: `{ id, name, config, active }`, fixed names `FCFS`, `NEED`, `ROUND_ROBIN`, `HYBRID`. HYBRID config uses `{ needWeight, waitTimeWeight, fairnessWeight }`. |
| POST | `/allocation-policies` | Admin | `{ name, config }` creates a missing fixed-name policy, initially `active: false`; duplicate name → `409`. Tune an existing policy using PATCH, not an additional row with the same name. |
| PATCH | `/allocation-policies/{id}` | Admin | Update `config` (weights, decay factors, randomization seed range). |
| POST | `/allocation-policies/{id}/activate` | Admin | UC12. Sets this policy `is_active = true`. **Global, single active policy** — the schema's `uq_allocation_policies_one_active` unique index is unscoped (no `department` column). Per-department policies were floated as a stretch idea but are explicitly cut from scope, not deferred: no doc models a department-scoped policy and none should be assumed. |
| POST | `/slots/{id}/run-allocation` | System (internal) / Admin (manual trigger for demo/testing) | UC14. Triggered automatically on cancel/decline, or manually invocable by Admin for the live policy-comparison demo (Risk #6 mitigation). Executes `allocate(slot, candidates, activePolicy)`, writes `ALLOCATION_EVENTS`, sends offer notification. |
| POST | `/slots/{id}/override` | Admin | **Manual override, bypasses the active policy.** `{ studentId, reason }`. Admin directly assigns the freed slot to a specific waitlisted (or new) student — e.g., the policy misbehaves, a lecturer objects to the algorithmic pick, or an edge case needs a human call during the pilot. Cancels any outstanding `OFFERED` waitlist entry for the slot, creates a `CONFIRMED` booking for `studentId`, and writes an `ALLOCATION_EVENTS` row with `decision: OVERRIDDEN` so the deviation is still logged and auditable — it does not bypass the reproducibility trail, only the automated selection. |
| GET | `/allocation-events` | Admin | Full audit log, filterable by `slotId`, `policyId`, `decision` (incl. `OVERRIDDEN`), `dateRange` — the reproducibility backbone (§10.1). |
| GET | `/allocation-events/{id}` | Admin | `AllocationEvent` includes `slotLabel`, `studentName`, `decision`, `policyName`, `computedScore`, `randomSeed`, `allocatedAt`, `overriddenByName`, `overrideReason`. The policy fields are null on override; override fields are null on policy decisions. Store the actor FK, resolve the display name in the DTO. |

Maps to `ALLOCATION_POLICIES`, `ALLOCATION_EVENTS`. This cluster is the **research API surface** — every field here should be exposed because the defense chapter depends on being able to pull and replay this data (NFR-3). `OVERRIDDEN` events should be **excluded by default** from the fairness/efficiency metric computations in §7.1 (they're human interventions, not policy output) but retained in the raw log for operational transparency — flag this in the experiment query filters.

### 7.1 Research / Experiment Endpoints (supporting §11.4, not user-facing product features)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/research/synthetic-demand` | Admin (dev/research tooling) | `{ seed, popularitySkew, arrivalPattern, numStudents, numLecturers }`. Generates a synthetic demand stream for experiments; may be a batch job endpoint rather than sync REST if long-running. |
| POST | `/research/experiments` | Admin | `{ demandRunId, policyNames[], seed }` → `201 Experiment`. Require 1–4 distinct fixed policy names; replay the same demand through each in request order. Atomically create an `experiment_groups` parent and its per-policy `experiments` results. Response `id` is the parent id; never group by equal seed/timestamp. |
| GET | `/research/experiments/{id}` | Admin | `Experiment` by `experiment_groups.id`: `{ id, demandRunId, seed, policyNames[], results: ExperimentPolicyResult[], runAt }`. Results are ordered by request order; each contains the §11.3 metrics. |
| GET | `/research/experiments/{id}/export` | Admin | Export raw results (CSV/JSON) for the notebook/plotting pipeline. |

---

## 8. Notifications (FR-11; UC15)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/notifications` | Authenticated | List own notifications, `?unreadOnly=true`. |
| POST | `/notifications/{id}/read` | Authenticated (owner) | Mark one as read. |
| POST | `/notifications/read-all` | Authenticated | Mark all read. |
| GET | `/notifications/stream` | Authenticated | **SSE** (`text/event-stream`) — pushes the events in the catalogue below in real time. Browsers' `EventSource` cannot send an `Authorization` header, so the Next.js BFF proxies the stream (reads the httpOnly cookie, forwards with a bearer token); a polling fallback `GET /notifications?since=` is acceptable. |

**Event catalogue (single source of truth — FE enum in parentheses):**

| Event (`notifications.type`) | FE `NotificationType` | Recipient |
|---|---|---|
| `booking.pending` | `BOOKING_PENDING` | Lecturer |
| `booking.confirmed` | `BOOKING_CONFIRMED` | Student |
| `booking.declined` | `BOOKING_DECLINED` | Student |
| `booking.cancelled` | `BOOKING_CANCELLED` | The other party |
| `waitlist.offered` | `WAITLIST_OFFERED` | Winning student |
| `waitlist.expired` | `WAITLIST_EXPIRED` | Student whose offer lapsed |
| `reminder.upcoming` | `REMINDER` | Both parties (e.g. 24 h before) |

The API returns `{ id, type, title, body, createdAt, read, bookingId? }`; `type` is the **uppercase FE enum** from the table. SSE uses the dotted event name and the same DTO as its JSON data. The backend renders `title`/`body` in the requested locale (`Accept-Language: en|vi`, default `en`); `payload` remains internal. Per-user prefs (`NotificationPrefs`: `bookingConfirmed`, `bookingDeclined`, `waitlistOffer`, `reminders`) default to true, are stored as `users.notification_prefs`, and are read/edited through `/users/me`. Preferences control email delivery; retain in-app records and SSE for every lifecycle event.

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
| FR-5 (self-service AAO import, parsed in the browser) | §4 `POST /users/me/schedule-entries/batch` |
| FR-5a (admin schedule support/oversight) | §4 `POST /users/{userId}/schedule-entries/batch`, `GET /schedule-imports`, `POST /users/{userId}/schedule-entries` |
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

## 12. Resolved workflow decisions and deferred work

1. **Slot listing:** authenticated, with per-student conflict filtering; `/public/office-hours` is the separate public aggregate. Availability rules/exceptions also require authentication.
2. **Allocation trigger:** automatic internal service calls; REST trigger is Admin-only for the demo. `SYSTEM` is not a self-selectable JWT role.
3. **Reschedule:** one atomic `POST /bookings/{id}/reschedule` with `{ newSlotId }` for the same lecturer. Roll back the cancellation if replacement fails.
4. **Notifications:** BFF-proxied SSE plus `GET /notifications?since=` polling. Override uses existing `booking.confirmed` / `booking.cancelled` event names with explicit administrator-reassignment text for affected parties.
5. **Override scope:** any Admin globally for the MVP, as already decided in the Vietnamese handoff. Override bypasses policy selection, not schedule-conflict checks, capacity or audit. If the student is not waitlisted, create the required waitlist entry in the same transaction before recording `OVERRIDDEN`.
6. **Confirmation race:** several PENDING requests are allowed. The first successful confirm changes competitors to DECLINED atomically. Confirming an already auto-declined loser returns `409 SLOT_ALREADY_CONFIRMED`; do not try to write after an unhandled PostgreSQL exclusion violation has aborted a transaction. Retry/rollback or acquire the slot lock before the transition.
7. **Research identity:** `Experiment.id` refers to `experiment_groups.id`, with one `experiments` child result per requested policy (§7.1). Research stays stretch scope. Retention and background PWA delivery are operational follow-ups, not alternate wire contracts.
