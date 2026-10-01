# OfficeHours UI/UX route audit and implementation plan

**Date:** 30 September 2026  
**Status:** Planning only. No application changes are part of this audit.  
**Coverage:** Every page route under `app/` (23 routes), all seven local auth API routes, the dashboard shell, shared interactions, and the written API contract.

## How to read this plan

This is a **code-based review** with the previously supplied sidebar screenshot as the only visual evidence. It identifies what the UI currently renders and what its handlers do. It does not claim that every layout, screen reader flow, device size, or backend response was observed in a browser.

| Label | Meaning |
| --- | --- |
| **Live-ready** | Page calls a backend-facing route, but the backend may be unavailable. |
| **Sample fallback** | Page attempts a backend call and visibly labels sample data when it falls back. |
| **Local demo** | Page reads mock data and changes only component state; changes reset on remount. |
| **Synthetic** | Research calculation uses generated, seeded data; it is not campus operational data. |
| **P0 / P1 / P2** | P0 affects trust, permissions, or core task correctness; P1 affects task completion and accessibility; P2 is supporting polish or later scope. |

**Current strengths:** The application already distinguishes auth, landing, and app visual treatments in `docs/DESIGN.md`; booking and waitlist statuses have a central hue mapping; the new sidebar has role navigation and a mobile drawer; timetable import previews parsed rows; the public slot page labels its sample fallback; research tools disclose their synthetic population; analytics offers a table view for the Lorenz chart. Preserve these useful foundations.

### Start here: the five highest-value work items

1. Decide which routes are connected, demo-only, or deferred, then make every success message match that choice.
2. Enforce role and record access before connecting real student, lecturer, or admin data.
3. Connect the student path from lecturer search through booking detail with one source of truth.
4. Validate schedule times, recurrence, and expiring offers before accepting a save or confirmation.
5. Verify public claims and make `/`, `/welcome`, and public slot browsing tell one consistent pilot story.

## Main product decision

The UI must say whether an action is **saved**, **pending**, **simulated**, or **unavailable**. Most signed-in pages currently use `getMock...` data and local `useState`; the public slot page and auth routes are at a different integration stage. A design pass that keeps local-only success language would make the product look more finished while leaving its key promises untrue.

Before implementation, select one mode for each route:

1. **Connected pilot:** Wire to the documented backend contract and show server-confirmed results.
2. **Explicit demo:** Keep local interactions, label the screen/action as a demo, and avoid claims about saved changes or sent notifications.
3. **Deferred:** Hide an unfinished action or keep it as a clearly marked preview until its dependency exists.

Do not silently mix these modes within one booking flow.

## Route-by-route audit

The page paths below are public URLs. Their source lives under `app/`; the dashboard routes share `app/(dashboard)/layout.tsx` and `components/dashboard/DashboardShell.tsx`.

### Public and account routes

