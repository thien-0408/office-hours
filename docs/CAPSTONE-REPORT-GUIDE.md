# OfficeHours — Capstone Report Writing Guide
### Source-of-truth reference for writing the thesis/capstone report

> **Read this first, then read the code.** Every claim below is traceable to a file in this repo
> or an existing doc in `docs/`. Where something is planned-but-not-built, it says so plainly.
> Where a fact could not be verified, it is prefixed `verify:`. Do not let the report claim more
> than this guide substantiates.

---

## 1. Purpose of this document

This is **not the capstone report.** It is the reference a report-writer works from: a condensed,
honest map of what the OfficeHours codebase actually is, what its planning docs describe, which
parts are real code versus mock/stub versus paper-only, and where each fact belongs in a standard
thesis structure. Its job is to let you write a *detailed and accurate* report without
re-deriving the project from scratch and without overclaiming. When this guide and the aspirational
planning docs disagree, this guide describes the **shipped reality**; the planning docs describe the
**intended full system** — the report should be explicit about which it is discussing at any point.

### 1.1 The single most important framing decision

The four planning docs (`capstone-officehours-plan.md`, `capstone-db-schema.md`,
`capstone-api-endpoints.md`, parts of `DESIGN.md`) describe a **full-stack system**: Next.js
frontend + Spring Boot modular monolith + PostgreSQL + Redis + Docker. **That backend does not
exist in this repository.** What exists is:

- A complete **Next.js 16 frontend** (31/31 planned pages built — see §7), styled against a real
  design system.
- A thin **Next.js API-route auth shim** that *tries* to call a Spring Boot backend at
  `API_BASE_URL` and **falls back to seeded mock accounts** when it can't reach one (which is
  always, because the backend isn't built). See `app/api/auth/login/route.ts`,
  `lib/auth/mock-accounts.ts`.
- All non-auth data comes from `lib/office-hours/mock-data.ts`, not a database.
- One genuinely real, non-mocked piece of engineering: the **allocation engine + fairness
  simulation** (`lib/allocation/`, `lib/prng.ts`, `simulatePolicy()`/`giniCoefficient()` in
  `mock-data.ts`). This runs real algorithms on real computed data. See §8 — it is the project's
  strongest academic contribution.

The report can honestly be written as **"a fully-realized frontend and a validated allocation-policy
research prototype, against a documented (but not-yet-implemented) production backend design."**
Claiming a working PostgreSQL exclusion constraint, live SSE, or a deployed Spring Boot service
would be false — those are design artifacts in the docs, not running code.

---

## 2. Suggested capstone report structure

A standard thesis outline, annotated with what THIS project has real evidence for and where that
evidence lives. Chapters marked ⚠️ are where the temptation to overclaim is highest.

| # | Chapter | What to write from | Evidence status |
|---|---|---|---|
| 1 | **Introduction** | Executive summary + one-line pitch | `plan.md` §1 — solid |
| 2 | **Problem Statement & Motivation** | Manual office-hours coordination pain; fairness gap | `plan.md` §2 — note these are stated as *hypotheses to validate*, not validated findings |
| 3 | **Objectives & Scope** | Product goals G1–G4, research objective R1, in/out of scope | `plan.md` §3, §5 |
| 4 | **Related Work / Literature Review** | Fair allocation, mechanism design, matching markets; FCFS / round-robin / priority scheduling; Gini coefficient as an equity measure | §11 below — cite standard literature, none is bundled |
| 5 | **Requirements Analysis** | 18 functional (FR-1..FR-18) + 7 non-functional (NFR-1..NFR-7) requirements; personas; use cases | `plan.md` §4, §6, §7, §8 |
| 6 | **System Design & Architecture** ⚠️ | Layered frontend, route map, auth flow, *planned* backend architecture | §4 below — clearly separate "built" (frontend) from "designed" (Spring Boot/PG/Redis) |
| 7 | **Database Design** ⚠️ | 19-table schema, ER model, exclusion-constraint concurrency guard | §5 below + `capstone-db-schema.md` — the DDL is written but **never applied via migration**; present as a *design*, not a live database |
| 8 | **Implementation** ⚠️ | Frontend components, allocation engine, PDF timetable parser, mock-data layer, auth shim | §3, §7, §8 below — be precise about mock vs. real |
| 9 | **The Allocation Engine (novel contribution)** | Four policies, formulas, reproducibility, validation | §8 below + `allocate-engine.md` — **this is the real thing; lean on it** |
| 10 | **Testing & Evaluation** | Engine validation (11 checks) + Gini cross-check (500 trials); the seeded policy-comparison simulation | §8, §9 — see the substitution note below |
| 11 | **Results & Discussion** | Fairness-vs-efficiency frontier from `simulatePolicy()`; policy trade-offs | §8 — results come from a *bounded client-side simulation*, not a pilot deployment |
| 12 | **Conclusion & Future Work** | What's built vs. the backend/pilot that remains | §9 (limitations) — the "Next up" list in `PAGES-PROGRESS.md` is real future work |
| — | **References** | See §11 | — |
| — | **Appendices** | ER diagram, API table, page inventory, DDL, engine formulas | §10 (diagrams/artifacts) |

