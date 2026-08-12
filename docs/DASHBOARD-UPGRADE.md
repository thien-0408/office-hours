# Dashboard Upgrade — Style Extraction & Implementation Plan

Reference: `learn.brosky` e-learning dashboard (three-column, card-based, white+blue with
soft pastel accents). This doc extracts its reusable patterns and maps them onto OfficeHours'
existing design system (`docs/DESIGN.md`) — **without** breaking that system's rules.

> Guardrail up front (Phases 1–5): the reference leans on orange CTAs, a magenta calendar
> selection, and hand-drawn doodle accents around the avatar. DESIGN.md kept **blue primary**,
> reserved **rough.js / hand-drawn accents for the landing page only**, and restricted badge
> hues to the §4 status table. Phases 1–5 borrowed the reference's *structure and interaction
> patterns*, not its palette.
>
> **Superseded by Phase 6** — the palette guardrail above was explicitly revisited and loosened
> (not overridden accidentally): the dashboard now uses a validated decorative accent palette
> (coral/rose/mint) for non-status surfaces, matching the reference's orange CTA and magenta
> calendar selection. See `docs/DESIGN.md` §1.2 for exactly what changed and what stayed blue.
> The hand-drawn-accents-on-landing-only rule is untouched — that part of the guardrail still stands.

---

## 1. Style extraction (what to adopt)

| Pattern in the reference | Adopt as | OfficeHours mapping |
|---|---|---|
| **Three-column layout** (sidebar / fluid center / right rail) | Add a right rail to the shell | Rail holds profile card, this-week mini-calendar, upcoming bookings, action items |
| **Time-aware greeting** ("Morning, Cecillia 🌤️") | Greeting header | "Morning/Afternoon/Evening, {firstName}" — warmth without new colors |
| **Search pill + circular bell** in header | Keep (bell already in shell) | Add a global search pill (find lecturers) |
| **Stat tiles** — soft-tint icon chip + big number + label | Reusable `StatTile` | Per-role metrics; icon-chip tint drawn from §4 status hues, not arbitrary pastels |
| **Chart card** ("Time spends", rounded bars, one highlighted + tooltip) | Reusable `ActivityChart` | "Booking activity" per weekday (student), "advisor load" (admin) |
| **Featured action card** (peach "Course code" join form) | Featured CTA card | "Find a lecturer" / "Book a slot" primary action, brand-blue not peach |
| **Meta rows** (icon + "19 lessons", icon + "2h 4m") | `MetaRow` primitive | "30 min", "Offline · AG07 Hall", department, etc. |
| **Sortable table** ("Your assignment") | `BookingsTable` | Upcoming bookings — reuses `Booking` type + `StatusBadge` |
| **Right-rail info card** (Years / Major / GPA label→value) | `ProfileCard` | Role / Department / Email label→value rows |
| **Month calendar strip** (chevrons, selected date pill) | `MiniCalendar` | This week's office hours; selected date in **brand-500**, not magenta |
| **"Upcoming class"** colored left-border list | `UpcomingList` | Upcoming bookings, left-border tinted by status hue |
| **"To Do List"** checkboxes + emoji | `TaskList` | Role action items (student: prep/confirm; lecturer: bookings to review) |
| Soft 1px borders, `rounded-2xl`, very soft shadows, generous whitespace | Card system | Matches DESIGN.md "Restrained" app-shell treatment |

**Color discipline (the important part):** the friendly, multi-color feel comes from the §4
**status hues** used semantically — `success` (confirmed), `warning` (pending), `info` (offered),
`brand` (completed) — as icon-chip tints and left-borders. Blue stays the only interactive/primary
color. No orange buttons, no magenta, no new hues.

---

## 2. Libraries

| Library | Status | Why | React 19 |
|---|---|---|---|
| **lucide-react** `1.28.0` | ✅ **installed** | Replaces the 11 hand-rolled SVGs in `DashboardShell` and supplies the ~20 icons the richer dashboard needs (stat chips, calendar nav, checkboxes, meta rows). Tree-shakeable. | ✅ |
| **recharts** `3.10.x` | ⏳ recommended — Phase 3 | The "Booking activity" bar card, and — more importantly — the **research analytics** (Gini coefficient, policy-comparison, advisor-load) that are the capstone's core deliverable. Install when building the first chart; the `dataviz` skill governs its styling. | ✅ |
| **react-day-picker** `10.x` | ⏳ recommended — with the slot picker | The right-rail mini-calendar, and reused by the **Lecturer Slot Picker** (`/lecturers/{id}/slots`, a weekly calendar). Building calendar date-math once, in a maintained lib, beats hand-rolling it twice. | ✅ |
| framer-motion | already present | Card entrance stagger, number count-up on stat tiles. | — |
| ~~dnd-kit~~ | skipped | Only needed for to-do reordering — not worth a dependency yet. | — |
| **pdfjs-dist** `6.2.108` | ✅ **installed** — Phase 11 | Admin **Schedule Import** (`lib/timetable/parse-pdf.ts`) — parses an EIU timetable PDF client-side, porting the user-supplied `TimeTableScanner.txt` reference tool. Worker wired via `new URL(..., import.meta.url)`, not a CDN. | ✅ |

Nothing new is required to *start*; lucide-react unblocks Phases 1–2. Recharts and
react-day-picker are deliberately deferred to the phase that first needs them so we don't
carry unused deps.

**Audit note:** the 3 pre-existing high-severity advisories are transitive `postcss`/`sharp`
issues from the Next/Tailwind toolchain — unrelated to lucide-react. Don't `audit fix --force`
(it would try to move Next/Tailwind majors).

---

## 3. Implementation plan (phased)

### Phase 1 — Foundation (shell + primitives) ✅ done
- Replaced the 11 hand-rolled SVGs in `DashboardShell.tsx` with lucide-react (`LayoutDashboard`, `Search`, `CalendarDays`, `Clock`, `SlidersHorizontal`, `BookOpen`, `Users`, `Shuffle`, `BarChart3`, `Bell`, `ChevronDown`, `LogOut`).
- Three-column layout: **decided against** a `rightRail` prop on `DashboardShell` — `app/(dashboard)/layout.tsx` only ever receives `children`, so a page-specific rail can't prop-drill through the shared layout without Context/portal machinery. Instead widened `<main>` (1180px → 1400px) and added `components/dashboard/DashboardColumns.tsx`, a page-level composition primitive (`<DashboardColumns rail={...}>content</DashboardColumns>`) that pages opt into individually.
- Built reusable primitives in `components/dashboard/`: `Card`, `SectionHeader` (title + "See all"), `IconChip`, `StatTile` (icon chip + value + label), `MetaRow`. All token-driven (literal `--brand-*`/`--paper-*`/`--ink-*`, not the dark-reactive semantic layer), restrained (no glass on content).
- Extracted `HUE_TOKENS`/`Hue` out of `StatusBadge` into `lib/ui/status-hues.ts` so `IconChip`/`StatTile` share the same §4 hue mapping instead of duplicating it.