| Route | Current experience and evidence | Specific upgrade | Priority / phase |
| --- | --- | --- | --- |
| `/` | Neo-brutalist landing composed from hero, timetable preview, value grid, pricing, stats, testimonials, FAQ, and CTA (`app/page.tsx`). Claims include “480+ lecturers onboard,” named testimonials, free/no-limit pricing, and conflict guarantees (`components/landing/*`). | Audit every numeric, testimonial, pricing, and guarantee claim against pilot evidence. If unverified, label an example or remove it. Lead with a real campus task: finding a compatible office-hour slot and understanding request status. | P1 / 5 |
| `/welcome` | Separate 3D room tour, role matrix, and interactive conflict demo (`components/WelcomeExperience.tsx`, `FacultyOfficeDiorama.tsx`). Copy says “100% conflict-free,” “1-click guaranteed,” “verified for pilot semester,” and refers to cryptographic audit details. Reduced-motion handling exists in the 3D component. | Decide whether this is an optional tour linked from `/` or a second public funnel. Align its claims with the real pilot, give users a clear skip/continue path, and review no-WebGL, low-power, and keyboard use. | P1 / 5 |
| `/public/office-hours` | Server page calls `/public/office-hours` and falls back to labeled sample slots (`app/public/office-hours/page.tsx:57–72`). Text filter and pagination work through URL parameters. Slot cards are display-only. | Preserve the sample label. Add a clear route from a slot or lecturer to sign-in and the same lecturer/week after login; this needs a stable lecturer ID/slug in the public response. Distinguish an empty week from a failed live feed. Review the older blue/slate styling against the current public design direction. | P1 / 2, 5 |
| `/login` | Real auth route with seeded-account fallback. Demo-account chooser is development-only. Three visible Google/GitHub/Facebook buttons have no click handlers (`LoginForm.tsx`). | Remove or disable provider buttons until they work; explain demo credentials only in demo mode. Preserve a safe post-login destination and make errors actionable without exposing internals. | P0 / 1 |
| `/register` | Sends `/api/auth/register`; the route has no mock registration fallback. Form selects student/lecturer and asks for optional department (`RegisterForm.tsx`, `app/api/auth/register/route.ts`). | Explain eligible institution/email and lecturer verification rules; validate field-level errors and password requirements. If backend is unavailable, show a clear unavailable state instead of implying the campus pilot is open. | P1 / 1 |
| `/forgot-password` | The UI always displays the same sent-link message; the server route deliberately returns success even if the backend fails to avoid account enumeration (`app/api/auth/forgot-password/route.ts`). | Keep the privacy-preserving generic message, but make delivery failures observable to operators and avoid promising an email when delivery is not configured. Include a resend/cooldown path when email is real. | P1 / 1 |
| `/reset-password` | Handles missing token with a recovery link, checks password match, and calls `/api/auth/reset-password` (`ResetPasswordForm.tsx`). | Add clear expired/used-token recovery, field-level password rules, and confirmation that existing sessions are invalidated when the backend implements it. | P1 / 1 |

### Shared signed-in routes

| Route | Current experience and evidence | Specific upgrade | Priority / phase |
| --- | --- | --- | --- |
| `/dashboard` | Role-specific dashboards use mock bookings, suggested slots, counts, charts, and static to-do lists (`dashboard/page.tsx:108–323`; `TaskList.tsx`). Student “request sent” updates only this page's booking list; lecturer slots are hard-coded to “Dr. Amara Chen”; “Workspace up to date” is static. | Make each role's first panel answer one urgent question: next appointment, requests awaiting decision, or operational exception. Derive counts/tasks from the same persisted data as destination pages; remove the fixed lecturer identity and freshness claim until sourced. | P0 / 2–4 |
| `/dashboard/bookings` | Student, lecturer, and admin perspectives share a table; filters and bulk selection are local (`bookings/page.tsx`). A selected ID remains selected when filters change, while the bulk action applies to all selected IDs. Table scrolls horizontally on mobile (`BookingsTable.tsx`). | Keep selection scoped to visible rows or show hidden selection explicitly. Provide count and affected names before bulk action. Make filtered, loading, empty, and error states distinct; use one booking source across dashboard/list/detail. | P0 / 2, 3 |
| `/dashboard/bookings/[id]` | Booking detail has role actions, timeline, reschedule, attendance/notes, and confirmations (`bookings/[id]/page.tsx`). All mutations are local. Reschedule modal accepts free date/time, although the API contract expects a `newSlotId`. | Show actual permitted actions for current user/status/time; reschedule through bookable slots, server conflict checks, and atomic response. Make the timeline reflect persisted events; save meeting records only after a real response. | P0 / 2, 3 |
| `/dashboard/bookings/recurring` | Four-occurrence preview and local series list are labeled “Preview only,” yet the primary button says “Create series” and success says “Series created” (`RecurringBookingClient.tsx:95–218`). `mm + 30` can produce an invalid end time. | First fix time arithmetic and show all skipped/conflicting weeks. Keep a “Preview series” action until the recurrence endpoint exists; only then enable “Create” and durable cancel. Clarify whether recurrence is in pilot scope because the API labels it stretch. | P0 / 2 |
| `/dashboard/schedule` | Student/lecturer grid and agenda, manual blocks, AAO PDF import preview, history, print, day/shift filters (`schedule/page.tsx`; `TimetableImport.tsx`). Data and imports are local. Manual block creation checks title only; subtitle describes its visual design; active markup uses undefined `--paper-300`/`--info-600` tokens. | Validate time order and overlaps, preview import conflicts and job status, then persist entries. Use task-focused copy (“See classes and find free time”) and existing tokens. Preserve agenda as an alternative to the dense grid. | P0 / 2, 3 |
| `/dashboard/notifications` | Mock list, local mark-read actions, booking/waitlist navigation, and static “Live updates soon” (`notifications/page.tsx`). Empty copy is “Nothing here.” | Define event types with backend, persist read state, show useful empty/filter-empty states, and add live/polling freshness only when connected. Ensure deep links land on accessible bookings/offers. | P1 / 2–4 |
| `/dashboard/profile` | Name/department, avatar, notification preferences, and password controls (`profile/page.tsx`). Avatar is local preference; identity, preferences, and password report success without API calls. | Separate stored avatar preference from account profile. Save identity/prefs through `/users/me`; change password through the documented endpoint; show actual server result, validation, and retry. This is a trust-critical screen. | P0 / 1 |