### 2.1 The Testing & Evaluation substitution (important)

**There is no formal user testing, no lecturer interviews conducted, no pilot deployment, and no
usability study in this repo.** `plan.md` §17 provides a lecturer *interview guide* but marks it
"do this THIS week" — i.e. not yet done. The report should NOT claim empirical user validation.

What legitimately substitutes for an evaluation chapter:

1. **Deterministic engine validation** — 11 standalone selection-logic checks (all passing) +
   the `giniCoefficient()` cross-check against five families of known cases and an independent
   mean-absolute-difference formula across 500 random trials, 0 mismatches. Source:
   `allocate-engine.md` §6. This is genuine, citable software verification.
2. **The seeded, reproducible policy-comparison simulation** (`simulatePolicy()`) — an agent-based
   micro-simulation producing fairness/efficiency metrics per policy. Source: `allocate-engine.md`
   §7. This is your quantitative "Results" evidence, and it is real (not a lookup table) — but
   bounded (§9).

Frame the evaluation as **algorithmic/experimental validation**, not human-subjects evaluation.

---

## 3. Tech stack (every real dependency)

From `package.json`. Versions are exact where pinned, `^`-ranged otherwise. "Used for" is verified
by grepping actual imports, not guessed.

### Production dependencies

| Package | Version | Category | Actually used for (verified) | Report chapter |
|---|---|---|---|---|
| `next` | `16.2.12` | Framework | App Router, route groups `(auth)`/`(dashboard)`, API routes, `proxy.ts` auth gating, `next/image`, `next/font` | System Architecture |
| `react` / `react-dom` | `19.2.4` | UI runtime | React 19; note the codebase is written against the **React Compiler** ESLint rules (`react-hooks/refs`, `react-hooks/purity`) — see `DESIGN.md` §1 and `prng.ts` comments | Implementation |
| `typescript` | `^5` | Language | Whole codebase; `strict: true` (`tsconfig.json`) | Implementation |
| `tailwindcss` | `^4` | Styling | Tailwind v4 (via `@tailwindcss/postcss`); utility classes + the design tokens in `DESIGN.md` §3 | UI/UX Design |
| `framer-motion` | `^12.43.0` | Animation | Page/card entrance stagger, auth glass-card cross-fade, count-up on stat tiles; respects `prefers-reduced-motion` | UI/UX Design |
| `lucide-react` | `^1.28.0` | Icons | ~20 dashboard icons; replaced hand-rolled SVGs in `DashboardShell` | UI/UX Design |
| `recharts` | `^3.10.1` | Charting / dataviz | Booking-activity bar chart (`ActivityChart.tsx`) **and the research analytics** — Gini/Lorenz, policy-comparison small multiples, fairness-vs-efficiency scatter (`admin/analytics`, `admin/research`) | Results & Discussion |
| `pdfjs-dist` | `^6.2.108` | PDF parsing | Client-side EIU/AAO timetable PDF parsing in `lib/timetable/parse-pdf.ts`; worker wired via `new URL(..., import.meta.url)`, not a CDN | Implementation (Timetable import) |
| `three` | `^0.185.1` | 3D graphics | Decorative 3D dioramas on the welcome/landing experience (`FacultyOfficeDiorama.tsx` — 10 `three` imports; `LectureHallDiorama.tsx`, `WelcomeExperience.tsx`). **Raw three.js, not react-three-fiber.** Purely presentational — not part of the office-hours domain | UI/UX Design (optional) |
| `@types/three` | `^0.185.3` | Types | Type defs for `three` | — |

### Dev dependencies

| Package | Version | Category | Used for |
|---|---|---|---|
| `@tailwindcss/postcss` | `^4` | Styling build | Tailwind v4 PostCSS pipeline |
| `eslint` + `eslint-config-next` | `^9` / `16.2.12` | Linting | `next lint`; enforces React Compiler rules |
| `@types/node` | `^20` | Types | Node types |
| `@types/react` / `@types/react-dom` | `^19` | Types | React 19 types |
| `typescript` | `^5` | Language | (also a dev concern) |

