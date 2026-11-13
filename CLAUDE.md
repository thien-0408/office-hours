# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

`AGENTS.md` (imported above) points to `CODEX.md` — its scope/verification defaults apply here too:
smallest complete change, don't run builds/lint/tests or start servers unless asked, don't commit
unless asked. Read the relevant `node_modules/next/dist/docs/` guide before Next.js code (Next 16
differs from training data) and `docs/DESIGN.md` before any UI/CSS. Pages built or refactored in the new Mochy style
(dark-first, light and dark themes) follow `docs/STYLE-MOCHY-WEB.md` instead of the older `DESIGN.md` sections.

## Project map

This repo is one of three. See `docs/PROJECT-HUB.md` for the others, `docs/CONVENTIONS.md` for shared rules, and tick tasks in `docs/WEB-CHECKLIST.md`.

## Commands

```bash
bun install      # Bun is the package manager (bun.lock); don't use npm/yarn/pnpm
bun run dev      # http://localhost:3000
bun run build
bun run lint     # ESLint 9 flat config (eslint.config.mjs)
```

There is no test runner or test suite in this repo. `NEXT_PUBLIC_API_BASE_URL` (e.g.
`http://localhost:8080/api/v1`, no trailing slash) must be set in `.env.local`; `lib/env.ts` throws
at import if it's missing, and since it's inlined at build time a rebuild is needed after changing it.

## Architecture

Next.js 16 App Router frontend (React 19, Tailwind v4, shadcn-style components on `@base-ui/react`)
for **OfficeHours**, an EIU capstone that books student–advisor office hours. The backend is a
separate Spring Boot service; its contract lives in `docs/capstone-api-endpoints.md`,
`docs/capstone-db-schema.md`, and `docs/BACKEND-API-GUIDE-VI.md`. Project scope and the fairness
research design are in `docs/capstone-officehours-plan.md`.

- **Backend access** — the browser calls Spring Boot directly (no BFF, no Next route handlers, no
  middleware/proxy). All requests go through `apiFetch` in `lib/api-client.ts`: attaches the bearer
  token, does a single shared refresh on 401 (deduplicated across concurrent requests), throws
  `ApiError` carrying the backend's `ProblemDetail`. Pass `auth: false` for public endpoints (the only
  case usable from Server Components).
- **Auth** — tokens are stored in `localStorage` (`lib/auth/token-storage.ts`); `lib/auth/auth-context.tsx`
  exposes `useAuth()`. Because the server can't see tokens, `app/(dashboard)/layout.tsx` is a
  client-side gate that redirects to `/login?redirectTo=…`; the backend does the real authorization.
  User IDs are UUIDs; roles are `UserRole` in `lib/auth/types.ts`.
- **Route groups** — `app/(auth)` (glass-styled auth forms), `app/(dashboard)/dashboard/*` (app shell
  via `components/dashboard/DashboardShell.tsx`, including `admin/*` pages), `app/public/office-hours`
  (public read-only view), `app/page.tsx` landing page built from `components/landing/*`.
- **Mock data** — only auth and the public office-hours page hit the real backend so far. Most
  dashboard pages still render from `lib/office-hours/mock-data.ts` + `lib/office-hours/types.ts`;
  wiring a page to the backend means replacing those imports with `apiFetch` calls.
- **Allocation engine** — `lib/allocation/engine.ts` implements the fair-allocation policies (FCFS,
  need-based, round-robin, …) described in `docs/capstone-officehours-plan.md` §11.2, deterministic
  via the seeded PRNG in `lib/prng.ts`. Not yet imported by any page.
- **i18n** — custom, no library. Locale (`en`/`vi`) comes from the `NEXT_LOCALE` cookie
  (`i18n/server.ts` `getLocale()` on the server, `useI18n()`/`t()` from `i18n/provider.tsx` on the
  client). `i18n/messages/en.ts` defines `MessageKey`; add every new key to both `en.ts` and `vi.ts`.
  Switching locale reloads the page.
- **UI building blocks** — primitives in `components/ui/` (shadcn, config in `components.json`);
  status colors come from `lib/ui/status-hues.ts` / `components/StatusBadge.tsx` per `docs/DESIGN.md`.
  Path alias `@/*` maps to the repo root.
- **Timetable import** — `lib/timetable/parse-pdf.ts` parses university timetable PDFs client-side
  with `pdfjs-dist`.
