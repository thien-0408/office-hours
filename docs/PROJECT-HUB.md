# OfficeHours: bản đồ dự án

Trang này nối 3 repo lại với nhau. Bắt đầu từ đây nếu chưa biết tài liệu hay việc nào nằm ở đâu.

## Ba repo

| Repo | Vai trò | Nhánh làm việc |
|---|---|---|
| [thien-0408/office-hours](https://github.com/thien-0408/office-hours) | Web Next.js, giữ hợp đồng API và schema | `main` |
| [chaunhattang/office-hours](https://github.com/chaunhattang/office-hours) (private) | Backend Spring Boot, dùng chung cho web và mobile | `feature/realtime-hybrid` |
| [thien-0408/office-hours-mobile](https://github.com/thien-0408/office-hours-mobile) | App React Native cho môn CSW434 | `main` |

## Tài liệu ở đâu

| Cần xem | Tài liệu |
|---|---|
| Hợp đồng API | [capstone-api-endpoints.md](https://github.com/thien-0408/office-hours/blob/main/docs/capstone-api-endpoints.md) |
| Schema database | [capstone-db-schema.md](https://github.com/thien-0408/office-hours/blob/main/docs/capstone-db-schema.md) |
| Hướng dẫn backend bằng tiếng Việt | [BACKEND-API-GUIDE-VI.md](https://github.com/thien-0408/office-hours/blob/main/docs/BACKEND-API-GUIDE-VI.md) |
| Quy ước chung | [CONVENTIONS.md](https://github.com/thien-0408/office-hours/blob/main/docs/CONVENTIONS.md) |
| Bối cảnh hybrid và GPS | [HANDOFF-mobile-hybrid-gps.md](https://github.com/thien-0408/office-hours/blob/main/docs/HANDOFF-mobile-hybrid-gps.md) |

| Repo | Kế hoạch | Checklist | Quy ước riêng | Kiến trúc |
|---|---|---|---|---|
| Web | [Plan capstone](https://github.com/thien-0408/office-hours/blob/main/docs/capstone-officehours-plan.md) | [WEB-CHECKLIST](https://github.com/thien-0408/office-hours/blob/main/docs/WEB-CHECKLIST.md) | [CLAUDE.md](https://github.com/thien-0408/office-hours/blob/main/CLAUDE.md), [DESIGN.md](https://github.com/thien-0408/office-hours/blob/main/docs/DESIGN.md) | [CLAUDE.md](https://github.com/thien-0408/office-hours/blob/main/CLAUDE.md) |
| Backend | [BACKEND-PLAN](https://github.com/chaunhattang/office-hours/blob/feature/realtime-hybrid/OfficeHours/BACKEND-PLAN.md) | [CHECKLIST](https://github.com/chaunhattang/office-hours/blob/feature/realtime-hybrid/OfficeHours/CHECKLIST.md) | [CONVENTIONS](https://github.com/chaunhattang/office-hours/blob/feature/realtime-hybrid/OfficeHours/CONVENTIONS.md) | [ARCHITECTURE](https://github.com/chaunhattang/office-hours/blob/feature/realtime-hybrid/OfficeHours/ARCHITECTURE.md) |
| Mobile | [MOBILE-PLAN](https://github.com/thien-0408/office-hours-mobile/blob/main/MOBILE-PLAN.md) | [CHECKLIST](https://github.com/thien-0408/office-hours-mobile/blob/main/CHECKLIST.md) | [CONVENTIONS](https://github.com/thien-0408/office-hours-mobile/blob/main/CONVENTIONS.md) | [MOBILE-PLAN mục 4](https://github.com/thien-0408/office-hours-mobile/blob/main/MOBILE-PLAN.md) |

Repo backend là private, nên chỉ người được cấp quyền mới mở được các link đó.

## Cách theo dõi tiến độ

- **Từng task:** tick trong checklist của repo đó, cùng commit với code.
- **Toàn dự án:** bảng dưới đây. Chỉ tick khi cả phase đã xong và đã push.

| Phase backend | Nội dung | Backend xong | Web đã nối | Mobile đã nối |
|---|---|---|---|---|
| Có sẵn | Đăng nhập, hồ sơ, quản lý user | [x] | [ ] | [ ] |
| B0 | Nền, Redis, schema, seed | [x] | Không cần | Không cần |
| B1 | Học kỳ, danh bạ giảng viên | [ ] | [ ] | [ ] |
| B2 | Availability, import và xem lịch | [ ] | [ ] | [ ] |
| B3 | Slot, đặt lịch, duyệt, lịch sử booking | [ ] | [ ] | [ ] |
| B4 | Hủy, đổi lịch, thông báo, chat, xác nhận đã gặp | [ ] | [ ] | [ ] |
| B5 | Waitlist, allocation | [ ] | [ ] | [ ] |
| B6 | GPS theo booking, phòng trên map | [ ] | Không cần | [ ] |
| B7 | Vận hành, deploy | [ ] | Không cần | Không cần |

## Mã task

| Tiền tố | Repo | Ví dụ |
|---|---|---|
| `BE-` | Backend | `BE-15` |
| `WE-` | Web | `WE-07` |
| `MO-` | Mobile | `MO-16` |

Mỗi checklist ghi rõ task đang chờ task nào ở repo khác. Task đã bỏ thì không dùng lại mã, ví dụ `BE-33`.