### Notable *absences* (don't claim these — they aren't installed)

- **No backend framework, no DB driver, no ORM.** No Spring Boot, no `pg`, no Prisma/Drizzle, no
  Redis client. The Spring Boot / PostgreSQL / Redis stack in `plan.md` §12–13 is **design only**.
- **No auth library.** No `bcrypt`/`argon2`, no `jsonwebtoken`. The "JWT" is a base64 mock token
  (`encodeMockToken` in `lib/auth/mock-accounts.ts`); passwords are compared in plaintext against
  seeded accounts. NFR-4's hashing is a *requirement*, not implemented.
- **No test framework.** No Jest/Vitest/Playwright in `package.json`. The "11 checks" and Gini
  validation in `allocate-engine.md` §6 were run via *standalone scripts*, not a committed test
  suite — verify whether those scripts still exist before citing them as reproducible CI.
- **No `react-day-picker`.** `DASHBOARD-UPGRADE.md` §2 recommends it, but it was never installed;
  the mini-calendar and weekly slot grid are hand-rolled.

---

## 4. System architecture summary

Report-ready. Split cleanly into **(A) what is built** and **(B) what is designed but not built.**

### 4.A Built: the Next.js frontend

**Framework:** Next.js 16 App Router, TypeScript, Tailwind v4. Single shared responsive app shell;
nav swaps by role (Student / Lecturer / Admin) rather than separate portals (`DESIGN.md`).

**Route groups (folder-based architecture):**

- `app/(auth)/` — Login, Register, Forgot/Reset password. Shares one persistent layout
  (`app/(auth)/layout.tsx`) so Framer Motion animates the glass card between routes. "Full glass"
  visual treatment.
- `app/(dashboard)/` — the authenticated app shell (`DashboardShell.tsx`) + all role dashboards
  and feature pages under `dashboard/…`. "Restrained" visual treatment.
- `app/public/office-hours/` — public read-only office-hours listing (no auth).
- `app/page.tsx` — public landing page (neo-brutalist; `components/landing/`).
- `app/welcome/` — a welcome experience (3D dioramas). Untracked/new scope.
- `app/api/auth/…` — the only server-side API routes: `register`, `login`, `logout`, `refresh`,
  `me`, `forgot-password`, `reset-password`.

**Layered structure of the code:**

| Layer | Location | Responsibility |
|---|---|---|
| Route/pages | `app/**` | Server + client components per route |
| Presentational components | `components/dashboard/`, `components/landing/`, `components/*` | Reusable UI (StatTile, BookingsTable, WeekSlotGrid, charts, modals) |
| Domain types | `lib/office-hours/types.ts`, `lib/auth/types.ts`, `lib/allocation/types.ts` | The client-side data contracts |
| Mock data layer | `lib/office-hours/mock-data.ts` | Stands in for every non-auth API; all list/detail data |
| Allocation domain logic | `lib/allocation/engine.ts`, `lib/prng.ts` | The real algorithms (§8) |
| Timetable parsing | `lib/timetable/parse-pdf.ts` | Client-side AAO PDF → structured busy blocks |
| Auth shim | `app/api/auth/**`, `lib/api-server.ts`, `lib/auth/*` | Cookie/session handling + backend-or-mock fallback |
| UI utilities | `lib/ui/*`, `lib/avatar.ts` | Status hues, accent palette, relative time, memoji avatars |

**Auth flow (as actually built):**

1. Client posts credentials to `app/api/auth/login/route.ts` (a Next.js Route Handler).
2. The route calls `apiFetch("/auth/login")` (`lib/api-server.ts`) against `API_BASE_URL`.
3. Because no backend answers, it **catches the error and falls back** to `findMockAccount()` over
   the three seeded accounts (student/lecturer/admin, all password `password123`).
4. On success it sets **httpOnly cookies** (`oh_access_token`, `oh_refresh_token`) via
   `lib/auth/session.ts`. Access token is app-wide; refresh token is path-scoped to `/api/auth`.
   `secure` only in production; `sameSite: lax`.
5. **Route gating** is done by `proxy.ts` (Next.js middleware): any path not in `PUBLIC_PATHS` and
   without an `oh_access_token` cookie is redirected to `/login?redirectTo=…`. Public paths: `/`,
   `/welcome`, `/login`, `/register`, `/public/office-hours`, `/forgot-password`,
   `/reset-password`, and `/api/auth/*`.