### Student routes

| Route | Current experience and evidence | Specific upgrade | Priority / phase |
| --- | --- | --- | --- |
| `/dashboard/lecturers` | Search, department, weekday, and availability filters over mock lecturers (`LecturersBrowser.tsx`). Only initial `?q=` is read from URL; no-results state has no reset action. Filter groups can become long on small screens. | Keep filters in URL, show active constraints, provide “Clear filters,” and use a compact mobile filter surface. Make lecturer cards answer “when can I see them?” rather than only profile metadata. | P1 / 2 |
| `/dashboard/lecturers/[id]/slots` | Weekly slot grid and booking dialog (`lecturers/[id]/slots/page.tsx`). Request marks a slot unavailable locally and shows “Request sent”; the linked bookings list has separately seeded mock data. Week navigation has no upper bound. | Display a date range and conflict result for each slot, handle 409 taken-slot and 422 conflict outcomes, and create a booking that appears in My Bookings after navigation. Constrain navigation to available semester weeks. | P0 / 2 |
| `/dashboard/waitlist` | Position and offered-slot cards with accept/decline (`waitlist/page.tsx`). Expiry label is computed on render and does not tick; offer actions remain clickable after time passes. State changes are local. | Show full expiry timestamp and a live countdown, disable expired offers, revalidate on accept, and show the resulting booking. Include the missing join/leave path from full slot to waitlist. | P0 / 2 |

### Lecturer routes

| Route | Current experience and evidence | Specific upgrade | Priority / phase |
| --- | --- | --- | --- |
| `/dashboard/availability` | Tabs for weekly rules, exceptions, and slot waitlists (`availability/page.tsx`). Add/edit/delete actions are local; rule/exception forms accept times and dates without explicit order/conflict validation; waitlist groups are separate mock data. | Show generated slots before saving a rule, validate time/date order and overlaps, explain impact on future booked slots, and tie waitlist groups to actual slots. Keep delete confirmation with an accurate effect summary. | P0 / 3 |

### Admin routes

