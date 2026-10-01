# OfficeHours — Database Schema Prototype (PostgreSQL)

Sơ đồ ERD dạng Mermaid, rút ra từ `capstone-db-schema.md` (nguồn chính xác, có đầy đủ DDL, index và constraint).
File này là bản nhìn nhanh để dev backend định hình entity và quan hệ trước khi viết migration.
Xem trên GitHub, VS Code (Markdown Preview Mermaid) hoặc dán vào <https://mermaid.live>.

Quy ước: `PK` khóa chính, `FK` khóa ngoại, `UK` unique. Kiểu `numeric`/`varchar` bỏ độ dài cho gọn.
`day_of_week` luôn là ISO 1–7 (Thứ 2 = 1 … Chủ nhật = 7).

---

## 1. Tổng quan (chỉ bảng + quan hệ)

```mermaid
erDiagram
    USERS ||--o| LECTURER_PROFILES : "has (lecturers)"
    USERS ||--o{ PASSWORD_RESET_TOKENS : requests
    USERS ||--o{ NOTIFICATIONS : receives

    SEMESTERS ||--o{ AVAILABILITY_RULES : scopes
    USERS ||--o{ AVAILABILITY_RULES : "lecturer sets"
    USERS ||--o{ AVAILABILITY_EXCEPTIONS : "lecturer blocks/adds"
    AVAILABILITY_RULES ||--o{ SLOTS : materializes
    USERS ||--o{ SLOTS : "lecturer owns"

    USERS ||--o{ SCHEDULE_ENTRIES : "busy blocks"
    SEMESTERS ||--o{ SCHEDULE_ENTRIES : scopes
    SCHEDULE_IMPORTS ||--o{ SCHEDULE_ENTRIES : produces
    USERS ||--o{ SCHEDULE_IMPORTS : "uploaded_by / target_user"
    SCHEDULE_IMPORTS ||--o{ SCHEDULE_IMPORT_STAGING : "DEFERRED"

    SLOTS ||--o{ BOOKINGS : "booked as"
    USERS ||--o{ BOOKINGS : "student books"
    SEMESTERS ||--o{ BOOKINGS : scopes
    BOOKINGS ||--o{ BOOKING_PARTICIPANTS : "group members"
    USERS ||--o{ BOOKING_PARTICIPANTS : joins
    BOOKINGS ||--o| MEETING_RECORDS : "after the meeting"
    USERS ||--o{ RECURRING_BOOKINGS : "student/lecturer"

    SLOTS ||--o{ WAITLIST_ENTRIES : queues
    USERS ||--o{ WAITLIST_ENTRIES : waits
    WAITLIST_ENTRIES ||--o{ ALLOCATION_EVENTS : audited
    ALLOCATION_POLICIES ||--o{ ALLOCATION_EVENTS : decides
    ALLOCATION_POLICIES ||--o{ EXPERIMENTS : evaluated
    SYNTHETIC_DEMAND_RUNS ||--o{ EXPERIMENTS : feeds
```

---

## 2. Identity & Directory

```mermaid
erDiagram
    USERS {
        bigserial id PK
        citext email UK
        text password_hash
        varchar full_name
        user_role role "STUDENT | LECTURER | ADMIN"
        varchar department
        boolean is_active "soft delete"
        timestamptz created_at
        timestamptz updated_at
    }
    LECTURER_PROFILES {
        bigint user_id PK, FK "must be role=LECTURER (app guard)"
        varchar slug UK "amara-chen"
        text photo_url
        varchar blurb
        varchar specialty
    }
    PASSWORD_RESET_TOKENS {
        bigserial id PK
        bigint user_id FK
        text token_hash UK "SHA-256, raw token only in email"
        timestamptz expires_at "created_at + 30 min"
        timestamptz used_at "NULL = still redeemable"
        timestamptz created_at
    }
    SEMESTERS {
        bigserial id PK
        varchar name
        date start_date
        date end_date "CHECK end > start"
        boolean is_active
    }
    NOTIFICATIONS {
        bigserial id PK
        bigint user_id FK
        varchar type "booking.pending | booking.confirmed | booking.declined | booking.cancelled | waitlist.offered | waitlist.expired | reminder.upcoming"
        jsonb payload
        timestamptz read_at
        timestamptz created_at
    }
    USERS ||--o| LECTURER_PROFILES : has
    USERS ||--o{ PASSWORD_RESET_TOKENS : requests
    USERS ||--o{ NOTIFICATIONS : receives
```

---

## 3. Availability & Slots (lecturer)

