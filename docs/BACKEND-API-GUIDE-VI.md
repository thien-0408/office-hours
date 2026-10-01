# OfficeHours — Hướng dẫn Backend & API cho Dev (Bản tiếng Việt)

> **Mục đích:** tài liệu làm việc cho dev backend (Spring Boot + PostgreSQL) chuẩn bị code. Tổng hợp và **rà soát chéo** 4 tài liệu thiết kế
> (`capstone-officehours-plan.md`, `capstone-api-endpoints.md`, `capstone-db-schema.md`, `allocate-engine.md`) cùng với code frontend hiện có
> (`lib/office-hours/types.ts`, `lib/auth/*`, `app/api/auth/*`, `lib/office-hours/mock-data.ts`).
>
> **Trạng thái:** backend **chưa tồn tại**. Mọi thứ dưới đây là *hợp đồng đề xuất* (proposed contract). Frontend hiện chạy bằng mock data
> (chỉ `/auth/*` đã được gọi thật, có fallback sang tài khoản mock khi backend không reachable). Khi có điểm mâu thuẫn, mục 3 liệt kê và đề xuất cách chốt.
>
> Thuật ngữ kỹ thuật (endpoint, enum, tên cột…) giữ nguyên tiếng Anh để khớp code.

---

## 1. Tổng quan hệ thống

| | |
|---|---|
| **Stack** | Spring Boot · PostgreSQL 15+ · Redis · Docker · (FE: Next.js 16, TypeScript) |
| **Base URL (dev)** | `http://localhost:8080/api/v1` (biến môi trường FE: `API_BASE_URL`) |
| **Auth** | JWT bearer: `Authorization: Bearer <accessToken>` (trừ endpoint `Public`) |
| **Vai trò** | `STUDENT`, `LECTURER`, `ADMIN`, `SYSTEM` (job nội bộ, không gọi từ ngoài) |
| **Định dạng** | JSON; thời gian **ISO-8601 UTC** (`timestamptz`) |
| **Mục tiêu nghiệp vụ** | Đặt lịch office hours **không trùng lịch**, và **phân bổ công bằng** khi slot bị quá tải (waitlist + allocation policy) |

### 1.1 Cách FE gọi backend (quan trọng để thiết kế CORS/cookie/SSE)

- FE dùng **BFF**: trình duyệt chỉ gọi route của Next.js (`/api/auth/*`), route đó mới gọi Spring Boot bằng `fetch` phía server (`lib/api-server.ts`).
  → Backend **không cần mở CORS cho trình duyệt** ở giai đoạn này, nhưng nên cho phép cấu hình.
- Token **không** nằm trong JS: `accessToken` lưu cookie httpOnly `oh_access_token`; `refreshToken` lưu cookie httpOnly `oh_refresh_token` (path `/api/auth`, 30 ngày).
  `proxy.ts` (middleware) chỉ kiểm tra *có cookie hay không* để chặn route; **không verify JWT** → backend phải verify mọi request.
- Lỗi phải trả **RFC 7807-style**: `{ status, error, message, path, timestamp, details? }` (FE đọc `message` để hiển thị — `ApiError` trong `lib/api-server.ts`).
- Các route BFF hiện có: `login`, `logout`, `me`, `refresh`, `register`, `forgot-password`, `reset-password`.
  Các module còn lại (bookings, slots…) FE chưa có route BFF — khi nối API thật sẽ thêm route proxy tương tự.