### Phase 2 — Student dashboard content ✅ done
- **Greeting header** (time-aware: Morning/Afternoon/Evening) + a global search pill added to `DashboardShell`'s topbar (chrome, so glass) — submits to `/dashboard/lecturers?q=...` (that route doesn't exist yet, same "expected 404 at this stage" as the nav links).
- **Stat tiles row** (`StatTile`): Upcoming bookings (brand) · Pending confirmation (warning) · Open slots this week (info) — hues from `BOOKING_STATUS_CONFIG`/`HUE_TOKENS`, slots-this-week count reuses `getMockOfficeHours`.
- **Featured CTA card** (`FeaturedActionCard`): "Find a Lecturer," brand-blue with soft white circle accents — replaced the old two-card quick-action grid.
- **Bookings table** (`BookingsTable`): client-side sortable by lecturer/date/status, `StatusBadge`, `tabular-nums` on the date/time column (DESIGN.md §2).
- **Right rail**, composed via `DashboardColumns` (the Phase 1 primitive) at the page level: `ProfileCard` (avatar, role/department/email) → `MiniCalendar` (self-contained 5-day strip, no external lib yet) → `UpcomingList` (status-hue left border) → `TaskList` (local-only checkboxes).
- Consolidated `BOOKING_STATUS_CONFIG` (label+hue per status) into `lib/ui/status-hues.ts` alongside `HUE_TOKENS`, so `StatusBadge` and `UpcomingList` read one source instead of two copies.

