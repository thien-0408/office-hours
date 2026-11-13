# Codex workflow

Read and follow `CODEX.md` for task scope, tool use, and verification defaults.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design system

Read `docs/DESIGN.md` before writing any UI/CSS — it has the color tokens, typography, and the
auth-full-glass-vs-app-restrained treatment split. Don't invent new colors or ad hoc status badge
colors; use the tokens and the status-to-hue mapping already defined there.

# Dự án OfficeHours: 3 repo

Repo này là **web**, và là nơi giữ hợp đồng API và schema của cả dự án. Ba repo được clone **cạnh nhau trong cùng một thư mục cha**, nên đường dẫn dưới đây tính từ thư mục gốc của repo này. Không đặt repo trong đường dẫn có dấu tiếng Việt, vì build Android của mobile sẽ lỗi.

| Repo | Đường dẫn | Remote, nhánh | Vai trò |
|---|---|---|---|
| Web | `../office-hours` | `thien-0408/office-hours`, tạo nhánh từ `main` | Next.js. Giữ hợp đồng API và schema |
| Backend | `../office-hours-backend` (Maven ở `OfficeHours/`) | `chaunhattang/office-hours` (private), chỉ dùng `feature/realtime-hybrid` | Spring Boot, backend duy nhất cho web và mobile |
| Mobile | `../office-hours-mobile` | `thien-0408/office-hours-mobile`, tạo nhánh từ `main` | React Native cho CSW434 |

Nếu thiếu repo nào thì clone vào cạnh repo này: `gh repo clone <remote> <thư mục>`. Với backend thì checkout thêm `feature/realtime-hybrid`.

**Đọc docs trước. Chỉ đọc code repo khác khi docs không trả lời được.**

| Cần | Đọc |
|---|---|
| Bản đồ và tiến độ cả dự án | `docs/PROJECT-HUB.md` |
| Quy ước chung: nhánh, commit, JSON, lỗi, thời gian | `docs/CONVENTIONS.md` |
| Hợp đồng API, schema | `docs/capstone-api-endpoints.md`, `docs/capstone-db-schema.md` |
| Kiến trúc backend, mô hình hybrid Postgres + Firebase | `../office-hours-backend/OfficeHours/ARCHITECTURE.md` |
| Plan và checklist từng repo | Web: `docs/WEB-CHECKLIST.md`. Backend: `OfficeHours/BACKEND-PLAN.md`, `OfficeHours/CHECKLIST.md`. Mobile: `MOBILE-PLAN.md`, `CHECKLIST.md`, `SCREENS-FIREBASE.md` |

- JSON mà API trả về thật nằm ở DTO của backend: `OfficeHours/src/main/java/eiu/officehours/*/model/responses/` và `*/spi/*Response.java`. Nếu DTO khác docs thì báo người dùng, không tự chọn một bên.
- `lib/office-hours/types.ts` là dữ liệu mock, id dạng số. API thật dùng UUID, nên khi nối trang với backend thì lấy type theo DTO.
- Đổi API hoặc schema thì sửa docs ở đây trước, rồi backend, rồi mới tới web và mobile.
- Chỉ sửa repo khác khi người dùng yêu cầu. Backend là nhánh dùng chung: không commit hay push vào đó khi chưa được đồng ý.