```mermaid
erDiagram
    AVAILABILITY_RULES {
        bigserial id PK
        bigint lecturer_id FK
        bigint semester_id FK
        smallint day_of_week "ISO 1-7"
        time start_time
        time end_time "CHECK end > start"
        int slot_minutes "CHECK window fits one slot"
        date effective_from
        date effective_to
        timestamptz created_at
    }
    AVAILABILITY_EXCEPTIONS {
        bigserial id PK
        bigint lecturer_id FK
        date exception_date
        exception_type type "BLOCK | ADD"
        time start_time
        time end_time
        varchar reason
        timestamptz created_at
    }
    SLOTS {
        bigserial id PK
        bigint lecturer_id FK
        bigint rule_id FK "NULL for ad-hoc ADD slots"
        timestamptz start_at
        timestamptz end_at "CHECK end > start"
        int capacity "default 1"
        slot_status status "OPEN | FULL | CLOSED"
    }
    USERS ||--o{ AVAILABILITY_RULES : sets
    SEMESTERS ||--o{ AVAILABILITY_RULES : scopes
    USERS ||--o{ AVAILABILITY_EXCEPTIONS : declares
    AVAILABILITY_RULES ||--o{ SLOTS : materializes
    USERS ||--o{ SLOTS : owns
```

> Slots được materialize từ rule (cộng/trừ exception) khi rule được tạo hoặc sửa. `rule_id ON DELETE SET NULL` để xóa rule không xóa lịch sử booking.

---

## 4. Timetable (busy blocks, import từ PDF)

```mermaid
erDiagram
    SCHEDULE_ENTRIES {
        bigserial id PK
        bigint user_id FK "owner, from token"
        bigint semester_id FK
        varchar title
        varchar subject_code
        varchar subject_name
        varchar group_code
        smallint day_of_week "ISO 1-7"
        varchar date_label
        time start_time
        time end_time
        varchar room
        schedule_location_type location_type "LAB | ROOM | ONLINE | OTHER"
        varchar lecturer_name "teacher of the class, free text"
        varchar color_hue
        text notes
        varchar source "AAO_IMPORT | MANUAL"
        bigint import_batch_id FK "SET NULL on delete"
    }
    SCHEDULE_IMPORTS {
        bigserial id PK
        bigint semester_id FK
        bigint uploaded_by FK
        bigint target_user_id FK "NULL = self-service"
        text_array source_files "original PDF names"
        import_mode mode "REPLACE | MERGE"
        import_status status "QUEUED | PROCESSING | COMPLETED | FAILED"
        int rows_processed
        int rows_added
        int rows_replaced
        int rows_failed
        int rows_skipped
        jsonb error_log
        timestamptz created_at
        timestamptz completed_at
    }
    SCHEDULE_IMPORT_STAGING {
        bigserial id PK "DEFERRED - not in MVP"
        bigint import_batch_id FK
        int temp_row_num
        bigint user_id FK
        bigint semester_id FK
        varchar title
        smallint day_of_week
        time start_time
        time end_time
        staging_row_status status "VALID | DUPLICATE | CONFLICT | INVALID"
        text conflict_notes
    }
    USERS ||--o{ SCHEDULE_ENTRIES : owns
    SEMESTERS ||--o{ SCHEDULE_ENTRIES : scopes
    SCHEDULE_IMPORTS ||--o{ SCHEDULE_ENTRIES : produces
    USERS ||--o{ SCHEDULE_IMPORTS : uploads
    SCHEDULE_IMPORTS ||--o{ SCHEDULE_IMPORT_STAGING : stages
```

> **Luồng import (MVP):** trình duyệt parse PDF → gửi một mảng JSON `rows[]` tới `POST /users/me/schedule-entries/batch` → backend validate, ghi `schedule_entries` trong **một transaction** + một dòng `schedule_imports` (`COMPLETED` hoặc `FAILED`).
> **Dedup MERGE:** `UNIQUE (user_id, semester_id, day_of_week, start_time, end_time, subject_code) NULLS NOT DISTINCT` (PostgreSQL 15+) để `INSERT … ON CONFLICT DO NOTHING` dùng được.

---

## 5. Booking, Waitlist, Recurring

```mermaid
erDiagram
    BOOKINGS {
        bigserial id PK
        bigint slot_id FK "RESTRICT"
        bigint student_id FK "RESTRICT"
        bigint semester_id FK
        booking_status status "PENDING | CONFIRMED | DECLINED | CANCELLED | COMPLETED | NO_SHOW"
        boolean is_group
        varchar topic
        tstzrange time_range "denormalized from slot"
        varchar decline_reason
        timestamptz created_at
        timestamptz confirmed_at
        timestamptz cancelled_at
        bigint cancelled_by FK
    }
    BOOKING_PARTICIPANTS {
        bigint booking_id PK, FK
        bigint student_id PK, FK "added by email"
        timestamptz joined_at
    }
    MEETING_RECORDS {
        bigserial id PK
        bigint booking_id UK, FK
        boolean attended
        text notes "not an LMS field"
        timestamptz recorded_at
    }
    RECURRING_BOOKINGS {
        bigserial id PK
        bigint student_id FK
        bigint lecturer_id FK
        bigint semester_id FK
        smallint day_of_week "ISO 1-7"
        time start_time
        time end_time
        boolean is_cancelled
        timestamptz created_at
    }
    WAITLIST_ENTRIES {
        bigserial id PK
        bigint slot_id FK "per-slot waitlist"
        bigint student_id FK
        timestamptz requested_at
        numeric priority_score
        waitlist_status status "WAITING | OFFERED | EXPIRED | FULFILLED | CANCELLED"
        timestamptz offered_at
        timestamptz offer_expires_at
    }
    SLOTS ||--o{ BOOKINGS : "booked as"
    USERS ||--o{ BOOKINGS : books
    SEMESTERS ||--o{ BOOKINGS : scopes
    BOOKINGS ||--o{ BOOKING_PARTICIPANTS : includes
    USERS ||--o{ BOOKING_PARTICIPANTS : joins
    BOOKINGS ||--o| MEETING_RECORDS : records
    USERS ||--o{ RECURRING_BOOKINGS : "student / lecturer"
    SLOTS ||--o{ WAITLIST_ENTRIES : queues
    USERS ||--o{ WAITLIST_ENTRIES : waits
```

