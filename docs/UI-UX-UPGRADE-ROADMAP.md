# OfficeHours UI/UX upgrade roadmap

> Detailed page-by-page findings, route coverage, and phase gates: [UI/UX route audit](UI-UX-ROUTE-AUDIT.md).

**Prepared:** 29 September 2026  
**Scope:** Code review of the Next.js app, its shared components, design system, and the supplied sidebar screenshot. This is an implementation plan, not a completed browser or user study. Desktop and mobile behavior outside the supplied screenshot still need visual review with signed-in student, lecturer, and admin accounts.

## Product direction

OfficeHours should feel like a campus scheduling tool: the next available time, timetable conflicts, request state, and fair allocation should be more prominent than generic dashboard metrics. Preserve the design split in [DESIGN.md](DESIGN.md): expressive landing, glass auth, restrained app. The approved **Refined light** sidebar is now implemented in `components/dashboard/DashboardShell.tsx`; use it as the shell baseline.

The most urgent issue is **trust**. Many dashboard actions operate only on mock data held in component state, while success messages imply a real change. Prioritize accurate state and honest wording before another visual refresh.

## Route and flow inventory

| Area | Current surfaces | Main job | Review priority |
| --- | --- | --- | --- |
| Public/auth | `/`, `/login`, `/register`, `/public/office-hours` | Understand the service and sign in | P1 |
| Student | dashboard, lecturer browser/slots, bookings/detail/recurring, waitlist, schedule, notifications, profile | Find a suitable slot and follow its outcome | P0 |
| Lecturer | dashboard, bookings/detail, availability, schedule, notifications, profile | Publish hours and resolve requests | P0 |
| Admin | users/semesters, schedule, allocation, analytics, research | Maintain terms and audit decisions | P0–P2 |

## Evidence-backed findings

| Priority | Finding and evidence | User impact | Upgrade |
| --- | --- | --- | --- |
| P0 | Dashboard pages commonly seed `useState` from `lib/office-hours/mock-data.ts`. For example, `dashboard/bookings/page.tsx` changes local `bookings` and announces confirmation/cancellation; `dashboard/profile/page.tsx` sets “Saved” and “Password changed” locally; `dashboard/lecturers/[id]/slots/page.tsx` marks a booked slot locally. | A user can see success, navigate away, and lose the result; related screens can disagree. | Introduce one persisted source of truth per flow. Until an endpoint exists, label demo actions clearly and avoid claiming that another party was notified. Tie success feedback to the actual save response. |
| P0 | `app/(dashboard)/layout.tsx` guards sign-in only; `proxy.ts` checks for a token cookie, and admin pages do not share a role gate. | A signed-in user can reach admin route UI by URL. The current data is mock data, but the flow teaches an unsafe access pattern. | Add a role-aware route boundary and a clear “No access” page; enforce authorization again on real backend endpoints. |
| P0 | `dashboard/bookings/recurring/RecurringBookingClient.tsx:113` constructs an end time with `mm + 30`, which can produce `10:60`. The flow itself says “Preview only” at line 134. | The preview may show an invalid time and lower confidence in booking rules. | Use minute arithmetic with hour rollover and validate the entire series before display. Keep the preview label until recurrence is persisted. |
| P0 | `dashboard/schedule/page.tsx` and `dashboard/admin/schedule/page.tsx` add manual blocks with title checks but no `endTime > startTime` or conflict check. `dashboard/admin/users/page.tsx` adds semesters without validating date order. | Invalid entries can enter a schedule or term list. | Add inline field errors, overlap checks, and disabled/guarded submission. Explain which conflicts block a save and which only warn. |
| P1 | `dashboard/bookings/page.tsx:65–86` retains selected IDs when a filter changes; bulk action uses every selected ID while the table displays only `filtered`. | A lecturer can act on rows that are currently hidden. | Clear selection on filter change, or make selection explicitly global with a visible summary of hidden rows. Confirm bulk action against the exact visible set. |
| P1 | `dashboard/waitlist/page.tsx:20–68` computes an offer countdown during render but has no clock update; accept/decline is local state. | Expiry text can become stale and a displayed offer may remain actionable. | Drive expiry from a shared time source, refresh it while visible, disable expired actions, and revalidate when accepting. |
| P1 | `components/dashboard/BookSlotModal.tsx` renders a dialog without a title association or keyboard focus management. `components/dashboard/FilterTabs.tsx` marks the selected filter by color alone and does not convey state to assistive technology. | Keyboard and screen reader users can lose context, and long status lists may be awkward on narrow screens. | Add dialog focus entry/trap/return and `aria-labelledby`; expose filter state with `aria-pressed` (or proper tabs), visible focus, and a mobile overflow strategy. |
| P1 | `dashboard/lecturers/LecturersBrowser.tsx:25–78` seeds search from `?q=` once, then keeps filters locally; the no-results message has no reset action. The global shell search routes all roles to lecturer discovery. | Back/forward/shareable searches can drift from the URL; lecturer/admin search lands in a student task. | Keep query/filter state in the URL, show active filters and “Clear filters,” and make header search role-specific or hide it where it has no useful destination. |
| P1 | `dashboard/schedule/page.tsx` has an active subtitle at lines 1102–1103 that describes visual design (“cleaner,” “softer course cards”) instead of helping with scheduling. It references undefined `--paper-300` and `--info-600` at lines 1114 and 1191; `app/globals.css` defines neither. | Copy feels like a design mockup; a divider/icon can silently lose its intended color. | Replace copy with a user task or date context, and use existing `--paper-200` / `--info-500` or `--info-700` tokens as appropriate. Remove the large commented-out predecessor in this file after extracting any useful notes. |
| P1 | `components/dashboard/TimetableImport.tsx` has a parsed-row preview and replace/merge modes, which is a good foundation, but the result is applied to local state. | The preview is useful, yet “Successfully imported” suggests durable storage. | Preserve preview; add duplicate/conflict counts, persistent save status, and an undo/reimport path. Clarify exactly what replace retains. |
| P1 | Landing content includes “480+ lecturers onboard” (`components/landing/StatsBento.tsx`), named testimonials (`TestimonialRow.tsx`), “100% money-back on complaints” (`LandingFooter.tsx`), and definitive pricing promises (`FAQAccordion.tsx`). The reviewed code does not establish evidence for these claims. | Specific social proof and commercial language can feel templated or misleading for a campus tool. | Verify each claim with a source; otherwise use clearly labeled illustrative examples or remove it. Replace generic SaaS proof with a real campus timetable sample, booking state example, and allocation explanation. |
| P2 | Admin analytics/research render seeded mock figures and synthetic demand (`dashboard/admin/analytics/page.tsx`, `dashboard/admin/research/page.tsx`). | An admin can mistake a simulation for live operational data. | Label source, generated timestamp, sample size, and policy assumptions near every figure; visually separate simulation from production metrics. |

