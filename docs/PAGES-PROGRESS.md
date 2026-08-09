# Pages Progress Tracker

Source of truth for page scope: `Pages.txt` (31 pages across Public / Auth / Shared / Student / Lecturer / Admin).
This file tracks build status. `[X]` = implemented (route exists and renders real/mock data), `[ ]` = not started, `[~]` = partial (route exists but stub/placeholder only).

Legend note: the role-aware `/dashboard` home (StudentDashboard / LecturerDashboard / AdminDashboard) is
extra scope beyond the 31-page list — it's the shell/overview screen these pages link out from.

## Public (no auth)

- [X] 1. Landing / Home — `app/page.tsx`
- [X] 2. Public Office Hours listing — `app/public/office-hours/page.tsx`

## Auth (shared)

- [X] 3. Register — `app/(auth)/register/`
- [X] 4. Login — `app/(auth)/login/`
- [X] 5. Forgot/reset password flow — `app/(auth)/forgot-password/`, `app/(auth)/reset-password/`

## Shared (all authenticated roles)

- [X] 6. My Profile — `app/(dashboard)/dashboard/profile/page.tsx`
- [X] 7. Notifications center — `app/(dashboard)/dashboard/notifications/page.tsx` (list, mark read, unread filter; SSE stubbed with a visible "soon" affordance, not faked)
- [X] 8. My Bookings — `app/(dashboard)/dashboard/bookings/page.tsx` (role-dependent perspective + status filter, reuses `BookingsTable`)
- [X] 9. Booking Detail — `app/(dashboard)/dashboard/bookings/[id]/page.tsx` (timeline + role-dependent actions)

## Student

- [X] 10. Find a Lecturer / Browse Lecturers — `app/(dashboard)/dashboard/lecturers/page.tsx` (search + department filter)
- [X] 11. Lecturer Slot Picker — `app/(dashboard)/dashboard/lecturers/[id]/slots/page.tsx` (weekly grid, conflict-marked against the student's own bookings)
- [X] 12. Book a Slot — `components/dashboard/BookSlotModal.tsx`, opened from the slot picker
- [X] 13. Group Booking management — `components/dashboard/ParticipantManager.tsx`, used from `BookSlotModal` and Booking Detail; UI-complete, explicitly not wired to a real participants model (schema unknown from this repo)
- [X] 14. Recurring Booking setup — `app/(dashboard)/dashboard/bookings/recurring/page.tsx`; UI-complete (setup form + series list + cancel), preview-only, not wired to a real recurrence engine
- [X] 15. My Waitlist — `app/(dashboard)/dashboard/waitlist/page.tsx` (position/status, accept/decline offers)

## Lecturer

- [X] 16. Availability Rules manager — `app/(dashboard)/dashboard/availability/page.tsx` ("Rules" tab: day/time-range/slot-length/effective-dates CRUD)
- [X] 17. Availability Exceptions manager — same route, "Exceptions" tab (one-off BLOCK/ADD entries)
- [X] 18. My Schedule (busy blocks) — `app/(dashboard)/dashboard/schedule/page.tsx` (read-mostly day-column view of imported/manual teaching blocks)
- [X] 19. Bookings to Review — covered by `/dashboard/bookings` (lecturer perspective defaults its status filter to Pending); intentionally not a separate route, per the Phase 8 plan
- [X] 20. Slot Waitlist view — same `/dashboard/availability` route, "Waitlist" tab (read-only queue transparency per slot, no allocation actions — that's Admin's Manual Override, #29)
- [X] 21. Meeting Record entry — covered by `app/(dashboard)/dashboard/bookings/[id]/page.tsx`'s "Meeting record" card (attended + notes, shown to the lecturer once a booking is COMPLETED); intentionally not a separate route, built as part of Phase 8's Booking Detail

## Admin

- [X] 22. User management — `app/(dashboard)/dashboard/admin/users/page.tsx` ("Users" tab: search/filter, inline role+department edit, deactivate)
- [X] 23. Semester management — same route, "Semesters" tab (add, activate, delete)
- [X] 24. Schedule Import — `app/(dashboard)/dashboard/admin/schedule/page.tsx` ("Import" tab: PDF upload, ported from the user's `TimeTableScanner.txt` reference tool via `lib/timetable/parse-pdf.ts`, plus a mocked import-history table)
- [X] 25. Manual Schedule Entry editor — same route, "Manual Entry" tab (single-entry add/delete)
- [X] 26. Slot search/ops view — same route, "Slot Search" tab (cross-lecturer, reuses `getMockOfficeHours`)
- [X] 27. Allocation Policies manager — `app/(dashboard)/dashboard/admin/allocation/page.tsx` ("Policies" tab: register/activate/delete, per-policy-type weight config)
- [X] 28. Allocation Events audit log — same route, "Events" tab (filterable by policy/decision, score/seed or override detail per row)
- [X] 29. Manual Override action — same route, "New override" form on the Events tab (slot + student + reason → appends an `OVERRIDDEN` event)
- [X] 30. Analytics dashboard — `app/(dashboard)/dashboard/admin/analytics/page.tsx` (advisor load, no-show rate by lecturer, equity Gini + Lorenz curve, policy-comparison small multiples)
- [X] 31. Research tools — `app/(dashboard)/dashboard/admin/research/page.tsx` (Demand / Experiments tabs: synthetic demand-run generator, seeded deterministic experiment runner, fairness-vs-efficiency frontier scatter, JSON/CSV export; no sidebar nav entry by design — linked from Analytics' Policy Comparison instead, see `DASHBOARD-UPGRADE.md` Phase 13)

## Summary

- Done: 31 / 31 — every page in the Pages.txt list is shipped, including #31 Research tools
  (Phase 13), previously skipped as "stretch, may be dev-only."
- Extra (not in the 31-page list but built): role-aware `/dashboard` home shell

## Next up

Nothing planned — the full 31-page list is complete. Future work is polish/hardening (real
backend wiring, the several "preview only" / "not wired" UI-complete features called out
throughout this doc and `DASHBOARD-UPGRADE.md`) rather than new pages.