| Route | Current experience and evidence | Specific upgrade | Priority / phase |
| --- | --- | --- | --- |
| `/dashboard/admin/users` | Users table with role/search/sort/edit/deactivate and a semesters tab (`admin/users/page.tsx`). Local changes reset; semester creation checks only nonempty dates, not order. | Add role/permission boundary, visible department/semester context, date-order validation, guarded activate/delete behavior, and server-confirmed save/deactivate. Prevent accidental role escalation and clarify affected data. | P0 / 1, 4 |
| `/dashboard/admin/schedule` | Import, manual-entry, and slot-search tabs (`admin/schedule/page.tsx`). Admin picks student or lecturer; entry creation checks only title/owner; search cuts results at 100 and uses mock office hours. | Distinguish support import from self-service import; show owner, semester, file, staged conflicts, and final commit. Validate manual times/overlaps. Replace arbitrary first-100 cut with query pagination or clear export path. | P0 / 3, 4 |
| `/dashboard/admin/allocation` | Policy registration/activation, event log, manual override (`admin/allocation/page.tsx`). Local changes do not update analytics, and policy weights are converted with `Number(...) || 0` without a stated normalization rule or inline error. Override takes free-text slot/student names rather than IDs. | Explain current active policy and scope; define and validate weight rules; preview who is affected; choose real slot/student IDs; require a reason and show a durable audit event. Keep analytics and allocation reading the same policy state. | P0 / 4 |
| `/dashboard/admin/analytics` | Equity, Lorenz curve with table alternative, advisor load, no-show rate, and policy comparison (`admin/analytics/page.tsx`). Values are mock and the active-policy highlight is independently reseeded. | Label source, cohort, time window, last refresh, and denominator for each metric. Use connected policy state; keep table alternative and add plain-language interpretation/limits of Gini and wait time. | P1 / 4 |
| `/dashboard/admin/research` | Bounded seeded demand generator and real local allocation engine with result tables/plots (`admin/research/page.tsx`). The page already explains its synthetic nature, but runs/results live only in component state. | Preserve “synthetic” labeling on exports/screenshots; expose seed, assumptions, cohort, and policy version alongside every result. Decide whether saving/exporting experiments belongs to the pilot; keep research clearly separate from operational analytics. | P2 / 4 |

**Shared route gate:** `proxy.ts` checks cookie presence, and `app/(dashboard)/layout.tsx` checks whether a user exists; neither establishes a shared role gate for student, lecturer, and admin URLs. Navigation visibility is useful orientation, but route access and backend authorization must use the signed-in role and record ownership. Current pages mostly contain mock data; this is a readiness and UX problem before live data is connected.

### Auth API route inventory

These seven routes are implementation boundaries for the account pages above. They are listed here so the plan covers every `app/**/route.ts` route as well as every page.

| Route | Current behavior | UX planning implication |
| --- | --- | --- |
| `POST /api/auth/login` | Calls backend; falls back to seeded accounts on a network/non-API failure. | Make demo mode explicit. Do not let a real backend outage look like a normal invalid-password response. |
| `POST /api/auth/register` | Calls backend; returns a generic 502 when unavailable. | Registration page needs a deliberate service-unavailable state and retained form values. |
| `POST /api/auth/forgot-password` | Calls backend but always returns `{ ok: true }`, including failures. | Preserve account privacy while monitoring delivery failures and avoiding an unsupported email guarantee. |
| `POST /api/auth/reset-password` | Calls backend and forwards API errors. | Map expired/used/invalid tokens to a recovery action; keep the form values on retryable errors. |
| `GET /api/auth/me` | Decodes a demo token or fetches `/users/me`; a non-401 backend failure returns `user: null`. | Distinguish a service outage from a signed-out session in the client. `AuthProvider` also needs a settled loading/error state if this fetch rejects. |
| `POST /api/auth/refresh` | Refreshes backend tokens; clears cookies on failure. | Explain session expiry and preserve intended destination after re-login. |
| `POST /api/auth/logout` | Best-effort backend logout, then clears local cookies. | Confirm local sign-out immediately; treat backend revocation failure as an operational signal. |

## Cross-route issues to resolve once

