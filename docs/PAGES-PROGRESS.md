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

- [ ] 16. Availability Rules manager — nav links to `/dashboard/availability` (404)
- [ ] 17. Availability Exceptions manager — not started
- [ ] 18. My Schedule (busy blocks) — nav links to `/dashboard/schedule` (404)
- [X] 19. Bookings to Review — covered by `/dashboard/bookings` (lecturer perspective defaults its status filter to Pending); intentionally not a separate route, per the Phase 8 plan
- [ ] 20. Slot Waitlist view — not started
- [ ] 21. Meeting Record entry — not started

## Admin

- [ ] 22. User management — nav links to `/dashboard/admin/users` (404)
- [ ] 23. Semester management — not started
- [ ] 24. Schedule Import — not started
- [ ] 25. Manual Schedule Entry editor — not started
- [ ] 26. Slot search/ops view — not started
- [ ] 27. Allocation Policies manager — nav links to `/dashboard/admin/allocation` (404)
- [ ] 28. Allocation Events audit log — not started
- [ ] 29. Manual Override action — not started
- [ ] 30. Analytics dashboard — nav links to `/dashboard/admin/analytics` (404)
- [ ] 31. Research tools (stretch, may be dev-only) — out of scope for now, skip per Pages.txt note

## Summary

- Done: 16 / 31 (Public + Auth + all 4 Shared pages + the full Student booking flow #10–15,
  including "Bookings to Review" covered by the shared My Bookings route)
- Extra (not in the 31-page list but built): role-aware `/dashboard` home shell

## Next up

Lecturer-facing pages (#16–21: Availability Rules, Availability Exceptions, My Schedule, Slot
Waitlist view, Meeting Record entry — #19 Bookings to Review already covered) are the next
highest-leverage block — the dashboard's lecturer nav still links "Availability" and "My Schedule"
to 404s. See `docs/DASHBOARD-UPGRADE.md` Phase 9 for what just shipped.
