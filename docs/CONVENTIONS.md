# Quy ước chung của 3 repo

Áp dụng cho web, backend và mobile. Quy ước riêng của từng repo nằm trong [PROJECT-HUB.md](PROJECT-HUB.md).

## Nhánh

| Repo | Quy tắc |
|---|---|
| Backend | Mọi code nằm trên `feature/realtime-hybrid`. Không tạo nhánh tính năng. |
| Web, mobile | Tạo nhánh từ `main`, đặt tên `feature/<mã-task>-<mô-tả>`, ví dụ `feature/MO-16-chat`. |

Chỉ push khi đã chạy kiểm tra của repo đó và pass. Không force-push nhánh dùng chung.

## Commit

Mẫu: `<loại>(<phạm vi>): <mã-task> <mô tả>`

```text
feat(booking): BE-15 create booking with conflict checks
fix(chat): MO-16 reconnect after losing the socket
docs(api): add booking timeline endpoint
```

Loại gồm `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

## Khi nào một task là xong

1. Code và test đã xong, kiểm tra của repo pass.
2. Hợp đồng API hoặc schema đã cập nhật nếu có đổi.
3. Đã tick task trong checklist, cùng commit với code.
4. Đã push.

## Đổi API hoặc schema

Thứ tự luôn là:

1. Sửa `capstone-api-endpoints.md` hoặc `capstone-db-schema.md` trong repo web.
2. Sửa backend theo tài liệu đó.
3. Sửa web và mobile.

Nếu thay đổi làm hỏng client đang chạy, ghi rõ trong commit và thêm task ở checklist của client đó.

## Quy ước dữ liệu

| Mục | Quy ước |
|---|---|
| Base URL | `/api/v1` |
| Xác thực | `Authorization: Bearer <accessToken>` |
| Tên trường JSON | `camelCase` |
| Tên bảng, cột | `snake_case`, tên bảng số nhiều |
| ID | UUID, trừ `booking_events` và `chat_messages` dùng số tăng dần |
| Thời gian qua API | UTC, ISO-8601 |
| Múi giờ của trường | `Asia/Ho_Chi_Minh`, dùng khi sinh slot từ rule |
| Ngày trong tuần | ISO: 1 là Thứ Hai, 7 là Chủ Nhật |
| Phân trang | `{ content, totalElements, totalPages, page, size }` |
| Lỗi | `{ status, error, message, path, timestamp, details? }`. Client xử lý theo `status` và `error`, không theo `message` |

## Dữ liệu nằm ở đâu

| Dữ liệu | Nơi lưu | Ai ghi |
|---|---|---|
| User, slot, booking, chat, allocation | Postgres | Backend |
| Bản sao slot, booking, thông báo | Firestore | Backend, sau khi commit |
| Vị trí trực tiếp | Realtime Database, không lưu Postgres | App mobile |
| Trạng thái giảng viên | Firebase | App mobile |
| Cache slot, giới hạn tần suất | Redis | Backend |

Postgres luôn là nguồn đúng. Client không tự ghi vào bản sao trên Firestore.

## Bí mật và dữ liệu của trường

- Không đưa file service account của Firebase vào git.
- Không in giá trị bí mật ra log hoặc tài liệu.
- Sơ đồ và ảnh của EIU chỉ để ở máy, trong `docs/campus/reference/` của repo mobile, vì repo đó public.