| ID | Evidence | Decision and expected behavior |
| --- | --- | --- |
| X01 — Source of truth | `dashboard/page.tsx`, bookings/list/detail, lecturer slots, waitlist, availability, admin pages all seed separate mock stores. | A mutation must update one server-owned resource. Related views revalidate and show the same status after navigation/refresh. Demo mode visibly labels local state. |
| X02 — Honest feedback | `BookSlotModal.tsx` says “Request sent”; booking detail promises notification; profile says “Saved”; recurring says “Series created.” | Use pending → success/error states tied to the response. A 409/422 gets recovery actions, and failed saves retain input. No toast should assert email/notification delivery unless the backend confirms the relevant event. |
| X03 — Permission and ownership | `proxy.ts`, dashboard layout, and admin pages. | Define permitted role/ownership per route and action, show a readable no-access state, and rely on backend enforcement for data and mutations. |
| X04 — Calendar correctness | Schedule/manual forms, availability forms, recurring `mm + 30`, waitlist clock. | Reuse date/time validation rules, semester bounds, timezone display, overlap handling, and expiry behavior. Show exact local date plus timezone when deadlines matter. |
| X05 — Shared controls | `FilterTabs.tsx` has no announced selection state; `BookSlotModal.tsx`, `RescheduleModal.tsx`, and `ConfirmModal.tsx` lack a shared focus contract. The sidebar drawer already handles focus trapping/return. | Give filters announced state, dialogs initial focus/trap/return and title association, and consistent visible focus. Confirm behavior with keyboard and screen reader review. |
| X06 — Search and responsive data | Header search always routes to lecturer discovery; long filter pills and wide tables appear across roles. | Make search role-aware; preserve filters in URL; use a deliberate phone layout or clearly labeled horizontal scrolling for dense data. Do not hide decision-critical fields on mobile. |
| X07 — Data provenance | Public page labels sample fallback; research page labels synthetic runs; signed-in dashboards and analytics do not label mock data. | Use a consistent “Sample / Imported / Live / Synthetic” source label with update time where it affects decisions. Avoid a generic green “up to date” claim. |
| X08 — Product voice | Schedule subtitle describes design; `/welcome` and landing use broad guarantees and social proof. | Use campus-specific evidence and tasks. Replace unverified proof with a real timetable, decision timeline, and policy explanation. Keep claims consistent across `/`, `/welcome`, and FAQ. |
| X09 — API contract gaps | `docs/capstone-api-endpoints.md` documents `reschedule` with `newSlotId`, async import jobs, notification event types, and role-scoped actions; current UI models some differently. | Settle field names, error bodies, job stages, event catalogue, and stretch-feature scope before building screens around them. |
| X10 — Auth failure states | `app/api/auth/me/route.ts` returns `user: null` on backend outages; `lib/auth/auth-context.tsx` sets initial loading false only after a successful `refreshUser()` call. | Separate unauthenticated, expired, and temporarily unavailable states. An auth request that rejects must end the loading state and offer retry. |

## Implementation phases and completion gates

### Phase 0 — Lock product mode and contracts

**Scope:** Decide connected pilot vs explicit demo for each route; choose which stretch features ship (group bookings, recurring bookings, waitlist, research exports); reconcile frontend types with `docs/capstone-api-endpoints.md`; confirm institution enrollment and lecturer verification rules. Agree on status vocabulary and what “request,” “held,” “confirmed,” and “offered” mean.

**Deliverable:** A route/API/state matrix with owner, endpoint, success/error responses, and demo label for every action. An evidence list for public claims. No screen redesign starts from ambiguous data semantics.

### Phase 1 — Identity, permissions, and truthful account actions

