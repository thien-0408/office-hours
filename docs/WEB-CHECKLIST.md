# Checklist web

Nối từng trang từ dữ liệu mock (`lib/office-hours/mock-data.ts`) sang API thật. Xem thêm [PROJECT-HUB.md](PROJECT-HUB.md) và [CONVENTIONS.md](CONVENTIONS.md).

Một task xong khi trang không còn dùng mock cho phần đó và đã thử với backend thật. Chạy `bun run lint` trước khi push.

## Đã có backend

- [ ] WE-01 Kiểm tra đăng nhập, đăng ký, quên mật khẩu với backend thật (đã có)
- [ ] WE-02 Trang hồ sơ, đổi mật khẩu, tùy chọn thông báo (đã có)
- [ ] WE-03 Admin: quản lý user (đã có)

## B1: Học kỳ, giảng viên

- [ ] WE-04 Danh sách giảng viên (chờ BE-06)
- [ ] WE-05 Admin: quản lý học kỳ (chờ BE-05)

## B2: Availability, lịch

- [ ] WE-06 Trang availability: rule và exception (chờ BE-10, BE-11)
- [ ] WE-07 Import và xem lịch cá nhân (chờ BE-12, BE-13)
- [ ] WE-08 Admin: lịch của người dùng (chờ BE-12, BE-13)

## B3: Booking

- [ ] WE-09 Chọn slot của giảng viên (chờ BE-14)
- [ ] WE-10 Đặt lịch, xử lý lỗi `409` và `422` (chờ BE-15)
- [ ] WE-11 Danh sách booking, duyệt và từ chối (chờ BE-16, BE-17)
- [ ] WE-12 Chi tiết booking và lịch sử (chờ BE-17, BE-45)

## B4: Vòng đời, thông báo, chat

- [ ] WE-13 Hủy và đổi lịch (chờ BE-19)
- [ ] WE-14 Thông báo và SSE (chờ BE-21, BE-22)
- [ ] WE-15 Dashboard và biên bản họp (chờ BE-20)
- [ ] WE-16 Trang công khai, slot gợi ý (chờ BE-25)
- [ ] WE-17 Chat theo booking: phòng chat, đang gõ, đã xem, tự nối lại (chờ BE-46, BE-47, BE-48)
- [ ] WE-18 Nút xác nhận đã gặp hoặc vắng mặt trong chat (chờ BE-49)

## B5: Waitlist, allocation

- [ ] WE-19 Trang waitlist và offer (chờ BE-27, BE-28)
- [ ] WE-20 Admin: policy, override, nhật ký allocation (chờ BE-29)

## Stretch

- [ ] WE-21 Booking nhóm (chờ BE-37)
- [ ] WE-22 Booking lặp lại (chờ BE-38)
- [ ] WE-23 Admin: analytics (chờ BE-39)
- [ ] WE-24 Admin: công cụ nghiên cứu (chờ BE-40, BE-41)