> Honest caveat for the architecture chapter: this is **cookie-presence gating, not real
> authorization.** The mock token is not verified/signed; RBAC (student vs lecturer vs admin) is
> enforced only by which mock account you logged in as and client-side role checks, not by a
> backend. NFR-4's "role-based authorization on every endpoint" is a design requirement.

### 4.B Designed (not built): the production backend

From `plan.md` §12 and the schema/API docs — describe as **proposed architecture / future work**:

- **Spring Boot modular monolith** with Auth/JWT, Scheduling & Conflict, Booking, Allocation, and
  Notification modules.
- **PostgreSQL + `btree_gist`** for the exclusion-constraint double-booking guard (§5).
- **Redis** for slot cache, waitlist queues, sessions.
- **SMTP** for email notifications; **Server-Sent Events** for in-app real-time.
- **Docker Compose** for dev parity + single-VM pilot deploy.

The deliberate architectural stances worth citing (all from `plan.md` §12): modular monolith not
microservices; SSE not WebSockets; no Kafka/CRDTs — simplicity matched to a 4-person team.

### 4.C Config decisions worth a sentence

- `next.config.ts` — `images.qualities: [75, 95]`; Next 16 clamps optimized image quality to
  `[75]` by default, so 95 is allowlisted for the auth-background gradient to avoid WebP banding.
- `tsconfig.json` — `strict: true`, `moduleResolution: "bundler"`, path alias `@/*`.
- `proxy.ts` — the middleware described above; note the matcher excludes static assets and 3D
  model files (`.glb`/`.gltf`).

---

## 5. Database schema summary

Full spec: `capstone-db-schema.md`. **Status: a proposed PostgreSQL DDL contract, never applied via
migration — no database exists in this repo.** Present it in the report as the *designed* data
model backing the (future) backend. It is nonetheless detailed and defensible.

**Engine/conventions:** PostgreSQL 15+, `btree_gist` extension required, `snake_case`, plural
tables, `timestamptz` throughout, `bigserial` PKs.

**19 tables**, grouped:

| Group | Tables |
|---|---|
| Identity & org | `users`, `password_reset_tokens`, `semesters` |
| Availability & conflict sources | `availability_rules`, `availability_exceptions`, `schedule_entries`, `schedule_imports`, `schedule_import_staging` |
| Slots & bookings | `slots`, `bookings`, `booking_participants`, `meeting_records`, `recurring_bookings` |
| Waitlist & allocation (research core) | `waitlist_entries`, `allocation_policies`, `allocation_events` |
| Research support | `synthetic_demand_runs`, `experiments` |
| Notifications | `notifications` |

**Core domain relationships (condensed ER):**

- `users` (role enum STUDENT/LECTURER/ADMIN) is the identity root; it owns availability rules,
  exceptions, schedule entries, bookings, waitlist entries, notifications.
- `semesters` scopes rules, schedule entries, and bookings; a partial unique index enforces exactly
  one active semester.
- `availability_rules` generate materialized `slots`; `slots` are booked as `bookings` and queued
  for via `waitlist_entries`.
- `schedule_entries` is a **deliberately generic busy-block table** holding both student classes and
  lecturer teaching, so conflict detection is one uniform overlap query regardless of role. Populated
  from AAO PDF imports (audited by `schedule_imports`, staged via `schedule_import_staging`).
- `bookings` has a 6-state lifecycle: PENDING → CONFIRMED / DECLINED; CONFIRMED → CANCELLED /
  COMPLETED / NO_SHOW.
- `waitlist_entries` feed `allocation_events`; `allocation_policies` (FCFS/NEED/ROUND_ROBIN/HYBRID,
  one active) are applied in those events.

**The two most defense-relevant schema ideas** (cite these even though unimplemented — they are the
strongest DB-design arguments):

1. **Double-booking prevention via a PostgreSQL `EXCLUDE USING gist` constraint** on
   `bookings (lecturer_id WITH =, time_range WITH &&) WHERE status = 'CONFIRMED'` — makes overlapping
   confirmed bookings *impossible at the storage layer*, even under concurrency, without app-level
   locking (NFR-2). Requires denormalizing `lecturer_id`/`time_range` onto `bookings` (populated by a
   `BEFORE INSERT` trigger) because `EXCLUDE` can't span a join. `capstone-db-schema.md` §3.2, §7.
2. **`allocation_events` as a reproducibility log** — every allocation run records policy, computed
   score, and random seed for *every* candidate (SELECTED *and* SKIPPED), so the fairness study can
   recompute Gini/variance over the full candidate pool and replay any decision (NFR-3).
   `capstone-db-schema.md` §4.3.