**Routes:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/dashboard/profile`, all protected routes.  
**Dependencies:** `/auth/*`, `/users/me`, change-password, role/ownership checks.

**Completion gate:** Social sign-in only appears if implemented; registration/recovery states explain what actually happened; profile changes persist; password change is server-confirmed; wrong-role URLs show no-access; an auth outage does not masquerade as signed-out or leave an endless skeleton; sign-in returns safely to the intended route.

### Phase 2 — Student booking spine

**Routes:** `/public/office-hours`, student `/dashboard`, `/dashboard/lecturers`, lecturer slots, bookings/list/detail, waitlist, notifications, recurring if in scope.  
**Dependencies:** lecturer directory, slots, conflict check, booking creation/state transitions, waitlist endpoints, notification list.

**Completion gate:** A student can discover a compatible slot, submit a request, see it in both dashboard and bookings after refresh, handle a taken/conflicting slot, and follow confirmation/cancellation. An offer visibly expires and server validation prevents late acceptance. Recurring remains a preview unless it meets the same persistence bar.

### Phase 3 — Lecturer scheduling and request handling

**Routes:** lecturer `/dashboard`, `/dashboard/availability`, `/dashboard/schedule`, lecturer bookings/detail; shared import component.  
**Dependencies:** availability rules/exceptions, schedule entries/import jobs, booking confirm/decline/attendance.

**Completion gate:** Rule preview shows generated slots and conflicts; imports show parse → review → commit → result, including duplicates/errors; booking bulk actions affect only listed records; every action persists and explains impact on existing bookings.

### Phase 4 — Admin operations and evidence

**Routes:** admin dashboard, users/semesters, schedule, allocation, analytics, research.  
**Dependencies:** admin RBAC, users/semesters, import staging, policy activation/override/audit, analytics contracts. Research persistence/export is optional pilot scope.

**Completion gate:** An admin can identify the active semester/policy, review an import before commit, explain an override from its audit row, and tell live operations from simulation. Metrics display source, cohort, interval, denominator, and last update.

### Phase 5 — Public story and visual QA

**Routes:** `/`, `/welcome`, `/public/office-hours`, plus shared shell and all earlier routes.  
**Dependencies:** verified claims and representative real/sample data.

**Completion gate:** One clear public entry journey exists; every public assertion has evidence or an illustrative label; copy describes user outcomes; the existing design tokens and status hues remain consistent. Review each role at 320, 375, 768, and desktop widths, with keyboard, reduced motion, loading/empty/error, expired offer, and no-access states.

## Anti-template design rules for implementation

1. Make the **semester timetable and office-hour decision** the recognizable visual motif. Show actual course blocks, free windows, request history, and allocation reasons rather than decorative metric cards.
2. Give each role a different first question: “When can I meet?” for students, “What needs my decision?” for lecturers, “What requires intervention?” for admins.
3. Use specific academic language and real state labels. Avoid generic SaaS claims, unexplained “productivity” copy, fake testimonials, and design-process copy inside the product.
4. Keep the visual split in `docs/DESIGN.md`: expressive landing, full-glass auth, restrained app. Reuse `app/globals.css` tokens and `lib/ui/status-hues.ts`; do not add ad hoc status colors.
5. Treat loading, empty, unavailable, permission, conflict, and expiry as first-class designs. A clean card layout is incomplete if these states are unclear.
6. Do not equate more charts with a better dashboard. Any chart must answer a decision question, state its data source, and offer a readable alternative when needed.

## Review scenarios before work is called complete

| Scenario | Evidence to collect later |
| --- | --- |
| Student | Search from a shared URL; select a slot; encounter both success and 409/422; refresh My Bookings; accept an offer before and after expiry; reschedule through an actual open slot. |
| Lecturer | Create a rule with a conflict; review pending bookings; change filters with rows selected; confirm/decline; record attendance; refresh dashboard and detail. |
| Admin | Open a forbidden URL as another role; activate semester/policy; stage and commit import; override a slot with reason; compare audit record with analytics source label. |
| Public/auth | Browse a sample and a live slot feed; move from slot to sign-in and back; try invalid recovery token; inspect no-WebGL/reduced-motion `/welcome`; verify every public claim. |
| Shared accessibility | Tab through every modal, filter, table, and calendar; check announced labels/state; close with Escape; verify focus return and mobile reading order. |

## Open decisions for the product owner

- Is the next milestone a connected pilot or a clearly labeled interactive prototype? This changes the right treatment of every local-only action.
- Which university and enrollment rules apply to student and lecturer sign-up? The current form allows both roles to self-select.
- Is a booking an instant reservation or a request awaiting lecturer confirmation? Current public copy and in-app status language differ.
- Are recurring bookings, group bookings, waitlist, and research export in the pilot scope? The API specification labels several as stretch features.
- Should `/welcome` remain an optional tour, and what verified pilot evidence can replace its guarantees and the landing testimonials/statistics?

**Related documents:** [Short roadmap](UI-UX-UPGRADE-ROADMAP.md) · [Design system](DESIGN.md) · [API specification](capstone-api-endpoints.md).