## Phased implementation

### Phase 0 — Trust and guardrails (P0)

**Work:** Map each mutating control to a real endpoint or explicit demo mode. Add a shared role guard. Fix recurring time arithmetic, manual block/semester date validation, and truthful success/error states.

**Done when:** Refreshing after a successful mutation preserves the result and related screens agree; failed saves retain user input and show a field or page error; student and lecturer accounts receive a clear 403-style state on admin routes; no invalid time/date can be submitted. If persistence is unavailable, the UI says “Demo preview” before the action and does not promise a notification.

### Phase 1 — Student booking journey (P1)

**Work:** Make discovery filters URL-driven; improve no-results recovery; show date/time, location, topic, conflict result, and response expectations before submitting; make booking state and waitlist offer expiry reliable. Review the full path: find lecturer → select slot → request → see booking → cancel/reschedule/waitlist.

**Done when:** A search URL restores the same results, a zero-result user can reset filters, a request appears in My Bookings after navigation, and an expired offer cannot be accepted. Each state has a useful next step.

### Phase 2 — Lecturer and admin operations (P1)

**Work:** Make selection scope explicit in booking bulk actions; show conflicts while editing availability and schedules; give timetable import a durable preview/commit/undo sequence. In admin, separate user management, semester setup, and schedule import progress from research simulations.

**Done when:** Bulk action count matches the affected rows; conflicts and date errors are explained inline; import summary reports added, skipped, and conflicting rows; admin data labels say whether figures are live, imported, or synthetic.

### Phase 3 — Interaction and accessibility pass (P1)

**Work:** Audit the shared dialog, filter, table, calendar, drawer, and toast patterns with keyboard and screen reader flows. Review mobile layouts at 320, 375, 768, and desktop widths. The new sidebar drawer already has Escape, focus trapping, scroll lock, and focus return; use that as the modal behavior reference.

**Done when:** Every control has a discernible label and visible focus; dialogs announce title and return focus; selected filters announce state; tables/calendars remain usable on a phone; reduced-motion settings are respected.

### Phase 4 — Product voice and visual editing (P1–P2)

**Work:** Remove design-process copy from product screens. Check public claims and replace generic pricing/testimonial/stat sections with verified campus evidence. Edit dashboard information hierarchy around tasks and decisions: upcoming appointment, pending request, available time, conflict, and allocation reason. Keep existing colors and status-to-hue mapping from `docs/DESIGN.md` and `lib/ui/status-hues.ts`.

**Done when:** A reader can tell what to do next on each role’s dashboard; public numbers/quotes have a source or an “illustrative” label; no new decorative status color is introduced; every prominent metric answers a user question.

## Design guardrails against generic templates

1. Use campus-specific data shapes: semester, class block, lecturer opening, request state, waitlist expiry, and allocation reason. Prefer a believable timetable and booking timeline to decorative chart tiles.
2. Let one action lead each view. Student discovery should emphasize time fit; lecturer review should emphasize requests requiring a decision; admin allocation should emphasize why a decision was made.
3. Write copy about outcomes and constraints. Avoid phrases that describe the interface (“cleaner hierarchy”) or unsupported marketing promises.
4. Use the existing visual grammar: restrained app surfaces, purposeful brand blue, and semantic status hues. Keep decorative accent colors on non-status metrics only.
5. Show provenance for data: live, imported, simulated, or sample. Show the last update when freshness changes a decision.
6. Review real empty, loading, partial, error, expired, and permission states alongside the happy path before polishing cards.

## Suggested review sequence before implementation

Capture signed-in student, lecturer, and admin journeys on desktop and mobile. Walk one representative task per role with keyboard only. Compare screenshots against this roadmap, then turn each phase into small tickets with route, state, API dependency, and acceptance criteria. The code evidence above identifies implementation risks; visual density, responsiveness, and usability require that follow-up review.