**Ràng buộc quan trọng**

| Ràng buộc | Mục đích |
|---|---|
| `EXCLUDE USING gist (lecturer_id WITH =, time_range WITH &&) WHERE (status = 'CONFIRMED')` (cần `btree_gist`) | Không bao giờ double-book một giảng viên; chỉ áp dụng cho `CONFIRMED`, nên nhiều `PENDING` cùng slot là hợp lệ |
| `/confirm` bắt lỗi vi phạm exclusion → `409 SLOT_ALREADY_CONFIRMED` | Người xác nhận sau thua; cùng transaction tự `DECLINED` các `PENDING` còn lại của slot |
| `UNIQUE (slot_id, student_id)` trên `waitlist_entries` | Một sinh viên chỉ xếp hàng một lần cho mỗi slot |
| `position` waitlist **không có cột** | Tính khi đọc theo `requested_at` / `priority_score` giữa các `WAITING` của slot |
| Job định kỳ: `OFFERED` quá `offer_expires_at` → `EXPIRED` rồi chạy lại allocation | Offer hết hạn tự nhả slot |

---

## 6. Allocation Engine & Research

```mermaid
erDiagram
    ALLOCATION_POLICIES {
        bigserial id PK
        varchar name UK "FCFS | NEED | ROUND_ROBIN | HYBRID"
        jsonb config
        boolean is_active
    }
    ALLOCATION_EVENTS {
        bigserial id PK
        bigint waitlist_entry_id FK
        bigint policy_id FK
        numeric computed_score
        allocation_decision decision "SELECTED | SKIPPED | OVERRIDDEN"
        int random_seed "mulberry32 seed, reproducible"
        bigint overridden_by FK "admin who overrode"
    }
    SYNTHETIC_DEMAND_RUNS {
        bigserial id PK
        int seed
        numeric popularity_skew
        varchar arrival_pattern
        int num_students
        int num_lecturers
        timestamptz generated_at
        jsonb dataset
    }
    EXPERIMENTS {
        bigserial id PK
        bigint demand_run_id FK
        bigint policy_id FK
        int seed
        numeric gini_slots_per_student
        numeric gini_lecturer_access
        numeric max_min_ratio
        numeric pct_students_with_slot
        numeric slot_utilization_pct
        int avg_time_to_fill_seconds
        numeric offer_rejection_rate_pct
        int avg_wait_time_seconds
        numeric wait_time_variance
        timestamptz run_at
    }
    WAITLIST_ENTRIES ||--o{ ALLOCATION_EVENTS : audited
    ALLOCATION_POLICIES ||--o{ ALLOCATION_EVENTS : decides
    ALLOCATION_POLICIES ||--o{ EXPERIMENTS : evaluated
    SYNTHETIC_DEMAND_RUNS ||--o{ EXPERIMENTS : feeds
    USERS ||--o{ ALLOCATION_EVENTS : overrides
```

> `allocation_events` + `random_seed` giúp chạy lại một quyết định cho ra đúng kết quả cũ (audit và nghiên cứu công bằng). Các bảng `synthetic_demand_runs` / `experiments` là dữ liệu nghiên cứu, không thuộc luồng sản phẩm chính.

---

## 7. Enum

| Enum | Giá trị |
|---|---|
| `user_role` | STUDENT, LECTURER, ADMIN |
| `exception_type` | BLOCK, ADD |
| `schedule_location_type` | LAB, ROOM, ONLINE, OTHER |
| `import_mode` | REPLACE, MERGE |
| `import_status` | QUEUED, PROCESSING, COMPLETED, FAILED |
| `staging_row_status` | VALID, DUPLICATE, CONFLICT, INVALID |
| `slot_status` | OPEN, FULL, CLOSED |
| `booking_status` | PENDING, CONFIRMED, DECLINED, CANCELLED, COMPLETED, NO_SHOW |
| `waitlist_status` | WAITING, OFFERED, EXPIRED, FULFILLED, CANCELLED |
| `allocation_decision` | SELECTED, SKIPPED, OVERRIDDEN |

## 8. Extension cần bật

`citext` (email không phân biệt hoa thường), `btree_gist` (exclusion constraint chống double-booking). `NULLS NOT DISTINCT` yêu cầu PostgreSQL 15 trở lên.