- **SSE (`/notifications/stream`)**: `EventSource` trình duyệt không gửi được header `Authorization`; cần route proxy phía Next.js (đọc cookie rồi forward) hoặc backend hỗ trợ xác thực qua cookie. Cần chốt (mục 3, #12).

---

## 2. Quy ước chung

1. **Phân trang** (Spring Data): `?page=0&size=20&sort=field,dir` → `{ content[], totalElements, totalPages, page, size }`. `page` bắt đầu từ **0**.
2. **Lỗi**: RFC 7807 như trên. Mã thường dùng: `400` dữ liệu sai, `401` chưa đăng nhập/token hết hạn, `403` sai quyền, `404`, `409` mất race (slot đã bị đặt), `422` vi phạm nghiệp vụ (ví dụ trùng lịch học).
3. **Idempotency**: `POST` tạo booking/allocation nhận header tùy chọn `Idempotency-Key` để chống double-submit.
4. **Concurrency**: chống đặt trùng bằng **DB exclusion constraint** (mục 5.2). `409` nghĩa là "thua race", FE sẽ tải lại slot — không phải lỗi client.
5. **RBAC**: mọi endpoint kiểm tra role tối thiểu; kiểm tra quyền theo hàng (row-level) được ghi chú từng endpoint (ví dụ student chỉ hủy được booking của mình).
6. **Múi giờ**: lưu/truyền UTC. Rule availability (`time`) là **giờ địa phương của trường** → dùng `Asia/Ho_Chi_Minh` (UTC+7, không DST) khi sinh slot. Cần cấu hình hằng số này một chỗ.
7. **Ngày trong tuần (`dayOfWeek`)**: xem mâu thuẫn ở mục 3 (#1). **Đề xuất thống nhất toàn hệ thống: ISO, 1 = Thứ Hai … 7 = Chủ Nhật.**
8. **Ca học chuẩn (shift)** của trường: Ca Sáng `07:30–12:30`, Ca Chiều `12:30–16:30`, Ca Tối `16:30–20:30`.
9. **Đổi tên field**: một số field DB khác tên field API/FE (ví dụ `group_code`→`group`, `date_label`→`date`, `AAO_IMPORT`→`IMPORTED`, `exception_date`→`date`, `slot_minutes`→`slotLengthMinutes`). **Hợp đồng response theo tên của FE** (mục 9); lớp mapping DTO ở backend lo việc đổi tên.

---

## 3. Kết quả rà soát — các điểm cần chốt TRƯỚC khi code

Sắp theo mức độ rủi ro. Mỗi mục có **đề xuất** để dev chốt nhanh.

| # | Mức | Vấn đề | Đề xuất |
|---|---|---|---|
| 1 | **Cao** | **`dayOfWeek` không nhất quán**: `availability_rules` và `recurring_bookings` dùng `0–6` (0=CN); `schedule_entries` dùng `1–7` (1=T2); FE `AvailabilityRule` ghi `1–5`, `RecurringSeries` ghi `0=CN..6`; query `/lecturers?dayOfWeek=` ghi `1–7`. Sai một chỗ là slot lệch ngày. | Thống nhất **ISO 1–7** ở DB (CHECK `BETWEEN 1 AND 7`), API và FE. Sửa lại `RecurringSeries.dayOfWeek` + `DAY_OPTIONS` phía FE. |
| 2 | **Cao** | **Reschedule**: API là `POST /bookings/{id}/reschedule {newSlotId}` (chọn *slot có sẵn*), nhưng FE `RescheduleModal` cho nhập **ngày/giờ tự do + topic**. Hai bên không khớp. | Chốt theo API: FE đổi sang chọn slot từ slot picker. Nếu giữ nhập tự do thì backend phải tự tìm/khớp slot và trả 422 khi không có. |
| 3 | **Cao** | **Chỉ chặn trùng khi `status = CONFIRMED`** (exclusion constraint có `WHERE status='CONFIRMED'`). Nhiều booking `PENDING` cùng slot được phép → lecturer `confirm` booking thứ hai sẽ vi phạm constraint. | Chấp nhận (là thiết kế có chủ đích) nhưng **`/confirm` phải bắt `exclusion_violation` → trả `409`** và tự động `DECLINE`/thông báo các PENDING còn lại; UI lecturer cần xử lý 409. |
| 4 | Cao | **Booking DTO của FE thiếu id**: `Booking` chỉ có `lecturerName`, `studentName`… không có `id` của slot/lecturer/student. Booking detail, reschedule, link tới slot picker cần các id này. | Response booking trả **thêm** `slotId`, `lecturerId`, `studentId` (additive, không phá FE). |
| 5 | Cao | **Waitlist: DB theo slot, FE theo "mẫu mong muốn"**. DB: `waitlist_entries (slot_id, student_id)` + `position` không có cột. FE `WaitlistEntry` có `desiredSlotLabel` ("Weekday mornings"), `position`. | Chốt: waitlist **gắn slot cụ thể** (đúng với allocation). `desiredSlotLabel` do backend dựng từ slot; `position` tính động (rank theo `requested_at` hoặc `priority_score`). FE sửa copy cho khớp. |
| 6 | Trung | **Lecturer directory**: `GET /lecturers` trả `{id, slug, name, department, photoUrl, blurb}` nhưng bảng `users` **không có** `slug`, `photo_url`, `blurb`. | Thêm bảng `lecturer_profiles` (1–1 với `users`) hoặc thêm cột nullable; `slug` sinh từ tên + unique. |
| 7 | Trung | **Notification**: DB lưu `type` dạng `booking.confirmed` + `payload jsonb`; FE dùng enum `BOOKING_CONFIRMED…` và có `title`, `body`, `read`, `bookingId`. SSE event catalogue (`booking.pending`, `waitlist.expired`…) lệch với FE enum (`REMINDER` không có bên API). | Backend render `title/body` theo locale (en/vi) hoặc trả `type` + `payload` để FE tự dịch (đề xuất — FE đã có i18n). Chốt danh mục event chung, thêm `booking.pending`, `waitlist.expired`, `reminder.*`. |
| 8 | Trung | **Group booking: add bằng email hay `studentId`?** FE `ParticipantManager` nhập **email**; API/DB dùng `participantIds`/`student_id`. Email không tồn tại thì sao? | Đề xuất: backend nhận `participantEmails[]`, resolve sang user; email không tồn tại → `422` kèm danh sách email lỗi (không tự tạo tài khoản). |
| 9 | Trung | **Import schedule**: doc API mô tả job bất đồng bộ (`importId`, `rowsProcessed`…), FE chỉ có `ScheduleImportHistoryEntry {fileName, importedAt, rowCount, status}` và hiện **parse PDF phía client** (`pdfjs-dist`, `lib/timetable/parse-pdf.ts`). Doc plan còn nhắc CSV. | MVP: dùng **client fast-path** `POST /users/me/schedule-entries/batch` (JSON đã parse). Pipeline staging/SSE (§6.4) để **giai đoạn sau**. Chốt định dạng AAO thật là PDF và sửa plan. |
| 10 | Trung | **Override authorization**: ai được `override` — mọi Admin hay admin theo khoa? FE hiện cho mọi Admin, không kiểm tra khoa. | Chốt "mọi Admin" cho MVP (ghi rõ là quyết định có chủ đích) + luôn ghi `allocation_events` `OVERRIDDEN`. |
| 11 | Trung | **Import: thay thế hay nối thêm** khi student import lại cùng học kỳ. | Đề xuất `REPLACE` theo học kỳ làm mặc định (đã có `mode`). |
| 12 | Thấp | **SSE + cookie httpOnly**: `EventSource` không set header Authorization. | Next.js route proxy đọc cookie → mở stream tới backend bằng `Authorization`; hoặc dùng polling `GET /notifications?since=` làm fallback. |
| 13 | Thấp | **`citext`** có sẵn không? Ngược lại dùng unique index `LOWER(email)`. | Kiểm tra môi trường pilot; fallback đã mô tả ở schema. |
| 14 | Thấp | **Capacity group booking** không thể là `CHECK` (đếm bảng con). | Trigger `AFTER INSERT` hoặc kiểm tra ở service + test. |
| 15 | Thấp | **Retention** `allocation_events`, `notifications` tăng không giới hạn. | Quyết định partition/archive trước pilot nếu chạy stress test. |
| 16 | Thấp | **`allocate()` đang viết bằng TypeScript** (`lib/allocation/engine.ts`) cho mô phỏng phía client; backend phải **cài lại** và cho kết quả giống hệt với cùng seed. | Xem mục 8 (PRNG mulberry32 + seededHash, test vector). |

---

## 4. Vai trò & phân quyền nhanh

| Vai trò | Có thể |
|---|---|
| **Public** | Xem `/public/office-hours`, đăng ký/đăng nhập/quên mật khẩu |
| **STUDENT** | Duyệt lecturer, xem slot đã lọc trùng lịch, đặt/hủy/đổi booking, group & recurring booking, waitlist, import lịch học của mình |
| **LECTURER** | Quản lý availability rules/exceptions, import lịch dạy, confirm/decline/complete/no-show, meeting record, xem hàng đợi waitlist của slot mình |
| **ADMIN** | Quản lý user & semester, import hộ + xem tổng hợp, quản lý allocation policy, xem audit log, override, analytics, research tools |
| **SYSTEM** | Chạy allocation khi slot trống, tự `COMPLETE` booking quá giờ, gửi notification/email |

---

## 5. Mô hình dữ liệu (PostgreSQL)

DDL đầy đủ nằm ở `capstone-db-schema.md`; phần này là bản đồ + ràng buộc phải giữ.

### 5.1 Bảng chính

| Nhóm | Bảng | Ghi chú |
|---|---|---|
| Danh tính | `users`, `password_reset_tokens`, `semesters` | `email` unique (citext hoặc `LOWER`), `semesters` chỉ **một** `is_active` (partial unique index) |
| Availability | `availability_rules`, `availability_exceptions` | Rule sinh ra `slots`; exception `BLOCK`/`ADD` áp khi sinh slot |
| Nguồn xung đột | `schedule_entries`, `schedule_imports`, `schedule_import_staging` | `schedule_entries` **dùng chung** cho student & lecturer → query xung đột thống nhất |
| Đặt lịch | `slots`, `bookings`, `booking_participants`, `meeting_records`, `recurring_bookings` | `slots` được **materialize** (có id để waitlist/allocation tham chiếu) |
| Phân bổ | `waitlist_entries`, `allocation_policies`, `allocation_events` | Phục vụ nghiên cứu: log đủ cả ứng viên `SKIPPED` |
| Nghiên cứu | `synthetic_demand_runs`, `experiments` | Chỉ cho tool nghiên cứu, không phải dữ liệu sản phẩm |
| Thông báo | `notifications` | Vừa phục vụ SSE vừa trigger email |

### 5.2 Ràng buộc "sống còn" (phải có test)

1. **Chống double-booking ở tầng DB** (NFR-2):
   ```sql
   ALTER TABLE bookings ADD CONSTRAINT excl_bookings_no_double_booking
     EXCLUDE USING gist (lecturer_id WITH =, time_range WITH &&) WHERE (status = 'CONFIRMED');
   ```
   Cần extension `btree_gist`. `lecturer_id` và `time_range` được **denormalize** lên `bookings` bằng trigger `BEFORE INSERT` (vì `EXCLUDE` không join được sang `slots`).
2. `slots`: `EXCLUDE (lecturer_id =, tstzrange(start_at,end_at) &&)` — một lecturer không có 2 slot chồng nhau.
3. `semesters`: unique partial index `WHERE is_active`.
4. `allocation_policies`: unique partial index một policy `is_active` (**toàn cục**, không theo khoa).
5. `allocation_events`: `CHECK` loại trừ — hoặc (`SELECTED`/`SKIPPED` có `policy_id`, `computed_score`, `random_seed`, không có override) hoặc (`OVERRIDDEN` có `overridden_by`, `override_reason`, và không có 3 trường kia).
6. `waitlist_entries`: `UNIQUE (slot_id, student_id)`.
7. `availability_rules`: `end_time > start_time`, độ dài khoảng ≥ `slot_minutes`.

### 5.3 Thứ tự migration (Flyway) — chú ý FK vòng

`V1 extensions (btree_gist, citext)` → `users` → `password_reset_tokens` → `semesters` → `availability_*` → **`schedule_imports` (trước)** → `schedule_entries` → `schedule_import_staging` → `slots` → `bookings` (+ trigger + exclusion) → `booking_participants` → `meeting_records` → `recurring_bookings` (+ `ALTER bookings ADD recurring_booking_id`) → `waitlist_entries` → `allocation_policies` → `allocation_events` → `synthetic_demand_runs`, `experiments` → `notifications`.

> `schedule_entries.import_batch_id` tham chiếu `schedule_imports` nên `schedule_imports` phải tạo **trước** (doc schema chỉ xếp sau cho dễ đọc).

### 5.4 Seed tối thiểu cho dev

- 1 semester active; tài khoản demo (student/lecturer/admin — xem `lib/auth/mock-accounts.ts`);
- 4 allocation policy: `FCFS`, `NEED`, `ROUND_ROBIN`, `HYBRID` (config mặc định ở mục 8), `HYBRID` hoặc `FCFS` active;
- vài lecturer có availability rule + vài `schedule_entries` để test xung đột.

---

## 6. Đặc tả API

Ký hiệu **Role**: `P` = Public, `A` = mọi user đã đăng nhập, `S` = Student, `L` = Lecturer, `AD` = Admin, `O` = chủ sở hữu (owner).

### 6.1 Auth & tài khoản (FR-1)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | P | `{ email, password, fullName, role, department? }`. `role` tự chọn chỉ `STUDENT`/`LECTURER`; `ADMIN` chỉ do seed/admin tạo. |
| POST | `/auth/login` | P | `{ email, password }` → `{ accessToken, refreshToken, expiresIn, user }` (`expiresIn` tính bằng **giây**). |
| POST | `/auth/refresh` | P | `{ refreshToken }` → access token mới. |
| POST | `/auth/logout` | A | Vô hiệu refresh token (blacklist trong Redis). |
| POST | `/auth/forgot-password` | P | `{ email }` → **luôn `202`** (không lộ email có tồn tại hay không). Nếu có: tạo token dùng một lần, TTL **30 phút**, lưu **hash** (không lưu token thô), gửi mail `{FRONTEND_URL}/reset-password?token=...`. |
| POST | `/auth/reset-password` | P | `{ token, newPassword }`. Kiểm tra token (chưa hết hạn, chưa dùng, khớp hash) → đổi `password_hash`, đánh dấu đã dùng, **thu hồi mọi refresh token** của user. `400` nếu token sai/hết hạn/đã dùng. |
| GET | `/users/me` | A | Hồ sơ hiện tại → `AuthUser { id, email, fullName, role, department? }`. |
| PATCH | `/users/me` | A | Sửa `fullName`, `department`, notification prefs. |
| POST | `/users/me/change-password` | A | `{ oldPassword, newPassword }`. |
| GET | `/users` | AD | Danh sách/tìm kiếm, lọc `role`, `department`. |
| GET | `/users/{id}` | AD | Chi tiết user. |
| PATCH | `/users/{id}` | AD | Sửa role/department. |
| DELETE | `/users/{id}` | AD | Vô hiệu hóa (soft delete, `is_active=false`). |

Mật khẩu băm bcrypt/argon2 (NFR-4). Cân nhắc rate-limit `/auth/login` và `/auth/forgot-password`.

### 6.2 Semester (FR-2)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/semesters` | A | Danh sách. |
| GET | `/semesters/active` | A | Học kỳ đang active (dùng làm scope cho hầu hết API khác). |
| POST | `/semesters` | AD | `{ name, startDate, endDate }` (`endDate > startDate`). |
| PATCH | `/semesters/{id}` | AD | Sửa tên/ngày. |
| POST | `/semesters/{id}/activate` | AD | Đặt `is_active=true`, tắt các semester khác (một transaction). |
| DELETE | `/semesters/{id}` | AD | Chỉ khi không còn dữ liệu phụ thuộc (hoặc soft delete). |

DTO FE: `Semester { id, name, startDate, endDate, active }`.

### 6.3 Availability (FR-3, FR-4)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/lecturers/{lecturerId}/availability-rules` | A | Rule lặp hằng tuần (mặc định theo semester active; `?semesterId=`). |
| POST | `/lecturers/{lecturerId}/availability-rules` | L(self)/AD | `{ semesterId, dayOfWeek, startTime, endTime, slotLengthMinutes, effectiveFrom, effectiveTo }`. Sinh `slots`. |
| PATCH | `/availability-rules/{id}` | L(owner)/AD | Sửa rule; **sinh lại các slot tương lai chưa có booking**. |
| DELETE | `/availability-rules/{id}` | L(owner)/AD | Xóa rule; hủy/chặn slot tương lai chưa book. |
| GET | `/lecturers/{lecturerId}/availability-exceptions` | A | Danh sách exception `BLOCK`/`ADD`. |
| POST | `/lecturers/{lecturerId}/availability-exceptions` | L(self)/AD | `{ date, type: "BLOCK"\|"ADD", startTime, endTime, reason? }`. |
| DELETE | `/availability-exceptions/{id}` | L(owner)/AD | Xóa exception. |

DTO FE: `AvailabilityRule { id, dayOfWeek, startTime, endTime, slotLengthMinutes, effectiveFrom, effectiveTo|null, active }`; `AvailabilityException { id, date, type, startTime, endTime, reason|null }`.

> **Lưu ý khi sinh slot:** áp dụng rule → trừ `BLOCK` → cộng `ADD` → trừ lịch dạy của chính lecturer (`schedule_entries`). Sửa/xóa rule **không được** động vào slot đã có booking.

### 6.4 Import lịch học/dạy — nguồn xung đột (FR-5, FR-5a)

Student và lecturer **tự upload** thời khóa biểu AAO của chính mình (PDF). Backend phải xác thực đây đúng là file export của AAO (định dạng/chữ ký + MIME + schema) và từ chối nếu không. Admin chỉ là phương án hỗ trợ/giám sát.

**MVP đề xuất (làm trước):**

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/users/me/schedule-entries/batch` | S/L | **Fast-path:** FE parse PDF bằng Web Worker (`pdfjs-dist`) rồi gửi JSON đã cấu trúc `{ semesterId, mode: "REPLACE"\|"MERGE", rows: ParsedTimetableRow[] }`. Backend validate + ghi `schedule_entries`. |
| GET | `/users/me/schedule-entries` | S/L | Busy block của mình trong semester active → `ScheduleBlock[]`. |
| DELETE | `/schedule-entries/{id}` | O/AD | Xóa một block. |
| GET | `/users/me/schedule-imports` | S/L | Lịch sử import của mình (xem mục 3 #9 về shape). |
| POST | `/users/{userId}/schedule-entries` | AD | Thêm tay một block hộ user (`{ semesterId, title, dayOfWeek, startTime, endTime, room, locationType?, lecturerName? }`). |
| GET | `/users/{userId}/schedule-entries` | O/AD | Xem lịch của user. |
| GET | `/schedule-imports` | AD | Lịch sử import toàn hệ thống. |

**Giai đoạn sau (pipeline lớn 50–200 trang, ≥10.000 dòng):**

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/users/me/schedule-imports` | S/L | `multipart/form-data` (`files[]`, `semesterId`, `mode`). Job bất đồng bộ → `{ importId, status: "QUEUED", addedCount, skippedCount }`. |
| GET | `/users/me/schedule-imports/{importId}` | O | Poll: `{ status: QUEUED\|PROCESSING\|COMPLETED\|FAILED, rowsProcessed, rowsFailed, rowsSkipped, errors[] }`. |
| POST | `/schedule-imports` | AD | Admin upload hộ (`targetUserId`, `mode`). |
| POST | `/schedule-imports/jobs` | AD | Khởi tạo bulk ingestion → `202 { importJobId, status:"QUEUED", totalFiles }`. |
| GET | `/schedule-imports/jobs/{id}/progress` | O/AD | **SSE** tiến độ: `{ phase: PARSING\|DEDUPLICATING\|READY_FOR_REVIEW, percentComplete, pagesProcessed, totalPages, extractedRows, duplicateCount, errorCount }`. |
| GET | `/schedule-imports/jobs/{id}/preview` | O/AD | Xem staging, phân trang: `?page=0&size=50&filterStatus=VALID,CONFLICT,DUPLICATE`. |
| POST | `/schedule-imports/jobs/{id}/commit` | O/AD | `{ action: "COMMIT"\|"ROLLBACK", resolutionStrategy: "SKIP_DUPLICATES"\|"OVERWRITE", excludedTempIds[] }`. Batch insert (`JdbcTemplate.batchUpdate` size 1000 hoặc `COPY`). |

Pipeline: `Upload → 202 + Job ID → Worker (stream parse) → Staging + dedup index → Preview phân trang → Commit nguyên tử`.

**DTO `ScheduleBlock`** (response `schedule-entries`):
`{ id, title, dayOfWeek(1–7), date?("13/07"), startTime, endTime, source("IMPORTED"|"MANUAL"), subjectCode?, subjectName?, group?, room?, lecturerName?, locationType?("LAB"|"ROOM"|"ONLINE"|"OTHER"), colorHue?, notes? }`.

**Dedup (`MERGE`)** dựa trên `(user_id, semester_id, day_of_week, start_time, end_time, subject_code)`. **`REPLACE`** xóa các dòng `IMPORTED` cũ nhưng **giữ** dòng `MANUAL`.

**Query xung đột thống nhất:**
```sql
EXISTS (SELECT 1 FROM schedule_entries
        WHERE user_id = ? AND semester_id = ? AND day_of_week = ?
          AND (start_time, end_time) OVERLAPS (?, ?))
```

### 6.5 Lecturer directory & slot (FR-6, FR-7)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/lecturers` | A | Duyệt/tìm lecturer. `?q=` (tên+khoa), `?department=`, `?dayOfWeek=1-7` (còn ≥1 slot trống ngày đó), `?availableOnly=true`. Trả phân trang `Lecturer { id, slug, name, department, photoUrl, blurb }`. |
| GET | `/lecturers/{id}` | A | Hồ sơ một lecturer. |
| GET | `/users/me/suggested-slots` | S | Slot gợi ý **đã lọc trùng lịch học** của student. `?category=ALL\|CS\|MATH\|SOON` (`MATH` thực chất gồm Math/Physics/Economics; cân nhắc đổi tên). Trả `{ id, lecturerId, lecturerName, department, photoUrl, startAt, endAt, dayOfWeek, dayLabel, formattedTime, specialtyTag, blurb, isConflictFree }[]`. |
| GET | `/lecturers/{lecturerId}/slots` | A | **Query lõi.** `?week=YYYY-Www` hoặc `?from=&to=`. Slot đặt được = availability − lịch dạy − booking hiện có, **và** lọc thêm theo `schedule_entries` của chính student đang gọi. Cache Redis TTL ngắn. Mục tiêu **< 300 ms** (NFR-1). Trả `BookableSlot { id, lecturerId, startAt, endAt, available, conflict }[]`. |
| GET | `/slots/{id}` | A | Chi tiết: `status OPEN\|FULL\|CLOSED`, `capacity`, số người trong waitlist. |
| GET | `/slots` | AD | Tìm kiếm slot xuyên lecturer (vận hành). |
| GET | `/public/office-hours` | P | Xem công khai tuần hiện tại, `?department=&page=&size=` → `PublicSlot { lecturerName, department, startAt, endAt }`. **Không** trả email/dữ liệu booking/student. |

> **Quan trọng:** luôn validate lại xung đột **phía server** khi tạo booking — không tin dữ liệu cache mà FE đang thấy.

### 6.6 Booking (FR-7 → FR-10)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/bookings` | S | `{ slotId, topic?, participantIds? }`. Validate lại xung đột. `201` + `status: PENDING`; `409` (thua race) kèm `{ waitlistAvailable: true }`; `422` (xung đột lịch). |
| GET | `/bookings` | A | Student: booking của mình. Lecturer: booking cần duyệt. Admin lọc theo user. Lọc `?status=`. |
| GET | `/bookings/{id}` | O/AD | Chi tiết + `participants`. |
| POST | `/bookings/{id}/confirm` | L(chủ slot) | `PENDING → CONFIRMED`; thông báo student. **Bắt `exclusion_violation` → `409`** (mục 3 #3). |
| POST | `/bookings/{id}/decline` | L(chủ slot) | `{ reason? }` → `DECLINED`; có thể kích hoạt allocation nếu có waitlist. |
| POST | `/bookings/{id}/cancel` | S/L (thành viên) | FR-9: áp **notice period** cấu hình được (từ chối nếu nằm trong cửa sổ, trừ Admin). → `CANCELLED`; kích hoạt allocation nếu slot có hàng đợi. |
| POST | `/bookings/{id}/reschedule` | S | `{ newSlotId }` — tương đương cancel+create **trong một transaction**, cùng luật xung đột & notice period. (Xem mục 3 #2.) |
| POST | `/bookings/{id}/complete` | L | `CONFIRMED` đã qua giờ → `COMPLETED` (hoặc job tự động sau `end_at`). |
| POST | `/bookings/{id}/no-show` | L | FR-10 → `NO_SHOW`. |
| PATCH | `/bookings/{id}/meeting-record` | L | `{ attended, notes? }` — `notes` là text tùy chọn, **không** phải trường LMS (giữ trần phạm vi). |

**DTO `Booking` đề xuất:**
```json
{
  "id": 12, "slotId": 345,
  "lecturerId": 7, "lecturerName": "Dr. Amara Chen",
  "studentId": 21, "studentName": "Minh Nguyen",
  "department": "Computer Science", "topic": "Thesis proposal review",
  "startAt": "2026-10-02T03:00:00Z", "endAt": "2026-10-02T03:30:00Z",
  "status": "CONFIRMED",
  "participants": [{ "id": 22, "name": "…", "email": "…" }]
}
```
(`slotId`, `lecturerId`, `studentId` là phần **thêm** so với FE hiện tại — mục 3 #4.)

**State machine** (mục 7.1 vẽ lại ở dưới).

#### 6.6.1 Group booking (FR-15, Stretch)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/bookings/group` | S | `{ slotId, topic, participantStudentIds[] }` (hoặc `participantEmails[]`, mục 3 #8). Yêu cầu `slot.capacity > 1`. Tạo **một** row `bookings` + các row `booking_participants`. |
| POST | `/bookings/{id}/participants` | S(thành viên) | Thêm người (còn chỗ). |
| DELETE | `/bookings/{id}/participants/{studentId}` | S(self)/AD | Rời/xóa. |

#### 6.6.2 Recurring booking (FR-16, Stretch)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/bookings/recurring` | S | `{ lecturerId, dayOfWeek, startTime, endTime, semesterId }`. Tạo booking hằng tuần suốt học kỳ; mỗi lần kiểm tra xung đột riêng, **bỏ qua tuần** lecturer có exception. |
| GET | `/bookings/recurring` | S | Danh sách chuỗi (active + cancelled) → `RecurringSeries`. |
| GET | `/bookings/recurring/{id}` | O/AD | Chi tiết chuỗi + các lần (`occurrences`). |
| DELETE | `/bookings/recurring/{id}` | O/AD | Hủy chuỗi (chỉ các lần **tương lai**). |

### 6.7 Waitlist (FR-12, Stretch)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/slots/{id}/waitlist` | S | Vào hàng đợi (student suy từ token) → `WAITING`. |
| GET | `/waitlist/me` | S | Mọi entry của mình + vị trí/trạng thái → `WaitlistEntry`. |
| GET | `/slots/{id}/waitlist` | L(chủ)/AD | Hàng đợi một slot (minh bạch/audit). |
| GET | `/lecturers/me/slot-waitlist` | L | Tổng hợp read-only theo slot → `SlotWaitlistGroup[]`. |
| DELETE | `/waitlist/{id}` | S(owner) | Rời hàng đợi → `CANCELLED`. |
| POST | `/waitlist/{id}/accept` | S(owner, đang `OFFERED`) | Nhận slot trước khi hết hạn → tạo booking `CONFIRMED`, entry `FULFILLED`. |
| POST | `/waitlist/{id}/decline` | S(owner, đang `OFFERED`) | Từ chối → chạy allocation cho ứng viên kế tiếp. |

`WaitlistStatus`: `WAITING`, `OFFERED`, `FULFILLED`, `EXPIRED`, `CANCELLED`. Cần **job quét hết hạn** `offer_expires_at` → `EXPIRED` + chạy lại allocation.

### 6.8 Allocation engine (FR-13, FR-14)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/allocation-policies` | AD | Danh sách policy + `config` JSON + `isActive`. |
| POST | `/allocation-policies` | AD | Tạo cấu hình mới (vd HYBRID tinh chỉnh). |
| PATCH | `/allocation-policies/{id}` | AD | Sửa `config` (trọng số…). |
| POST | `/allocation-policies/{id}/activate` | AD | Đặt active (**toàn cục, một policy duy nhất**; không có policy theo khoa — đã loại khỏi scope). |
| POST | `/slots/{id}/run-allocation` | SYSTEM / AD (demo) | Chạy `allocate(slot, candidates, activePolicy)`, ghi `allocation_events`, gửi offer. Tự động khi cancel/decline/expired; Admin gọi tay để demo so sánh policy. |
| POST | `/slots/{id}/override` | AD | `{ studentId, reason }`. Gán slot trống **bỏ qua policy**: hủy mọi `OFFERED` còn lại của slot, tạo booking `CONFIRMED` cho `studentId`, ghi `allocation_events` với `decision: OVERRIDDEN` (vẫn audit được). |
| GET | `/allocation-events` | AD | Log đầy đủ, lọc `slotId`, `policyId`, `decision`, `dateRange`. |
| GET | `/allocation-events/{id}` | AD | Chi tiết: `computedScore`, `decision`, `randomSeed`, `allocatedAt`; với `OVERRIDDEN`: `overriddenBy`, `overrideReason`. FE hiện cần `overriddenByName` (tên hiển thị) — trả cả id lẫn tên. |

**Quy ước metric:** các dòng `OVERRIDDEN` **loại trừ mặc định** khỏi tính Gini/variance (là can thiệp của người, không phải đầu ra của policy) nhưng vẫn giữ trong log.

#### 6.8.1 Research (không phải tính năng người dùng cuối)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/research/synthetic-demand` | AD | `{ seed, popularitySkew, arrivalPattern, numStudents, numLecturers }`. Có thể là batch job. |
| POST | `/research/experiments` | AD | `{ demandRunId, policyNames[], seed }`. Phát lại **cùng một** demand stream qua từng policy. |
| GET | `/research/experiments/{id}` | AD | Metric: Gini, max–min ratio, utilization, time-to-fill, variance chờ… theo policy. |
| GET | `/research/experiments/{id}/export` | AD | Xuất CSV/JSON. |

Cân nhắc **tạm cắt** research API nếu thiếu thời gian (đánh dấu stretch/dev-only trong `Pages.txt` #31).

### 6.9 Notification (FR-11)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/notifications` | A | `?unreadOnly=true`. |
| POST | `/notifications/{id}/read` | A(owner) | Đánh dấu đã đọc. |
| POST | `/notifications/read-all` | A | Đọc tất cả. |
| GET | `/notifications/stream` | A | **SSE** (`text/event-stream`): `booking.pending`, `booking.confirmed`, `booking.declined`, `booking.cancelled`, `waitlist.offered`, `waitlist.expired`. |

Kèm theo: gửi **email SMTP** cho cùng tập sự kiện (không có REST riêng) song song với SSE và ghi dòng `notifications`. Chốt danh mục event theo mục 3 #7.
`NotificationPrefs` (FE): `{ bookingConfirmed, bookingDeclined, waitlistOffer, reminders }` — lưu theo user, thuộc `PATCH /users/me`.

### 6.10 Admin analytics (FR-17, Stretch)

| Method | Path | Role | Mô tả |
|---|---|---|---|
| GET | `/admin/analytics/advisor-load` | AD | Số booking/giờ theo lecturer trong khoảng ngày. |
| GET | `/admin/analytics/no-show-rate` | AD | Tỷ lệ no-show tổng/theo lecturer/theo khoa. |
| GET | `/admin/analytics/equity` | AD | Gini (slots/student, truy cập lecturer/student) + điểm Lorenz → `EquityMetrics`. |
| GET | `/admin/analytics/policy-comparison` | AD | So sánh policy → `PolicyComparisonRow[]` (phục vụ demo). |

---

## 7. Quy trình nghiệp vụ

### 7.1 State machine của booking

```
[*] ──student request──▶ PENDING
PENDING ──lecturer confirm──▶ CONFIRMED
PENDING ──lecturer decline──▶ DECLINED   (kết thúc)
CONFIRMED ──cancel (một trong hai bên)──▶ CANCELLED   (kết thúc)
CONFIRMED ──họp xong──▶ COMPLETED          (kết thúc)
CONFIRMED ──student vắng──▶ NO_SHOW        (kết thúc)
```

Chỉ cho phép các chuyển trạng thái trên; mọi chuyển khác → `409/422`. Nên đóng gói trong một service duy nhất + test bảng chuyển.

### 7.2 Đặt lịch có kiểm tra xung đột

1. FE: `GET /lecturers/{id}/slots?week=…` → backend trả slot **đã lọc xung đột** (cache Redis nếu có).
2. FE: `POST /bookings`.
3. Backend: validate lại xung đột phía server → `INSERT booking` (exclusion constraint chống race).
   - Thua race → `409` + `{ waitlistAvailable: true }`.
   - Thành công → `PENDING`, thông báo lecturer, `201`.

### 7.3 Phân bổ khi slot trống (đường nghiên cứu)

Slot trống (cancel/decline/hết hạn offer) → lấy waitlist đủ điều kiện → `allocate(slot, candidates, activePolicy)` → ghi `allocation_events` (mọi ứng viên: `SELECTED`/`SKIPPED`) → gửi **offer có hạn** cho người thắng.
Nhận trước hạn → tạo booking `CONFIRMED`; hết hạn → chạy lại cho ứng viên kế tiếp.

---

## 8. Allocation engine — đặc tả để backend cài lại

Hiện có bản TypeScript tham chiếu: `lib/allocation/engine.ts`, `lib/allocation/types.ts`, `lib/prng.ts`. Backend (Java) phải cho **kết quả giống hệt** với cùng `(candidates, config, seed, now)`.

### 8.1 Interface

```
allocate(candidates[], policyName, config, seed, now) → { policyName, randomSeed, winner|null, candidates[] }
```

`AllocationCandidate`: `waitlistEntryId`, `studentId`, `requestedAt`, `daysSinceLastMeetingThisLecturer|null`, `daysSinceLastMeetingAnyLecturer|null`, `recentAccessCount`.
Mỗi ứng viên sinh một dòng `allocation_events` (`SELECTED`/`SKIPPED`); `winner = null` khi không ai đủ điều kiện.

### 8.2 Chuẩn hóa tín hiệu về `[0,1]`

```
need(c) = clamp01( days(c) / 90 )
days(c) = daysSinceLastMeetingThisLecturer ?? daysSinceLastMeetingAnyLecturer ?? 90
wait(c) = clamp01( hoursWaiting(c) / 168 )          // 168h = 1 tuần
clamp01(x) = max(0, min(1, x))
```

### 8.3 Bốn policy

| Policy | Công thức / luật | Config mặc định |
|---|---|---|
| **FCFS** | Chọn `requestedAt` nhỏ nhất (hòa → `waitlistEntryId` nhỏ hơn). Điểm báo cáo: `1 − rank/(n−1)` (n>1), `1` nếu n=1. | — |
| **NEED** | `score = (needWeight·need + waitTimeWeight·wait) / (needWeight + waitTimeWeight)` | `needWeight=1`, `waitTimeWeight=0` |
| **ROUND_ROBIN** | Cổng điều kiện: `eligible = recentAccessCount < maxPerWindow`; trong nhóm đủ điều kiện chọn theo FCFS. Nếu **mọi** ứng viên vượt ngưỡng → `winner = null` (không chọn "ít tệ nhất"). | `maxPerWindow=1` |
| **HYBRID** | `score = (needWeight·need + waitTimeWeight·wait + fairnessWeight·rand) / (tổng 3 trọng số)`; `rand(c) = mulberry32(seededHash(seed, waitlistEntryId))()` | `needWeight=0.5`, `waitTimeWeight=0.3`, `fairnessWeight=0.2` |

Tên field `config` trong DB/FE: `needWeight`, `waitTimeWeight`, `fairnessWeight`, `maxPerWindow` (**không** dùng `waitWeight`/`randomWeight`).

### 8.4 Tái lập (NFR-3)

- Một `seed` cho **mỗi lần chạy** allocation (mỗi sự kiện slot trống), **chung** cho mọi dòng event của lần đó (không phải seed riêng từng ứng viên).
- PRNG: **`mulberry32(seed)`** (thuần túy, không dùng random hệ thống) và **`seededHash(seed, salt)`** để mỗi ứng viên có giá trị random độc lập không phụ thuộc thứ tự mảng.
- Backend cần **test vector** lấy từ bản TS: cho cùng input phải ra cùng `winner` và `computedScore` (làm tròn `numeric(10,4)`). Tránh dùng `Math.random()`/`Random()` không seed. Chú ý số học 32-bit (ép kiểu `int` trong Java khi cài `mulberry32`).

### 8.5 Metric nghiên cứu (nếu cài phía server)

`giniSlotsPerStudent`, `giniLecturerAccess`, `maxMinRatio`, `pctStudentsWithSlot`, `slotUtilizationPct`, `avgWaitTimeSeconds`, `waitTimeVariance` (phương sai **quần thể**, ÷n), `offerRejectionRatePct`, `avgTimeToFillSeconds`. Hiện mô phỏng bằng `simulatePolicy()` phía client — **không** phải bộ sinh dữ liệu server-side đầy đủ.

---

## 9. Đối chiếu DTO: FE type ↔ API

FE type nằm ở `lib/office-hours/types.ts` và `lib/auth/types.ts`. Backend **trả đúng tên/giá trị của FE**.

| FE type | Endpoint nguồn | Ghi chú map từ DB |
|---|---|---|
| `AuthUser`, `LoginResponse` | `/auth/login`, `/users/me` | `expiresIn` giây |
| `ProblemDetail` | mọi lỗi | RFC 7807 |
| `PublicSlot`, `PublicOfficeHoursResponse` | `/public/office-hours` | phân trang Spring |
| `TodayAvailabilitySlot` | (widget dashboard) | thêm `lecturerId`; chưa có endpoint riêng → dùng `/slots` hoặc thêm `/slots/today` |
| `BookableSlot` | `/lecturers/{id}/slots` | `available=false` nếu đã có người đặt; `conflict=true` nếu trùng lịch của student |
| `Booking`, `BookingParticipant` | `/bookings*` | thêm `slotId`, `lecturerId`, `studentId` |
| `BookingTimelineEvent` | `/bookings/{id}` (hoặc `/timeline`) | FE hiện suy ra từ status + startAt; backend nên trả lịch sử thật |
| `Notification`, `NotificationPrefs` | `/notifications*` | `read` = `read_at != null`; `title/body` (mục 3 #7) |
| `RecurringSeries`, `RecurringOccurrence` | `/bookings/recurring*` | `dayOfWeek` thống nhất ISO 1–7; `semester` là tên |
| `WaitlistEntry`, `SlotWaitlistGroup` | `/waitlist/me`, `/lecturers/me/slot-waitlist` | `position` tính động; `desiredSlotLabel` dựng từ slot |
| `AvailabilityRule`, `AvailabilityException` | `/availability-*` | `slot_minutes`→`slotLengthMinutes`, `exception_date`→`date`, `active` suy từ effective range |
| `ScheduleBlock`, `AdminScheduleEntry` | `/users/me/schedule-entries`, `/users/{id}/schedule-entries` | `group_code`→`group`, `date_label`→`date`, `AAO_IMPORT`→`IMPORTED`; admin thêm `ownerName`, `ownerRole` |
| `ParsedTimetableRow` | body `/schedule-entries/batch` | `day` là chuỗi "Thứ 2".."Chủ Nhật" → map sang `dayOfWeek` |
| `ScheduleImportHistoryEntry` | `/users/me/schedule-imports` | mục 3 #9 |
| `AdminUserRow` | `/users` | `is_active`→`active` |
| `Semester` | `/semesters*` | `is_active`→`active` |
| `AllocationPolicy`, `AllocationEvent` | `/allocation-*` | `AllocationEvent.overriddenByName` = tên admin |
| `EquityMetrics`, `PolicyComparisonRow` | `/admin/analytics/*` | |
| `SyntheticDemandRun`, `Experiment`, `ExperimentPolicyResult` | `/research/*` | `dataset jsonb` không đưa vào DTO |

**Mock hiện đang đứng thay API** (xem `lib/office-hours/mock-data.ts`): `getMockOfficeHours`→`/public/office-hours`, `getMockStudentBookings`/`getMockLecturerBookings`→`/bookings`, `getMockLecturers`→`/lecturers`, `getMockSuggestedLecturerSlots`→`/users/me/suggested-slots`, `getMockWaitlistEntries`→`/waitlist/me`, `getMockAllocationPolicies`→`/allocation-policies`, `getMockPolicyComparison`→`/admin/analytics/policy-comparison`. Mỗi hàm này sẽ được thay bằng `fetch` tới route BFF tương ứng.

---

## 10. Kế hoạch triển khai backend đề xuất

Thứ tự theo phụ thuộc và giá trị demo; mỗi mốc có tiêu chí hoàn thành (DoD).

| Mốc | Nội dung | DoD |
|---|---|---|
| **M0 — Nền tảng** | Project Spring Boot, Flyway, Docker compose (Postgres+Redis), RFC 7807 handler, security filter JWT, cấu hình timezone, seed | `docker compose up` chạy; `/actuator/health` OK; migration chạy từ DB trống |
| **M1 — Auth & user** | §6.1; refresh/logout (Redis blacklist); forgot/reset | FE đăng nhập thật được (bỏ nhánh fallback mock); token reset dùng một lần, thu hồi refresh token |
| **M2 — Semester & availability** | §6.2, §6.3; **sinh slot** từ rule+exception | Test: sửa rule không đụng slot đã book; BLOCK/ADD đúng |
| **M3 — Schedule entries** | §6.4 (fast-path batch, CRUD, REPLACE/MERGE) | `MERGE` khử trùng lặp; `REPLACE` giữ block `MANUAL` |
| **M4 — Slot & booking lõi** | §6.5, §6.6 + exclusion constraint + trigger denormalize | **Test đồng thời** (N request song song cùng slot → đúng 1 `CONFIRMED`, còn lại `409`); slot query p95 < 300 ms ở dữ liệu pilot |
| **M5 — Notification** | §6.9 (bản ghi + SSE + email) | Sự kiện booking đẩy tới SSE; `read`/`read-all` |
| **M6 — Waitlist & allocation** | §6.7, §6.8, §8 | Test vector khớp bản TS; mọi ứng viên có `allocation_events`; override ghi `OVERRIDDEN` đúng CHECK |
| **M7 — Group/Recurring** | §6.6.1, §6.6.2 | Capacity được enforce; recurring bỏ qua tuần có exception |
| **M8 — Analytics/Research (stretch)** | §6.10, §6.8.1 | Số liệu khớp mô phỏng FE trong sai số |
| **M9 — Import lớn (stretch)** | §6.4 phần "giai đoạn sau" | Job không timeout; preview/commit nguyên tử |

### 10.1 Danh sách test bắt buộc

1. **Đồng thời**: 50 request `POST /bookings` cùng một slot → đúng 1 `PENDING→CONFIRMED` hợp lệ, không bao giờ 2 `CONFIRMED` chồng nhau.
2. **Xung đột lịch**: student có lớp 07:30–09:30 → slot chồng không xuất hiện trong `/slots` và `POST /bookings` trả `422`.
3. **State machine**: mọi chuyển trạng thái sai bị từ chối.
4. **Confirm vi phạm constraint** → `409` (mục 3 #3).
5. **Notice period** khi hủy/reschedule; Admin được override.
6. **Allocation**: 4 policy; `ROUND_ROBIN` tất cả vượt ngưỡng → `winner=null`; HYBRID cùng seed → cùng kết quả; điểm luôn thuộc `[0,1]`; danh sách rỗng không crash.
7. **Override** bỏ qua policy nhưng vẫn ghi audit; bị loại khỏi metric mặc định.
8. **RBAC** từng endpoint (đặc biệt row-level: student A không đọc booking của student B).
9. **forgot-password** luôn `202`, không lộ email tồn tại; reset token dùng lại bị `400`.
10. **Import**: `MERGE` không nhân đôi, `REPLACE` giữ `MANUAL`, file không phải AAO bị từ chối.

### 10.2 Bảo mật & vận hành (NFR-4, NFR-6, NFR-7)

- Băm mật khẩu bcrypt/argon2; không log mật khẩu/token; rate-limit auth.
- Validate file import (MIME + chữ ký + schema); giới hạn kích thước.
- Log có cấu trúc + metric cơ bản (số booking, số lần allocation, tỷ lệ gửi notification).
- Một lệnh `docker compose up` dựng toàn bộ stack dev; triển khai pilot một VM.

---

## 11. Câu hỏi còn mở (cần đội chốt)

1. Slot listing có cần auth để tính xung đột theo từng student, hay có chế độ "raw availability" công khai? (Hiện: cần auth; `/public/office-hours` là bản tổng hợp công khai.)
2. `POST /slots/{id}/run-allocation` có bị gọi bởi thứ gì ngoài job hệ thống không? Nếu không, chỉ giữ cho demo admin (nguyên tắc "không endpoint đầu cơ").
3. Reschedule là **atomic một endpoint** hay hai lời gọi phía client? (Ảnh hưởng transaction của exclusion constraint.)
4. Cần fallback polling `GET /notifications?since=` ngoài SSE không (PWA/nền)?
5. Override: mọi Admin hay admin theo khoa; và có dùng mẫu thông báo riêng ("quản trị viên đã gán lại slot") để không gây hiểu lầm không?
6. Chiến lược retention/partition cho `allocation_events`, `notifications`.
7. Định dạng AAO thực tế: chỉ PDF hay còn CSV/XLSX?

---

## 12. Tài liệu liên quan

| File | Nội dung |
|---|---|
| `docs/capstone-officehours-plan.md` | Kế hoạch tổng thể, FR/NFR, use case, ERD, thiết kế nghiên cứu |
| `docs/capstone-api-endpoints.md` | Đặc tả endpoint gốc (tiếng Anh) |
| `docs/capstone-db-schema.md` | DDL PostgreSQL đầy đủ + quyết định thiết kế |
| `docs/allocate-engine.md` | Công thức, chuẩn hóa, mô phỏng, kiểm chứng của `allocate()` |
| `Pages.txt` | 31 trang/route của FE và quyền truy cập |
| `lib/office-hours/types.ts` | DTO mà FE đang kỳ vọng |