> Honesty flags already documented in the schema doc (§8) that the report should not paper over:
> the AAO import format is described three ways across docs (plan says CSV, schema/API say "AAO
> export", the shipped parser is **PDF-only**); `priority_score` vs `allocation_events.computed_score`
> relationship is unresolved; group-booking capacity enforcement can't be a plain CHECK. These are
> candid open questions, appropriate to mention as "known design gaps."

---

## 6. API surface summary

Full spec: `capstone-api-endpoints.md`. **Status: proposed REST contract; not implemented.** The
only server-side endpoints that actually run are the 7 auth Route Handlers under `app/api/auth/`
(login/register/refresh/logout/me/forgot-password/reset-password), and even those fall back to mock
accounts. Everything else in the API doc is a designed contract that the frontend currently
satisfies with `mock-data.ts` functions instead of network calls.

Designed base URL `http://localhost:8080/api/v1`; JWT bearer auth; RFC-7807 error bodies; Spring
Data pagination; roles STUDENT/LECTURER/ADMIN/SYSTEM.

**Functional groups (11):**

| § | Group | Representative endpoints |
|---|---|---|
| 1 | Auth & accounts | `/auth/login`, `/auth/register`, `/auth/refresh`, `/users/me`, `/users` (admin) |
| 2 | Semesters | `/semesters`, `/semesters/{id}/activate` |
| 3 | Availability | `/lecturers/{id}/availability-rules`, `/availability-exceptions` |
| 4 | Schedule import | `/users/me/schedule-imports`, `/schedule-imports/jobs/{id}/progress` (SSE), `/preview`, `/commit` |
| 5 | Slots & booking | `/lecturers/{id}/slots`, `/bookings`, `/bookings/{id}/confirm\|decline\|cancel\|complete\|no-show`, `/users/me/suggested-slots` |
| 5.1/5.2 | Group & recurring bookings | `/bookings/group`, `/bookings/recurring` |
| 6 | Waitlist | `/slots/{id}/waitlist`, `/waitlist/me`, `/waitlist/{id}/accept\|decline` |
| 7 | Allocation engine | `/allocation-policies`, `/slots/{id}/run-allocation`, `/slots/{id}/override`, `/allocation-events` |
| 7.1 | Research/experiments | `/research/synthetic-demand`, `/research/experiments`, `/research/experiments/{id}/export` |
| 8 | Notifications | `/notifications`, `/notifications/stream` (SSE) |
| 9 | Admin analytics | `/admin/analytics/advisor-load\|no-show-rate\|equity\|policy-comparison` |
| 10 | Public | `/public/office-hours` |

> Endpoint count: the doc lists roughly **70–80 endpoints** across these groups.
> `verify:` if you need an exact figure, tally the method/path rows in `capstone-api-endpoints.md`
> §1–§10 yourself rather than quoting a round number.
>
> The API doc is unusually candid about **frontend/contract mismatches** (field-name renames the
> API layer must do, notification-event catalogue gaps, `overriddenByName` vs `overridden_by`,
> import-history shape divergence). These are honest integration notes — useful to cite as evidence
> of design rigor, not as bugs.

---

## 7. Core feature inventory with evidence

From `PAGES-PROGRESS.md` (31/31 pages "shipped") cross-checked against the actual files. Status is
honest: **"UI-complete, not wired"** means the page renders and interacts against mock data but has
no real backend behind it — which, per §1, is true of *every* page except the auth flow's cookie
handling. The distinctions below are about how much *real logic* sits behind each surface.

| Feature | Page/file | Status & honest note |
|---|---|---|
| Landing page | `app/page.tsx`, `components/landing/*` | Done (marketing surface, static content) |
| Public office-hours listing | `app/public/office-hours/page.tsx` | Done; data from `getMockOfficeHours()` |
| Register / Login | `app/(auth)/register`, `login` | Done; **auth is mock-account fallback** (§4.A) |
| Forgot / reset password | `app/(auth)/forgot-password`, `reset-password` | Done UI; token flow has API routes but no real mail/DB |
| Profile | `dashboard/profile/page.tsx` | Done; mock profile + memoji avatar picker |
| Notifications center | `dashboard/notifications/page.tsx` | UI done (list/mark-read/filter); **SSE is stubbed with a visible "soon" affordance, not faked** |
| My Bookings | `dashboard/bookings/page.tsx` | Done; role-dependent view over mock bookings |
| Booking detail | `dashboard/bookings/[id]/page.tsx` | Done; timeline + role actions + meeting-record card |
| Browse lecturers | `dashboard/lecturers/page.tsx` | Done; search + department filter over mock lecturers |
| Lecturer slot picker | `dashboard/lecturers/[id]/slots/page.tsx` | Done; weekly grid, **conflict-marked in JS against the student's own mock bookings** (not a DB constraint) |
| Book a slot | `components/dashboard/BookSlotModal.tsx` | Done UI |
| Group booking | `components/dashboard/ParticipantManager.tsx` | **UI-complete, not wired**; add-by-email flow doesn't match the `student_id` schema (open question) |
| Recurring booking | `dashboard/bookings/recurring/page.tsx` | **UI-complete, preview-only; no recurrence engine** |
| My waitlist | `dashboard/waitlist/page.tsx` | Done UI; accept/decline over mock entries |
| Import my timetable (#32) | (planned tab on `dashboard/schedule`) | **Not built** — net-new scope beyond the 31 pages |
| Availability rules & exceptions | `dashboard/availability/page.tsx` | Done UI (Rules/Exceptions/Waitlist tabs) |
| My schedule (busy blocks) | `dashboard/schedule/page.tsx` | **Partial (`[~]`)** — read-mostly; self-import affordance planned |
| Admin: users | `dashboard/admin/users/page.tsx` | Done UI (search/filter/inline edit/deactivate) |
| Admin: semesters | same route, tab | Done UI |
| Admin: schedule import | `dashboard/admin/schedule/page.tsx` | Done UI; **real client-side PDF parse** via `lib/timetable/parse-pdf.ts`, but import-history is mocked and `getMockMyScheduleImportHistory()` returns `[]` |
| Admin: manual entry / slot search | same route, tabs | Done UI |
| Allocation policies | `dashboard/admin/allocation/page.tsx` | Done UI; register/activate/delete + weight config; **any admin can override with no department check** (open question) |
| Allocation events audit log + manual override | same route, tabs | Done UI over mock events |
| Analytics dashboard | `dashboard/admin/analytics/page.tsx` | Done; **charts driven by the real `simulatePolicy()` engine** (Gini, Lorenz, policy comparison) |
| Research tools | `dashboard/admin/research/page.tsx` | Done; **real seeded experiment runner** (demand-run config, frontier scatter, JSON/CSV export) |

**Bottom line for the report:** the *frontend* is genuinely complete and coherent. The *only*
non-trivial backend-grade logic that actually executes is the allocation engine and its simulation
(§8) plus the client-side PDF timetable parser. Everything else is presentation over `mock-data.ts`.

---

## 8. The strongest academic contribution: the allocation engine

**This is the defensible, non-trivial, original-ish work. Build the report's research chapters
around it.** Full reference: `docs/allocate-engine.md`. Verified against source: `lib/allocation/engine.ts`,
`lib/prng.ts`, and `simulatePolicy()`/`giniCoefficient()` in `lib/office-hours/mock-data.ts`.

### 8.1 What it is

A deterministic, reproducible **slot-allocation engine** implementing one interface —
`allocate(candidates, policyName, config, seed, now) → winner + per-candidate scores` — across four
interchangeable policies, plus a fairness/efficiency **simulation layer** that replays a seeded
synthetic population through the engine and computes equity metrics. This directly realizes the
research objective R1 and the research question in `plan.md` §11.

### 8.2 The four policies (formulas verified against `engine.ts`)

Two shared signals, each normalized to `[0,1]`: **need(c)** = `clamp01(daysSinceLastMeeting /
NEED_CAP_DAYS)` with `NEED_CAP_DAYS = 90` (fallback: this-lecturer → any-lecturer → max need);
**wait(c)** = `clamp01(hoursWaiting / WAIT_CAP_HOURS)` with `WAIT_CAP_HOURS = 168` (one week). The
caps prevent a single outlier from dominating regardless of weights.

1. **FCFS** — pure arrival order; earliest `requestedAt` wins (ties by `waitlistEntryId`). Score
   `1 − rank/(n−1)` exists only to report a comparable `[0,1]` number. The literature baseline /
   control condition.
2. **NEED** — `score = (needWeight·need + waitWeight·wait)/(needWeight+waitWeight)`. Seeded default
   `needWeight=1, waitWeight=0` = pure need-ranking; weights are admin-tunable. The fairness-forward
   policy.
3. **ROUND_ROBIN** — an **eligibility gate, not a ranking**: candidates with
   `recentAccessCount ≥ maxPerWindow` (default 1) are excluded outright; among the rest, FCFS
   decides. If *everyone* is over cap, `winner = null` (slot goes unfilled — validated, no
   least-bad fallback). Prevents monopolization.
4. **HYBRID** — `score = (needWeight·need + waitTimeWeight·wait + fairnessWeight·rand)/Σweights`,
   seeded default `0.5/0.3/0.2`. `rand` is a **deterministic per-candidate draw** from
   `mulberry32(seededHash(seed, waitlistEntryId))` — reproducible to the system but unpredictable to
   a student trying to game tie-breaks. This tunable blend is the paper's claimed novel contribution.

### 8.3 Why it's academically defensible

- **Reproducibility (NFR-3)** is real and mechanized: `lib/prng.ts` provides `mulberry32` (a pure
  PRNG that never touches `Math.random()`, safe under React-Compiler purity rules) and `seededHash`
  (per-candidate sub-seeds, so reordering the candidate array can't change the winner). Same
  `(candidates, policy, config, seed)` ⇒ same winner, always.
- **Validation (real, citable):** 11 selection-logic checks pass (FCFS picks earliest; NEED picks
  highest-need; ROUND_ROBIN excludes over-cap even when earliest, returns null when all capped;
  HYBRID reproducible; all scores stay in `[0,1]` under extreme inputs; empty pool → null, no crash).
  Separately, `giniCoefficient()` is validated against five families of known cases (perfect
  equality → 0; winner-take-all → `(n−1)/n`; textbook `[10,20,30,40]` → 0.25; arithmetic progression
  → `(n−1)/3n`; empty/zero → 0) **and** cross-checked against an independently-derived
  mean-absolute-difference formula across **500 random trials with 0 mismatches**. Source:
  `allocate-engine.md` §6.
- **From one decision to a policy comparison:** `simulatePolicy()` runs a bounded agent-based
  micro-simulation — `SIM_STUDENTS=60`, `SIM_LECTURERS=12`, `SIM_EVENTS=240`, per-student popularity
  affinity `rand()^(1/popularitySkew)`, state (days-since-last-meeting, recent-access) carried across
  events, a modeled 12% offer-decline rate — then derives Gini(slots/student), Gini(lecturer-access),
  max–min ratio, %-students-with-slot, utilization, avg wait, wait-time variance, offer-rejection
  rate. These are computed from real simulated outcomes; a "fairer" policy in the UI means the
  scoring formulas genuinely produced a more equal distribution, not a hard-coded number.

### 8.4 The honest scope boundary (state this in the report)

`simulatePolicy()` is a **genuine simulation but intentionally bounded**: fixed population/event
counts regardless of the configured `SyntheticDemandRun.numStudents/numLecturers`, so it runs
client-side in under a frame. It is **not** the full server-side demand generator `plan.md` §11.4
describes for a real pilot, and there is **no pilot deployment data**. So the "Results" chapter
reports *simulation* results, and the trade-off frontier is a *modeled* result — legitimate and
reproducible, but not an empirical field study.

---

## 9. Known limitations / honesty section

Compile this into the report's limitations/future-work chapter. Every item is pulled from the code
or the docs' own admissions — quote them; they protect your credibility.

1. **No backend exists.** Spring Boot, PostgreSQL, Redis, SMTP, Docker are *designed* (`plan.md`
   §12–13, the schema/API docs) but not implemented. The app runs as a frontend over mock data.
2. **Auth is a mock-account fallback**, not real authentication. `lib/auth/mock-accounts.ts` header:
   *"the Spring Boot backend doesn't exist yet… Delete this file… once real auth is live."* No
   password hashing, no signed JWT, no DB-backed sessions. RBAC is client-side + which mock you
   logged in as.
3. **The database is a paper design.** The DDL in `capstone-db-schema.md` was never applied via
   migration. The headline correctness guarantee — the `EXCLUDE`/`btree_gist` double-booking
   constraint (NFR-2) — **does not run anywhere**; conflict detection in the UI is a JavaScript
   overlap check over mock bookings.
4. **The API contract is unimplemented** except the 7 auth routes, and even those fall back to mock.
5. **Several "shipped" pages are UI-complete-not-wired:** group booking (schema/UI mismatch),
   recurring booking (preview-only, no recurrence engine), notifications SSE (stubbed with a "soon"
   affordance), schedule import history (`getMockMyScheduleImportHistory()` returns `[]`), and
   `#18 My Schedule` is marked partial `[~]`. Source: `PAGES-PROGRESS.md`.
6. **The fairness simulation is bounded** (fixed 60/12/240) and client-side — not the server-side
   generator planned for a real study, and there is **no pilot/field data** (`allocate-engine.md` §7).
7. **No formal user evaluation.** No lecturer interviews conducted (the guide in `plan.md` §17 is
   marked "do this week"), no usability testing, no deployed pilot. The problem statements in
   `plan.md` §2 are explicitly framed as *unvalidated hypotheses*.
8. **No committed automated test suite** (no test framework in `package.json`); engine validation
   was via standalone scripts.
9. **Documented internal inconsistencies the docs themselves flag:** AAO import format
   (CSV vs PDF vs generic) across three docs; `priority_score` vs `computed_score`; override
   authorization scope defaulting permissively from the frontend; notification event-catalogue gaps.
   These are honest open questions, not hidden defects — cite them as such.
10. **Some scope is decorative, not domain logic** — the `three.js` 3D dioramas
    (`FacultyOfficeDiorama`, `LectureHallDiorama`, `WelcomeExperience`) are presentational polish,
    not part of the scheduling/allocation system.

---

## 10. Suggested diagrams / artifacts to include

Several diagrams already exist as Mermaid in the docs — you can lift or redraw them:

| Artifact | Source / how to produce | Report chapter |
|---|---|---|
| Use-case diagram (3 actors + system) | `plan.md` §6 (Mermaid) | Requirements |
| ER diagram (19 tables) | `plan.md` §10 / `capstone-db-schema.md` (Mermaid `erDiagram`) | Database Design |
| Booking sequence diagram (conflict-aware) | `plan.md` §9.1 (Mermaid `sequenceDiagram`) | System Design |
| Waitlist-allocation sequence diagram | `plan.md` §9.2 | Research/Design |
| Booking state machine (6 states) | `plan.md` §9.3 (Mermaid `stateDiagram`) | Design/Implementation |
| System architecture diagram | `plan.md` §12 (Mermaid `graph`) — label backend as "designed" | Architecture |
| Route map / folder-architecture tree | Derive from §4.A above | Implementation |
| Allocation-policy formula table | `allocate-engine.md` §4 / §8.2 above | Research |
| Fairness-vs-efficiency frontier plot | Screenshot `dashboard/admin/research` (real recharts output) | Results |
| Gini / Lorenz + policy-comparison small multiples | Screenshot `dashboard/admin/analytics` | Results |

**Screenshots worth capturing (real, running pages):** landing (`/`); login glass card
(`/login`); student dashboard home (`/dashboard`); lecturer slot picker
(`/dashboard/lecturers/[id]/slots`); weekly timetable grid + agenda (`/dashboard/schedule`);
allocation policies + events (`/dashboard/admin/allocation`); analytics
(`/dashboard/admin/analytics`); research tools (`/dashboard/admin/research`); public listing
(`/public/office-hours`). Log in with the seeded accounts (`{student,lecturer,admin}@officehours.dev`
/ `password123`) to reach role-specific views.

---

## 11. References / citations starter

No real papers are bundled; the codebase describes standard techniques. A References chapter should
cite the general literature behind each — flagged here by topic, not with specific citations:

- **Fair resource allocation / mechanism design / matching markets** — the framing of R1
  (`plan.md` §11.5 explicitly positions this as an *applied* comparison in an established field).
- **Scheduling policies** — FCFS, round-robin, and priority scheduling are textbook operating-systems
  / queueing-theory concepts; cite a standard OS or scheduling reference for the baselines.
- **The Gini coefficient** as an inequality/equity measure — cite its standard economics definition;
  the report uses the rank-based formula, cross-checked against the mean-absolute-difference
  definition (`allocate-engine.md` §6).
- **Pseudo-random number generation / reproducible experiments** — `mulberry32` is a known small
  PRNG; cite general PRNG/reproducibility-in-simulation literature for the seeding methodology.
- **PostgreSQL exclusion constraints / `btree_gist`** — cite the PostgreSQL documentation for the
  double-booking guard design (NFR-2).
- **Agent-based simulation** — for the `simulatePolicy()` methodology, cite standard agent-based /
  discrete-event simulation references.

> The report should describe *what each technique is and why it was chosen*, then cite the standard
> literature for it — you are doing a rigorous applied comparison, not inventing the algorithms.

---

*Guide compiled from: `package.json`, `next.config.ts`, `tsconfig.json`, `proxy.ts`,
`lib/allocation/engine.ts`, `lib/prng.ts`, `lib/office-hours/mock-data.ts`, `lib/auth/*`,
`lib/api-server.ts`, `lib/env.ts`, and `docs/{capstone-officehours-plan, capstone-db-schema,
capstone-api-endpoints, DESIGN, PAGES-PROGRESS, DASHBOARD-UPGRADE, allocate-engine}.md`. Where a
figure could not be verified from source it is marked `verify:`.*