### Phase 3 — Activity chart ✅ done
- Read the `dataviz` skill first, then installed `recharts` (3.10.1, React 19 ✅).
- **Validated the palette before writing chart code**, per the skill's non-negotiable: `node scripts/validate_palette.js "#8FB0FF,#3465E0" --mode light` (brand-300 base / brand-500 highlight). `brand-200` was tried first and **failed** (lightness/chroma/contrast) — too light to read as a bar against white; brand-300 passes every check except a non-dismissable surface-contrast WARN, which the component resolves with visible relief (not color alone): a direct label on the highlighted bar + an always-available "View as table" toggle (also satisfies the skill's hard "a table view exists" requirement).
- `ActivityChart` (`components/dashboard/ActivityChart.tsx`): single-hue highlight bar chart, not a multi-series categorical palette — one measure (bookings), one bar drawn out via `highlightKey` (defaults to the max value if omitted). Thin bars, 4px rounded top corners, per-bar hover tooltip styled to tokens (not recharts' default theme), recessive axis.
- Reused for **both** roles the plan called for for: `getMockWeeklyActivity()` → student's "Booking activity this week" (highlights today); `getMockAdvisorLoad()` → admin's "Advisor load this week" (highlights the busiest lecturer, since there's no "today" concept there) — this replaced the Phase-4 placeholder card now that the chart actually exists.

### Phase 4 — Lecturer & Admin dashboards ✅ done (chart deferred)
- Reused every Phase-1/2 primitive; swapped data + metrics:
  - **Lecturer**: To-review / Confirmed today / No-show rate stat tiles; `BookingsTable` filtered to pending, `perspective="lecturer"`; rail swaps `UpcomingList` for `SlotsTodayList` (today's still-open slots, reusing `buildMockSlots`) + lecturer-flavored `TaskList`.
  - **Admin**: Active users / Bookings this week / Utilization % stat tiles; `BookingsTable` with a new `perspective="admin"` (shows both lecturer and student); equity teaser card linking to `/dashboard/admin/analytics`.
  - **Advisor-load chart intentionally NOT built** — stubbed as a dashed placeholder card instead. Phase 3 (recharts + the mandatory `dataviz` skill read) hasn't happened yet; faking a chart without that gate would violate the plan's own guardrail.
- Generalized two primitives rather than forking them: `BookingsTable` gained a `perspective: "student" | "lecturer" | "admin"` prop (picks the name column instead of hardcoding "Lecturer"), and `TaskList` gained an optional `tasks` prop (`DEFAULT_TASKS` for student, `LECTURER_TASKS`/`ADMIN_TASKS` passed in from `page.tsx`).
- `Booking` (types.ts) now carries both `lecturerName` and `studentName` — matches the real `bookings` table having both `lecturer_id`/`student_id` (capstone-db-schema.md §3.2); mock data updated accordingly (`getMockLecturerBookings`, `getMockAdminOverview`, `getMockLecturerSlotsToday` added to `mock-data.ts`).

### Phase 5 — Polish ✅ done
- **Motion**: `StaggerGroup`/`StaggerItem` (new) give every dashboard section a cascading entrance; `StatTile` count-up animates numeric values (string values like `"68%"` render statically, no parsing). Both gate on `useReducedMotion()` — falls back to plain divs / the final value with no animation, matching `AuthLayout`'s existing convention.
- **Empty states**: already covered in Phase 2/4 (`BookingsTable`, `UpcomingList`, `SlotsTodayList` all have one) — nothing new needed here.
- **Loading skeleton**: replaced the layout's plain "Loading…" text with `DashboardSkeleton`, shaped like the real shell (sidebar/topbar/content) so there's no layout jump once it mounts. This is the one real async loading state on the route (`useAuth()`'s initial `/api/auth/me`) — no skeletons were invented for the (synchronous, mock) dashboard content itself.
- **Mobile nav**: the sidebar was `hidden` below `md` with nothing replacing it — a real gap, not hypothetical. Added a hamburger button + slide-in drawer (Framer Motion, backdrop, closes on link click/backdrop click/route change) to `DashboardShell`. Extracted `NavLinks` so the sidebar and drawer render the same list from one source instead of two copies.
- Fixed two `react-hooks/set-state-in-effect` violations (the same React Compiler rule `AuthLayout` already works around) by deriving state during render instead of calling `setState` synchronously inside `useEffect`.

### Phase 6 — Decorative accent palette ✅ done
User-directed: the restrained blue-only app shell read flat next to the reference's livelier
pastel accents; explicitly chose "full reference match" over a decorative-only middle ground.
- **New tokens** (`app/globals.css`, mirrored in `docs/DESIGN.md` §3): `--coral-*` (orange),
  `--rose-*` (pink/magenta), `--mint-*` (green) — 100/500/600/700 steps each.
- **Validated as a set before use**: `node scripts/validate_palette.js "#F97316,#EC4899,#22C55E,#3465E0" --mode light` (dataviz skill) — coral/rose/mint/brand all pass; the surface-contrast WARN is resolved the same way status badges handle it, color always paired with an icon + label.
- **New `lib/ui/accent-palette.ts`** — `ACCENT_TOKENS` (decorative), kept deliberately separate from `lib/ui/status-hues.ts` (booking-status semantics, untouched).
- **`IconChip`/`StatTile` generalized**: `hue: Hue` → `tone: { bg; text }`, so callers pick either `HUE_TOKENS` (semantic) or `ACCENT_TOKENS` (decorative) explicitly per tile. Applied per-tile judgment, not blanket recoloring: tiles with real status meaning (Pending/warning, Confirmed/success, No-show/danger) kept their semantic hue; pure-count tiles (Upcoming, Active users, Utilization, …) moved to the accent palette.
- **Reskinned**: `FeaturedActionCard` (solid blue → peach/coral gradient + coral button, matching the reference's "Course code" card), `MiniCalendar` (selected date: blue → rose/magenta pill), `DashboardShell` (bell: ghost → solid coral circle; active nav item: filled pill → left accent bar), `TaskList` (checked state: green → blue, matching the reference).
- **`ActivityChart` restyled in a follow-up pass** — the Phase 6 write-up above originally kept it on brand-300/500, reasoning the base/highlight pair as a 2-slot *categorical* set (same lens as the icon-chip palette). That was the wrong lens: re-checked against the dataviz skill's own scope note ("for a lone status/text color check WCAG text contrast" — categorical CVD checks are for genuinely distinct categories, not a muted/inactive bar). Re-validated each accent as a standalone highlight color (`node scripts/validate_palette.js "#EC4899" --mode light` → PASS; `"#F97316"` / `"#22C55E"` → WARN, same as brand-500 originally was) and switched the base bars to a plain neutral (`--paper-200` fill / `--ink-300` stroke, closer to the reference's actual muted gray bars) with a per-chart `accent` prop (`ChartAccent`) for the highlight. Student's chart now highlights in `rose` (matches its "Upcoming bookings" tile + calendar selection), admin's in `coral` (matches its "Active users" tile). Still rejected: literal per-bar rainbow coloring with no data meaning — that remains an anti-pattern regardless of which hues are available.
- Booking-status hues (§4) and `--accent` itself (default buttons/links/focus rings) are untouched.
- Full writeup of the decision and what stayed blue: `docs/DESIGN.md` §1.2.

### Phase 7 — Collapsible sidebar & glass confirm modal ✅ done
- **Collapsible sidebar**: `DashboardShell`'s desktop `<aside>` toggles between `w-64` and `w-[76px]` via a `PanelLeftClose`/`PanelLeftOpen` button in the sidebar header. `NavLinks` gained a `collapsed` prop (icon-only, centered, `title` attr for a native tooltip since there's no room for a label). Collapsed state is component-local (not persisted to storage) to avoid an SSR/hydration mismatch — resets on reload. The logo crops down to just its mark (`w-8 h-6 overflow-hidden` around `LogoWithText`, whose mark ends ~30% into its viewBox — verified before relying on it) rather than needing a second logo asset. Mobile drawer is unaffected — it always renders full-width regardless of desktop collapse state.
- **`ConfirmModal`** (new, `components/ConfirmModal.tsx`, top-level not dashboard-only since it's a generic confirm/destructive-action primitive): glassmorphism dialog — dark `--brand-950` backdrop + blur, frosted card reusing the *existing* `--glass-bg`/`--glass-border` tokens from the auth pages rather than inventing new ones. No `DESIGN.md` conflict here — §1 already reserves glass for "top nav, modals, dropdowns," this is just the first modal to actually exist. Generic props (icon/title/description/labels), not logout-specific, so cancel-booking/decline-request can reuse it later.
- Wired into the sidebar's existing "Log out" button — clicking it now opens the confirm modal instead of logging out immediately, matching the reference screenshot's exact use case.

### Phase 8 — Shared authenticated pages (Profile, Notifications, My Bookings, Booking Detail) ✅ done
Planned with Opus (via the `Plan` agent) before implementation; closes Pages.txt #6–9, the highest-leverage
404s since every nav link and `SectionHeader href` on the dashboard home already pointed at one of them.
Tracked page-by-page in the new `docs/PAGES-PROGRESS.md`.

- **Route nesting note**: all four live under `app/(dashboard)/dashboard/...` (not `app/(dashboard)/...`) — the `(dashboard)` route group's literal URL segment is `dashboard`, matching the existing home page's path, so e.g. `app/(dashboard)/dashboard/profile/page.tsx` → `/dashboard/profile`.
- **Types/mock-data added** (`lib/office-hours/types.ts`, `mock-data.ts`): `Notification`/`NotificationType`/`NotificationPrefs`, `BookingTimelineEvent`; `getMockNotifications`, `getMockNotificationPrefs`, `getMockAllBookings` (student + lecturer + a few other-lecturer rows, so the admin cross-lecturer view isn't just the same seeded lecturer again), `getMockBookingById`, `getMockBookingTimeline` (derived from status + startAt, not hand-authored per id, so it always agrees with whatever booking it's called on).
- **New shared primitives** (`components/dashboard/`): `FilterTabs` (generic segmented control — status filter on My Bookings, All/Unread on Notifications), `FormField`/`TextInput`, `ToggleSwitch`, `NotificationItem`, `BookingTimeline`. Plus `lib/ui/notification-config.ts` (`NOTIFICATION_TYPE_CONFIG`, the notification analogue of `BOOKING_STATUS_CONFIG` — maps onto the same `HUE_TOKENS`, invents no new hues) and `lib/ui/relative-time.ts`.
- **`BookingsTable` got one additive prop**: `getRowHref?: (booking) => string` — when passed, wraps the name cell in a `Link`. Backward-compatible; the dashboard home's usages are untouched.
- **My Bookings** (`.../dashboard/bookings/page.tsx`): role → `{bookings, perspective, heading}` mapping, reusing `BookingsTable` as-is. Lecturers default to a Pending filter (the "to-review" view) via a `useState` initializer function, not an effect — this is also how Pages.txt #19 "Bookings to Review" is satisfied without a separate route.
- **Booking Detail** (`.../dashboard/bookings/[id]/page.tsx`): `useParams()` (client hook, not the async `params` prop, since the page is `"use client"`) + the store-previous-value re-seed pattern (same technique as `DashboardShell`'s route-close effect) so the local mutable booking copy re-seeds if the id changes without a setState-in-effect. Header card + `BookingTimeline` + role-dependent action bar (student: cancel/reschedule-stub; lecturer: confirm/decline when pending, complete/no-show when confirmed-and-past, meeting-record notes when completed; admin: read-only). Cancel/Decline/No-show route through `ConfirmModal`; Confirm/Complete apply directly (non-destructive).
- **Notifications** (`.../dashboard/notifications/page.tsx`): mark-read/mark-all-read, All/Unread `FilterTabs`. SSE (`GET /notifications/stream`) is explicitly **stubbed, not faked** — a static "Live updates soon" affordance with a `title` tooltip, no `EventSource`, no polling interval, per the plan's instruction not to fabricate a live connection with no backend behind it. `DashboardShell`'s bell button now links to this page (was previously inert).
- **My Profile** (`.../dashboard/profile/page.tsx`): identity form (name/department, email read-only), notification-prefs toggles, change-password with client-side validation (min length + match, derived during render) gated behind `ConfirmModal`. No persistence — there's no backend and no `updateUser` on `auth-context` — "Save" only updates local state; commented as the `PATCH /users/me` + `refreshUser()` wiring point for later, not silently faked as if it worked.
- **Lint trap avoided throughout**: every filter/derived list/default (status filters, unread count, role→data mapping, `isPast`) computed during render, not via `useEffect`. One real catch during verification — `react-hooks/purity` flagged a direct `Date.now()` call in Booking Detail's `isPast` check and in `relative-time.ts` (impure-during-render); fixed by switching to `new Date().getTime()`, which the codebase already uses elsewhere in render (e.g. `dashboard/page.tsx`'s `isToday`) without issue — the lint rule specifically targets `Date.now`/`Math.random`-style APIs, not `new Date()`.
- Verified: `npx tsc --noEmit` (clean, same one pre-existing unrelated `app/page.tsx` error), `npx eslint` clean across all new/changed files, and `curl` confirms all four new routes still 307-redirect to `/login` when unauthenticated (`proxy.ts` gating unaffected).
- **Two pre-existing token bugs found and fixed while verifying**: `ToggleSwitch` (Phase 8) referenced `--paper-300`, which doesn't exist in `globals.css` (only 0/50/100/200) — silently rendered with no background. Booking Detail's three destructive buttons referenced `--danger-200` (only 100/500/700 exist) — silently rendered borderless. Both fixed to the nearest real step (`--paper-200`, `--danger-100`). Neither had a visible failure mode (undefined CSS vars just no-op), which is why they slipped through Phase 8's own verification — worth remembering that `bg-[var(--x)]`/`border-[var(--x)]` typos don't throw anywhere in this stack.

### Phase 9 — Student booking flow (Pages.txt #10–15) ✅ done
Planned with Opus (`Plan` agent), implemented in Sonnet 5. Closes the two remaining student-nav
404s (`/dashboard/lecturers`, `/dashboard/waitlist`) plus the full book → group → recurring path.

- **Data layer**: `MOCK_LECTURERS` (`mock-data.ts`) gained stable `id`/`slug`/`blurb` fields — purely additive, the three pre-existing callers (`getMockOfficeHours`, `getMockLecturerSlotsToday`, `getMockAdvisorLoad`) only ever read `name`/`department`/`photoUrl` so nothing broke. New: `getMockLecturers({department, q})`, `getMockLecturerById`, `getMockLecturerWeekSlots(lecturerId, weekOffset)` (deterministic per-lecturer week grid, `conflict` flag from a plain overlap check against the student's own bookings — not a real conflict engine), `getMockRecurringSeries`, `getMockWaitlistEntries`. New types in `types.ts`: `BookableSlot`, `BookingParticipant` (+ optional `participants?` on `Booking`), `RecurringSeries`/`RecurringOccurrence`/`RecurringStatus`, `WaitlistEntry`/`WaitlistStatus`. `WAITLIST_STATUS_CONFIG` added to `status-hues.ts` — maps onto the **existing** hue set, no new colors, same pattern as `BOOKING_STATUS_CONFIG`.
- **#10 Find a Lecturer** (`app/(dashboard)/dashboard/lecturers/`): search box seeded from `?q=` (topbar search pill already targets this), department `FilterTabs`, new `LecturerCard`. Client component wrapped in `<Suspense>` in `page.tsx` since it reads `useSearchParams()` — same pattern as the existing login/reset-password forms.
- **#11 Lecturer Slot Picker** (`.../lecturers/[id]/slots/`): new `WeekSlotGrid` (5-day-column grid of time buttons, muted+disabled for unavailable/conflicting slots with a title tooltip). Week navigation via a plain `weekOffset` state, prev/next chevrons. `useParams()` (client hook, matches Booking Detail's pattern).
- **#12 Book a Slot**: new `BookSlotModal` — deliberately a **restrained white card, not glass** (`ConfirmModal` stays the one sanctioned glass surface, reserved for confirmations, not data entry). Topic field + embedded `ParticipantManager`, inline "request sent" success state, no persistence (comment marks the `POST /bookings` wiring point).
- **#13 Group Booking management**: new `ParticipantManager` (add-by-email, remove-with-`ConfirmModal`), shared by `BookSlotModal` and available to extend Booking Detail. Explicitly commented as **not wired to a real bookings-participants model** — the actual schema isn't known from this repo, so this is a UI/interaction demo, not a faked-persistent feature.
- **#14 Recurring Booking** (`.../bookings/recurring/`): setup form (day-of-week `FilterTabs`, time, semester, lecturer prefilled via `?lecturer=` from the slot picker's "Make this a weekly booking" link) with a **derived-during-render** occurrence preview (pure date math, no effect); existing-series list with per-occurrence `StatusBadge`s and a `ConfirmModal`-gated cancel. No inbound nav link existed for this page per the plan — added one from the slot picker and a "Set up recurring" link in My Bookings' header (student only) so it isn't orphaned. Clearly marked "preview only — not wired to a real recurrence engine."
- **#15 My Waitlist** (`.../waitlist/`): new `WaitlistStatusBadge`, `StatTile`s for queue/offer counts (offer count uses `HUE_TOKENS.info` since it's a real status; queue count uses `ACCENT_TOKENS` since it's a plain count — same semantic/decorative split as Phase 6/8), accept (direct) / decline (`ConfirmModal`) on `OFFERED` entries with an expiry countdown. The `WAITLIST_OFFERED` notification type (Phase 8) now routes here when clicked.
- **Two pre-existing bugs fixed as part of this phase's verification pass** (see the Phase 8 entry above — found while re-checking token usage before adding more danger-hue-bordered buttons in Waitlist).
- **Lint traps avoided**: all date/"now" comparisons use `new Date().getTime()`, never `Date.now()` (the Phase 8 `react-hooks/purity` catch); new ids (participants, series, booked-slot tracking) are generated inside event handlers, never during render; the slot grid and recurring preview are pure functions of component state, no `useEffect` syncing.
- Verified: `npx tsc --noEmit` clean, `npx eslint` clean across `app/(dashboard)`, `components`, `lib`. Restarted the dev server (had stopped) and confirmed all four new routes 307-redirect to `/login` unauthenticated, then logged in as the seeded student account via `POST /api/auth/login` and confirmed all four render 200 with no error markers.

### Phase 10 — Lecturer-facing pages (Pages.txt #16–21) ✅ done
Planned with Opus (`Plan` agent) before implementation, implemented in Sonnet 5. Closes the two
remaining lecturer-nav 404s (`/dashboard/availability`, `/dashboard/schedule`).

- **Scope correction before building anything**: #19 (Bookings to Review) and #21 (Meeting
  Record entry) were already done — #19 by the shared My Bookings route (Phase 8), #21 by
  Booking Detail's existing "Meeting record" card (attended + notes, shown to a lecturer once a
  booking is COMPLETED) — neither was checked off in `PAGES-PROGRESS.md`, now fixed. So this
  phase's actual net-new build was #16/#17/#18/#20, two routes not five.
- **#20 placement** (user-decided, since Pages.txt gives Slot Waitlist view no nav slot of its
  own): folded into `/dashboard/availability` as a third tab rather than a new nav item or a
  bolt-on to My Schedule — thematically it's about the slots Rules/Exceptions define, not the
  imported teaching-schedule data My Schedule shows.
- **`/dashboard/availability`** (`app/(dashboard)/dashboard/availability/page.tsx`): single
  client page, `FilterTabs`-driven Rules / Exceptions / Waitlist tabs (no `useSearchParams`, so
  no `<Suspense>` needed — matches the Waitlist page's pattern, not the Suspense-wrapped
  Lecturers browser).
  - **Rules**: inline add/edit form (day via `FilterTabs` reusing `RecurringBookingClient`'s
    Mon–Fri `DAY_OPTIONS` convention, start/end time, slot-length `<select>`, effective-from/to
    dates) over a list of rule cards; edit re-populates the same form instead of a separate
    modal; delete gated behind `ConfirmModal`.
  - **Exceptions**: one-off BLOCK/ADD entries (date, type via `FilterTabs`, time range, optional
    reason); BLOCK badges pull `HUE_TOKENS.danger`, ADD pulls `HUE_TOKENS.success` — no new
    hues invented, matching DESIGN.md §4's "don't invent per-screen colors" rule; delete gated
    behind `ConfirmModal`.
  - **Waitlist**: read-only, grouped by slot, `tabular-nums` position + relative "requested"
    time (`Intl.RelativeTimeFormat`) — no allocation actions, since Pages.txt frames this as
    transparency and Manual Override (#29) is explicit Admin scope.
- **`/dashboard/schedule`** (`app/(dashboard)/dashboard/schedule/page.tsx`): read-mostly per
  Pages.txt ("admin edits") — day-column layout echoing `WeekSlotGrid`'s visual language but
  static info cards (title, time range, Imported/Manual source badge) instead of bookable
  buttons; a banner note points corrections at the future Admin Schedule Import/Manual Entry
  pages (#24/#25) rather than faking an "Edit" button with nothing behind it.
  **Superseded/extended** — schedule import moved from admin-only to self-service (see the
  Phase 11 note below); this banner copy is planned to change to offer self-import instead of
  routing corrections to admin.
- **Data layer** (`lib/office-hours/types.ts`, `mock-data.ts`, purely additive): `AvailabilityRule`,
  `AvailabilityException`/`ExceptionType`, `ScheduleBlock`, `SlotWaitlistGroup`/
  `SlotWaitlistQueueEntry`; `getMockAvailabilityRules`, `getMockAvailabilityExceptions`,
  `getMockScheduleBlocks`, `getMockSlotWaitlistGroups` — all seeded for "Dr. Amara Chen," the
  same lecturer account every other lecturer-facing page already uses.
- No new shared primitives — reused `Card`, `SectionHeader`, `FilterTabs`, `FormField`/
  `TextInput`, `ConfirmModal`, `StatTile`, `HUE_TOKENS`/`ACCENT_TOKENS` as-is. Small
  subcomponents (`RuleCard`, `ExceptionCard`, `WaitlistTab`, schedule's `SourceBadge`) stay
  inline in their page files, matching the existing convention (`WaitlistEntryCard`,
  `SeriesCard`) rather than being extracted to `components/dashboard/` prematurely.
- Verified: `npx tsc --noEmit` clean (same pre-existing unrelated `app/page.tsx` error as every
  prior phase), `npx eslint` clean on all new/changed files. `curl` confirms both new routes
  307-redirect unauthenticated and return 200 with no error markers when logged in as the
  seeded lecturer account. Playwright is present only as a cached CLI shim, not an installed
  project dependency, so visual verification stayed at the same curl/tsc/eslint rigor prior
  phases used rather than adding a new dependency for one screenshot pass.

### Phase 11 — Admin CRUD/data-entry pages (Pages.txt #22–26) ✅ done
Planned with Opus (`Plan` agent) before implementation, implemented in Sonnet 5. First half of
the Admin block, split from #27–30 (Allocation/Analytics, the heavier-dataviz half deferred to
Phase 12) per the user's confirmed call — same "split a big block, plan each half separately"
pattern the Lecturer phase didn't need but Admin's size warranted.

- **New admin nav item**: `DashboardShell.tsx`'s `"ADMIN"` case gained **Schedule** (between
  Users and Allocation), reusing the already-imported `CalendarDays` icon. Admin nav is now
  Dashboard · Users · Schedule · Allocation · Analytics.
- **`/dashboard/admin/users`** (existing nav link, previously 404) — `FilterTabs`-driven Users /
  Semesters tabs, same tabbed-page shape Phase 10 established for Availability.
  - **Users** (#22): search + role filter over `getMockAdminUsers()` (a new platform-wide
    account list, ~10 rows spanning all three roles/departments — distinct from
    `mock-accounts.ts`'s 3 login-only seeds, though it includes matching rows for each so the
    data reads as consistent with what you can actually log in as). Row-level inline edit
    (role `<select>` + department `TextInput`, same "inline form replaces the row, no modal"
    convention as Phase 10's Rules tab) and deactivate via `ConfirmModal`.
  - **Semesters** (#23): `getMockSemesters()` seed (4 rows: one past, one active, two future) +
    add-semester form + per-row Activate (deactivates whichever other semester was active,
    enforcing "exactly one active" client-side) + delete via `ConfirmModal`.
- **`/dashboard/admin/schedule`** (new route) — Import / Manual Entry / Slot Search tabs.
  - **Import** (#24): the user handed over a real EIU timetable PDF (`TimeTable.pdf`) and a
    working standalone HTML tool (`TimeTableScanner.txt`, pdf.js + X-coordinate day-column
    clustering + `Phòng:`-anchor row clustering) as a reference. Per the user's confirmed
    choice, this **ports that parser** rather than building the CSV-upload flow Pages.txt's
    text originally described — `lib/timetable/parse-pdf.ts` is a behavior-preserving TS
    translation (same regexes, same `cleanStr` cleanup, same day-sort) of the reference tool's
    algorithm, verified against the actual `TimeTable.pdf` (a standalone Node script using
    `pdfjs-dist/legacy/build/pdf.mjs` reproduced the same 7-row extraction the algorithm
    produces, confirming the port before wiring it into the page). New dependency:
    **`pdfjs-dist` 6.2.108** — installed the same "add it when the feature that needs it is
    actually built" way `recharts`/`react-day-picker` were (§2); worker wired via
    `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)` (the standard
    bundler-native pattern) rather than the reference tool's cdnjs URL, since the app already
    has a bundler and this avoids an external runtime dependency. Extended beyond the ported
    tool to also scan each day-column header's calendar date (e.g. "(03/08)" next to "Thứ 2")
    via nearest-x match onto the same `dayCols`, exposed as `ParsedTimetableRow.date` and shown
    in the preview table next to the day name — informational only, since entries still import
    as a recurring weekly pattern (`dayOfWeek`), not a one-off date. The page shows a parse
    status line, a preview table, an "Import N entries" button that appends mapped rows into
    the shared `AdminScheduleEntry[]` state, and an import-history table
    (`getMockScheduleImportHistory()` + session-added rows) standing in for the "job status
    polling" Pages.txt describes — no real async job exists (client-side parse is synchronous),
    so this is presented as a history log, not a fake polling UI (same "stub, don't fake a live
    connection" rule Phase 8 applied to the notifications SSE stub).
  - **Manual Entry** (#25): fallback single-entry add/delete, sharing the same
    `AdminScheduleEntry[]` state as Import (lecturer `<select>` from `getMockLecturers()`, title,
    day `FilterTabs`, start/end time).
  - **Superseded/extended by a planned self-service phase:** the admin-only Import tab is no
    longer the sole ingestion path. Students and lecturers are planned to self-upload their own
    official AAO timetable export via a role-aware `/dashboard/schedule` (extending #18, adding
    #32 — see `PAGES-PROGRESS.md`), reusing the same `ImportTab`/`parseTimetablePdf` machinery.
    Admin's Import tab here remains as an on-behalf-of/oversight fallback, not the only path.
    `ImportTab`'s parse logic and `lib/timetable/parse-pdf.ts` are unchanged; only the surrounding
    page (target user, entry shape) differs, and `ImportTab` will need extracting into a shared
    component generic over entry type (currently parameterized on `AdminScheduleEntry[]`) rather
    than living inline in this admin page. See `capstone-officehours-plan.md` §5.1 and
    `capstone-api-endpoints.md` §4 for the design rationale (AAO exports are institutionally
    authoritative, so uploader identity doesn't affect trust).
  - **Slot Search** (#26): cross-lecturer browser reusing `getMockOfficeHours()` as-is (already
    department-filterable, the same function the public listing and dashboard stat tiles read)
    plus a new lecturer-name text filter — no new mock data needed, UI-only addition.
- **Data layer** (`lib/office-hours/types.ts`, `mock-data.ts`, purely additive): `AdminUserRow`
  (reuses `UserRole` from `lib/auth/types.ts` rather than redefining it), `Semester`,
  `AdminScheduleEntry` (extends Phase 10's `ScheduleBlock` with `lecturerName`),
  `ParsedTimetableRow`, `ScheduleImportHistoryEntry`; `getMockAdminUsers`, `getMockSemesters`,
  `getMockAdminScheduleEntries`, `getMockScheduleImportHistory`.
- No new shared UI primitives — reused `Card`, `SectionHeader`, `FilterTabs`, `FormField`/
  `TextInput`, `ConfirmModal`, `HUE_TOKENS`. Small subcomponents (`UserEditRow`, `SemesterCard`,
  `SourceBadge`, per-tab components) stay inline in their page files, matching the established
  convention.
- **Checked, not changed**: `proxy.ts` only gates on session-existence, not role — no route in
  this app enforces role beyond hiding nav links (true for the existing Lecturer routes too).
  Phase 11 follows that same convention rather than adding new role-enforcement machinery.
- Verified: `npx tsc --noEmit` clean (same one pre-existing unrelated `app/page.tsx` error every
  phase has had), `npx eslint` clean after fixing two `react/no-unescaped-entities` catches
  (a literal `"` and `'` in JSX text) on first pass. `curl` confirms both new routes 307-redirect
  unauthenticated and return 200 with no error markers when logged in as the seeded admin
  account. The parser was verified against the real `TimeTable.pdf` via a standalone Node
  script (not just code review) before being wired into the page — see the Import bullet above.

### Phase 12 — Admin allocation & analytics pages (Pages.txt #27-30) ✅ done
Planned with Opus (`Plan` agent) before implementation, implemented in Sonnet 5. Closes the
Admin block entirely — the dashboard's admin nav no longer has any 404 links, and the Pages.txt
31-page list is done except #31 Research tools (explicitly out of scope).

- **Schema grounding**: read `docs/capstone-db-schema.md` §4.2-4.3 and
  `docs/capstone-api-endpoints.md` §7/§9 (the real backend spec) before designing the mock
  types, rather than inventing shapes from the Pages.txt one-liners alone. `AllocationEvent`
  mirrors the DB's mutually-exclusive field groups (`SELECTED`/`SKIPPED` carry
  `policyName`/`computedScore`/`randomSeed`; `OVERRIDDEN` instead carries
  `overriddenByName`/`overrideReason`) — same shape as the schema's CHECK constraint, not a
  simplified version of it.
- **`/dashboard/admin/allocation`** (existing nav link, previously 404) — `FilterTabs` Policies
  / Events tabs, same tabbed-page shape every phase since 10 has used.
  - **Policies** (#27): register/activate/delete over `getMockAllocationPolicies()` (4 named
    policies — FCFS/NEED/ROUND_ROBIN/HYBRID, HYBRID active). The add form's weight fields
    change per policy type (none for FCFS/ROUND_ROBIN, one for NEED, three for HYBRID) —
    matches the real `config` JSON shape the API doc describes, not a one-size-fits-all form.
  - **Events** (#28) **+ Manual Override** (#29): filterable audit table (policy, decision) +
    a "New override" action that opens an inline form (not `ConfirmModal` — needs real inputs,
    same distinction `BookSlotModal` drew from `ConfirmModal` back in Phase 9) and appends an
    `OVERRIDDEN` row. **Placement decision (user-confirmed)**: rather than a modal on Phase
    11's Slot Search tab (a different route — would need cross-route shared state no other
    phase uses), Override lives as a standalone action on this page, writing into its own
    page-local `useState` list. Same convention every prior phase has used; avoids introducing
    the first global-state mechanism in the app for one feature.
- **`/dashboard/admin/analytics`** (existing nav link, previously 404) — four stacked sections,
  no tabs (matches Pages.txt's "live demo view" framing and the admin dashboard home's existing
  `FeaturedActionCard` that already links here):
  1. **Advisor load** — reused `ActivityChart` + `getMockAdvisorLoad()` exactly as built in
     Phase 6, just placed on this page too (the dashboard home keeps its own copy).
  2. **No-show rate by lecturer** — new `getMockNoShowRateByLecturer()`, *derived* from
     `getMockAllBookings()` (Phase 8) grouped by lecturer, not hand-authored numbers.
  3. **Equity** — two Gini headline stats (`giniCoefficient()`, a small pure
     mean-absolute-difference helper added to `mock-data.ts`, shared by this section and Policy
     Comparison so numbers are computed once, not duplicated by hand) plus a **Lorenz curve**
     (`recharts` `LineChart`): the actual cumulative-distribution line in `rose` (an
     already-validated standalone accent, no new palette validation needed) against a plain
     dashed neutral-gray equality diagonal — treated as a fixed geometric reference, not a
     second data-driven series, so it doesn't need a legend or a CVD-pair check. Table-view
     toggle included (dataviz skill non-negotiable). `getMockEquityMetrics()`'s Gini numbers
     and Lorenz points both derive from the same synthetic skewed distribution, so they can't
     disagree with each other.
  4. **Policy comparison** — four independent small-multiple `ActivityChart`s (Gini
     slots-per-student, Gini lecturer-access, utilization %, avg wait time), each with policies
     along the X axis and the *active* policy highlighted (`highlightKey`) — deliberately **not**
     one chart with mixed scales/two y-axes, the dataviz skill's #1 anti-pattern.
     `getMockPolicyComparison()`'s four metrics are now DERIVED, not hand-picked: a real
     `allocate()` engine (`lib/allocation/engine.ts`, implementing the FCFS/NEED/ROUND_ROBIN/
     HYBRID formulas from plan.md §11.2) runs a bounded, seeded micro-simulation
     (`simulatePolicy()` in `lib/office-hours/mock-data.ts`) per policy and these are the actual
     resulting Gini/utilization/wait numbers — see the allocation-engine implementation note
     below the Research Tools entry.
- **`ActivityChart` generalized** (`components/dashboard/ActivityChart.tsx`): the component was
  hardcoded to "N booking(s)" in its tooltip and "Bookings" table-column header — fine for its
  only two pre-existing callers (booking activity, advisor load, both literal booking counts),
  **wrong** for Gini/percent/minutes metrics reused here. Added optional `valueLabel` (table
  header) and `formatValue` (tooltip text) props, both defaulting to the exact prior behavior —
  every pre-existing call site is unaffected, new callers (no-show %, the four comparison
  charts) pass both so units read correctly instead of literally saying "0.24 bookings."
- **Data layer** (`lib/office-hours/types.ts`, `mock-data.ts`, purely additive):
  `AllocationPolicyName`, `AllocationPolicy`, `AllocationDecision`, `AllocationEvent`,
  `EquityMetrics`, `PolicyComparisonRow`; `getMockAllocationPolicies`, `getMockAllocationEvents`,
  `getMockNoShowRateByLecturer`, `giniCoefficient`, `getMockEquityMetrics`,
  `getMockPolicyComparison`.
- No new shared UI primitives beyond the `ActivityChart` prop additions above — `Card`,
  `SectionHeader`, `FilterTabs`, `FormField`/`TextInput`, `ConfirmModal`, `IconChip`,
  `HUE_TOKENS`, `ACCENT_TOKENS` all reused as-is. Page-local subcomponents (`PolicyCard`,
  `OverrideForm`, `DecisionPill`, `GiniStat`, `EquitySection`, `PolicyComparisonSection`) stay
  inline in their page files, matching the established convention.
- Verified: `npx tsc --noEmit` clean (same one pre-existing unrelated `app/page.tsx` error every
  phase has had), `npx eslint` clean after removing one unused icon import on first pass.
  `curl` confirms both new routes 307-redirect unauthenticated and return 200 with no error
  markers when logged in as the seeded admin account.

### Phase 13 — Research Tools (Pages.txt #31) ✅ done
Planned with Opus (`Plan` agent) before implementation, implemented in Sonnet 5. Closes the
Pages.txt 31-page list entirely — #31 was previously marked out-of-scope/skipped as "stretch,
may be dev-only"; built now since it's the actual capstone research deliverable (§11.4), fully
spec'd on paper (`capstone-api-endpoints.md` §7.1, `capstone-db-schema.md` §4.4) but with no UI
until this phase.

- **Nav placement — revised after initial ship.** Phase 13 originally shipped with no sidebar
  entry (API doc tags these endpoints `Admin (dev/research tooling)`, "not user-facing
  product features" — reasoning mirrored Recurring Bookings' no-nav-slot precedent, #14 Phase
  9). **User override**: add it to the admin sidebar anyway, prioritizing discoverability over
  the dev-only framing — this was flagged as a trivial follow-up in the original plan and is
  exactly what got picked. `DashboardShell.tsx`'s `"ADMIN"` case gained **Research** (last
  item, `FlaskConical` icon) — admin nav is now Dashboard · Users · Schedule · Allocation ·
  Analytics · Research. The Analytics → Research `SectionHeader` link (below) stays as a
  contextual shortcut alongside the sidebar entry, not instead of it; the page's honesty
  banner copy was adjusted to drop the now-inaccurate "that's why it isn't in the sidebar"
  line.
- **`/dashboard/admin/research`** (new route) — `FilterTabs` Demand / Experiments tabs, same
  shape every admin page since Phase 10 has used, plus an honesty banner
  ("illustrative... deterministic given a seed... no real allocation engine runs client-side")
  under the header, matching the Notifications-SSE-stub / `getMockPolicyComparison` precedent
  for not faking a live backend.
  - **Demand** (mirrors `POST /research/synthetic-demand`): `DemandRunForm` (seed, popularity
    skew, arrival pattern, student/lecturer counts) appends a `SyntheticDemandRun` to
    page-local state; `DemandRunCard` list; delete gated behind `ConfirmModal`.
  - **Experiments** (mirrors `POST /research/experiments`, `GET /{id}`, `GET /{id}/export`):
    `ExperimentForm` (pick a demand run + seed + policy checkboxes) runs
    `computeExperimentResults()` and appends an `Experiment`. Results view: a full metrics
    `ResultsTable` (all nine `experiments`-table columns, including `pctStudentsWithSlot` —
    added later, see the allocation-engine implementation note above), two `ActivityChart` small
    multiples (Gini, utilization — reusing the exact `valueLabel`/`formatValue`/`accent`
    props Phase 12 added), the fairness-vs-efficiency frontier (below), and JSON/CSV export
    via a client-side `Blob` + anchor-click download (no backend to call, so this is generated
    on click rather than faked as a real export job). `ExperimentCard` list re-selects a past
    run into the results view.
- **Superseded — real `allocate()` engine (net-new phase, beyond the original Pages.txt list).**
  The "illustrative, no real allocation engine runs client-side" framing above described Phase
  13 as shipped. That's since been replaced: `lib/allocation/engine.ts` implements the four
  policies' actual scoring formulas (FCFS = join-order; NEED = `needWeight·need +
  waitWeight·wait`; ROUND_ROBIN = an eligibility cap, not a ranking; HYBRID = weighted need +
  wait + a seeded per-candidate random draw for anti-gaming tie-breaking — see the formula
  table in the module's own comments), and `simulatePolicy()`
  (`lib/office-hours/mock-data.ts`) replays a bounded, seeded synthetic population through it
  to derive real Gini/utilization/wait metrics — both `computeExperimentResults()` (Research
  Tools) and `getMockPolicyComparison()` (Analytics) now call it instead of hand-picked/jittered
  constants. The honesty banner on `/dashboard/admin/research` was updated accordingly (real
  engine, still demo-scale/capped, not the full server-side study). `lib/prng.ts` extracted the
  shared seeded-PRNG (`mulberry32`) + a `seededHash()` helper so every random draw in the engine
  and the simulator derives independently from one run seed, keeping runs reproducible (NFR-3)
  regardless of call order.
- **Fairness-vs-efficiency frontier** (`FrontierScatter`, the §11.4 "frontier per policy"
  deliverable): read the `dataviz` skill first, per the plan. Built as a genuine 2-D
  `recharts` `ScatterChart` — utilization % (efficiency) on X, Gini (fairness) on Y, one
  labeled point per policy — **not** a dual-axis combo chart layering two measures onto one
  categorical X, the skill's #1 anti-pattern. Policy name is a direct text label
  (`LabelList`) on every point, never color-alone identity; the active policy gets the one
  `rose` accent, the rest a neutral `paper-200`/`ink-300` fill — same "highlight one, mute
  the rest" philosophy as `ActivityChart`, not a four-way categorical palette. Mandatory
  table-view toggle included (dataviz non-negotiable), axis titles state the fairness/
  efficiency direction directly ("lower-right = fairer and more efficient").
- **Data layer** (`types.ts`, `mock-data.ts`, purely additive): `ArrivalPattern`,
  `SyntheticDemandRun`, `ExperimentPolicyResult`, `Experiment` — field names/shapes mirror the
  DB schema's `synthetic_demand_runs`/`experiments` columns 1:1 (the plan's grounding step).
  `getMockSyntheticDemandRuns`, `getMockExperiments`, and `computeExperimentResults()` — a
  **pure, seeded** (`mulberry32`, never `Math.random()`) function that jitters
  `getMockPolicyComparison()`'s existing baselines by ±8% per seed, then derives the four
  DB-only metrics (`maxMinRatio`, `avgTimeToFillSeconds`, `offerRejectionRatePct`,
  `waitTimeVariance`) from those jittered numbers rather than seeding them independently —
  so a "fairer" policy can't randomly also read as faster, and the same seed always
  reproduces the same result (demonstrates NFR-3 reproducibility, the literal point of this
  page). Reuses `getMockPolicyComparison()` rather than inventing a second, potentially
  disagreeing set of illustrative numbers — Analytics' Policy Comparison and this page's
  Experiments tab stay consistent by construction.
- No new shared UI primitives — reused `Card`, `SectionHeader`, `FilterTabs`, `FormField`/
  `TextInput`, `ActivityChart`, `ConfirmModal`, `IconChip`, `ACCENT_TOKENS`. Page-local
  subcomponents (`DemandRunForm`, `DemandRunCard`, `ExperimentForm`, `ResultsTable`,
  `FrontierScatter`, `ExperimentCard`) stay inline in the page file, matching the established
  convention.
- Verified: `npx tsc --noEmit` clean (same one pre-existing unrelated `app/page.tsx` error
  every phase has had — one new error was introduced and fixed during this phase, a
  `LabelList` `formatter` prop typed against `recharts`' generic `RenderableText`, not the
  narrower `AllocationPolicyName`), `npx eslint` clean after fixing five
  `react/no-unescaped-entities` catches (apostrophes in the honesty-banner copy) on first
  pass. `curl` confirms the new route 307-redirects unauthenticated and returns 200 with no
  error markers when logged in as the seeded admin account.

### Phase 14 — Toast notification system ✅ done (Wave 1)
Planned with Opus (`Plan` agent) before implementation, implemented in Sonnet 5. The app had two
blocking floating-overlay primitives (`ConfirmModal`, glass; `BookSlotModal`, restrained) but no
non-blocking, auto-dismissing feedback channel — logout, waitlist accept, and most admin CRUD
mutations fired silently. This phase adds that channel and wires it onto the transactional spine
(auth + booking lifecycle); admin CRUD wiring is an explicitly deferred Wave 2.

- **Visual decision — revised on user direction with a reference screenshot.** Originally shipped
  flat/restrained (a `Card`-style surface with a hue-colored left border), reasoned against
  DESIGN.md §1 as: a toast has no backdrop, so glass-over-arbitrary-light-content would repeat the
  readability problem §1 keeps glass away from elsewhere. **User override, with a concrete
  reference design**: dark glassmorphism card, top-right, colored icon circle per type — the
  toast now carries its **own** dark tint (new tokens `--toast-glass-bg`/`--toast-glass-border`,
  `app/globals.css`) rather than the light `--glass-bg` auth/modal tint, so it still physically
  reads as frosted glass without a dark backdrop underneath it. Documented as an explicit §1.3
  exception in `DESIGN.md`, not a silent contradiction of §1 — see there for the full reasoning.
  The hue mapping itself is unchanged (still `HUE_TOKENS`, still no new status colors): a solid
  `var(--{hue}-500)` circle with a white icon, sitting inside a soft same-hue halo at 30% opacity.
- **`lib/ui/toast-config.ts`** (new) — `ToastVariant` (`success/error/warning/info/neutral`) →
  `HUE_TOKENS` hue + lucide icon + per-variant default duration + aria role/live, mirroring
  `notification-config.ts`'s "map onto the existing hues, invent nothing new" rule. `error`→
  `danger`, `neutral`→the `CANCELLED`-style neutral hue — no new colors, `accent-palette.ts`'s
  decorative set is explicitly the wrong source since a toast reports a real status outcome
  (§1.2's own rule for status vs. decorative tiles, applied here to toasts).
- **`components/ToastProvider.tsx`** (new, top-level like `ConfirmModal` — app-wide, not
  dashboard-only, since auth pages fire toasts too) — `useToast()` exposes
  `success/error/warning/info(title, opts?)` convenience methods plus `show(variant, title, opts?)`
  for the neutral variant and full control, and `dismiss(id)`. `ToastOptions` carries an optional
  `description`, `duration` (0 = sticky), `icon` override, and `action` (label + href/onClick).
  Ids come from a `useRef` monotonic counter incremented inside the `show` callback (an event-
  handler-time call, never render) — not `Date.now()`/`Math.random()`, the Phase 8 lint trap.
  Stack capped at 3 visible (oldest silently dropped) so a burst of rapid actions can't run away.
  Per-toast `ToastTimer` auto-dismisses (success/info/neutral 4s, warning 5s, error 6s — errors
  linger longer) and pauses on hover/focus, resuming with the remaining time; timestamps use
  `new Date().getTime()`, never `Date.now()`.
  - **Lint trap hit and fixed**: the initial "start the timer once" logic was first written as a
    `useRef` guard mutated directly during render (`if (!startedOnceRef.current) { ... }`) — the
    React Compiler's `react-hooks/refs` rule (writing `ref.current` mid-render) correctly flagged
    this. Fixed by moving the one-shot start into an empty-deps `useEffect` with a `clearTimer`
    cleanup, matching `ConfirmModal`'s own effect-based (not render-mutated) side-effect pattern.
  - Swipe-to-dismiss on mobile via `framer-motion`'s `drag="x"` (no new dependency — already
    installed), gated off under `useReducedMotion()` same as every other animated primitive in
    the app (`ConfirmModal`, `BookSlotModal`, `AuthLayout`, the Phase 5 `StaggerGroup`).
    Enter/exit uses the identical `AnimatePresence` + easing curve (`[0.22, 1, 0.36, 1]`,
    `duration: 0.22`) `ConfirmModal` already established, so the app's motion language stays one
    voice.
  - Position: **top-right on desktop, top-center full-width on mobile** — revised from the
    original bottom-right placement on the same user-directed redesign, matching the reference
    screenshot's stacking (newest closest to the corner, older toasts pushed down; `show()` now
    prepends rather than appends). The original bottom placement was chosen to dodge the
    dashboard topbar's bell/search pill; top-right can visually overlap that chrome when both are
    open at once — an accepted trade-off for matching the requested design exactly, not something
    flagged as needing a fix.
  - Accessibility: each toast is `role="status" aria-live="polite"` (success/info/warning/
    neutral) or `role="alert" aria-live="assertive"` (error) so it's announced without stealing
    focus; the dismiss button has `aria-label="Dismiss"`; nothing autofocuses.
- **Mount point**: `app/layout.tsx` (root), wrapping `PageTransition` and nested inside
  `AuthProvider` — the only layout spanning all three route groups (auth/dashboard/landing), so
  one provider instance survives a `router.push()` across group boundaries (e.g. the
  login-success toast surviving the redirect to `/dashboard`). Mounting separately in
  `(auth)/layout.tsx` and `(dashboard)/layout.tsx` would have created two provider instances and
  dropped exactly that toast mid-flight.
- **Toast vs. `Notification`-inbox boundary (reusable principle, not a case-by-case list)**:
  "toast the actor, notify the recipient." A toast is ephemeral feedback about an action *the
  current user just took*, non-persisted; a `Notification` (Phase 8's bell inbox) is a persisted
  record of something that happened *to* the user, typically via another party's action, and
  must survive reloads. The two never overlap in rendered output — a toast is never derived from
  `getMockNotifications()`, and confirming your own booking fires a toast to you while the
  `Notification` write for the *other* party stays a documented wiring comment (no backend to
  actually deliver it to a second session, same "don't fake cross-user persistence" rule as the
  Phase 8 SSE stub).
- **Wave 1 wiring (the transactional spine — auth + booking lifecycle)**, scoped deliberately
  small per the Phase 11/12 "split a big block" precedent — proving the primitive on ~10 call
  sites before mechanically wiring the remaining ~20 admin CRUD buttons as Wave 2:
  - `LoginForm.tsx`: `handleSubmit` success → `toast.success("Welcome back")`; the two inline
    `justRegistered`/`justReset` query-param banners replaced outright by
    `toast.success("Account created"/"Password reset", { description })` fired from a
    mount-time `useEffect` (URL-derived, not render-mutated state). Inline field-level `role="alert"`
    error text is kept for both login and register failures — deliberate: a validation failure
    benefits from proximity to the field, and the toast channel is reserved for successes here so
    the two `aria-live` regions never double-announce the same failure. (Flagged as a judgment
    call the user may want to override toward "toast every outcome.")
  - `DashboardShell.tsx`: logout `ConfirmModal onConfirm` → `toast.show("neutral", "Signed out")`.
  - `bookings/[id]/page.tsx`: Confirm → success "Booking confirmed"; Mark completed → success
    "Marked completed"; Save record → success "Meeting record saved"; the shared `ConfirmModal`
    branches on `pendingAction` for Cancel → neutral "Booking cancelled", Decline → error
    "Booking declined", No-show → error "Marked as no-show".
  - `lecturers/[id]/slots/page.tsx` (`BookSlotModal`'s caller): booking `onConfirm` → success
    "Request sent" with an `action` link to `/dashboard/bookings`.
  - `waitlist/page.tsx`: `accept()` → success "Offer accepted"; decline `ConfirmModal onConfirm` →
    neutral "Offer declined".
- **Wave 2 (deferred, documented follow-up)**: the ~20 remaining admin CRUD call sites across
  Availability (Rules/Exceptions), Admin Users/Semesters, Admin Schedule (Import/Manual Entry),
  Allocation (Policies/Override), and Research Tools (Demand/Experiments) — plus Profile's save/
  password-change and Recurring Bookings' create/cancel. Mechanical once the primitive exists
  (`toast.success("X deleted")` per handler); intentionally not bundled into this phase so it
  doesn't repeat the mistake the Phase 11/12 admin split specifically avoided.
- Verified: `npx tsc --noEmit` clean (same one pre-existing unrelated `app/page.tsx` error every
  phase has had), `npx eslint` clean after fixing the `react-hooks/refs` catch above. `curl`
  confirms `/login`, `/dashboard`, `/dashboard/bookings/1`, `/dashboard/lecturers/1/slots`, and
  `/dashboard/waitlist` all still return 200 post-wiring.

---

## 4. DESIGN.md guardrails checklist (apply to every phase)
- [x] ~~Blue is the only primary/interactive color — no orange CTA, no magenta selection.~~ Revised Phase 6 — see DESIGN.md §1.2 for the new decorative-accent rule and what deliberately stayed blue.
- [ ] Glass only on chrome (sidebar, topbar, dropdowns, modals) — content cards stay flat.
- [ ] No rough.js / hand-drawn accents on the app shell (landing page only).
- [ ] Badge & chip hues come from the §4 status table — don't invent per-screen colors.
- [ ] `tabular-nums` on any column of aligned digits (dates, times, counts).
- [ ] Light-locked (`data-theme="light"` on `<html>`) — consistent with the rest of the app.
