# OfficeHours

A university-aware scheduling platform that lets students book time with advisors —
without the email threads. Built as a CSE capstone at Eastern International University (EIU).

Unlike generic tools (Calendly, Google Calendar slots), OfficeHours understands class
schedules, semesters, and lecturer availability, so it (a) prevents scheduling conflicts
automatically and (b) allocates scarce office-hour slots **fairly** when demand outstrips
supply. The fairness study is the research core of the capstone — see
[`docs/capstone-officehours-plan.md`](docs/capstone-officehours-plan.md).

## This repository

This is the **Next.js frontend**. It talks to a separate **Spring Boot** backend over REST.
The browser calls the backend directly (no BFF, no Nginx): `lib/api-client.ts` sends the access
token as `Authorization: Bearer …`, refreshes it once on a `401`, and the access/refresh tokens are
kept in `localStorage`. The backend must allow this app's origin via CORS.

### Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS v4 |
| Motion | Framer Motion |
| Graphics | Three.js, Rough.js (landing-page visuals) |
| Backend | Spring Boot (separate repo/service) |

## Getting started

Requires Node.js and a running backend.

```bash
npm install

# point the app at the Spring Boot backend
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1" > .env.local

npm run dev          # http://localhost:3000
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

### Environment

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | yes | Full Spring Boot API prefix, without a trailing slash (e.g. `http://localhost:8080/api/v1`). Inlined at build time — rebuild after changing it. |

## Project structure

```
app/
  (auth)/                  Login, register, forgot- & reset-password (shared glass layout)
  (dashboard)/             Authenticated app shell; layout redirects to /login without a user
  public/office-hours/     Public read-only "office hours this week" view
  page.tsx                 Landing page
lib/
  api-client.ts            Fetch wrapper for the backend (bearer token + one refresh retry)
  auth/                    localStorage token storage, auth context, types
  office-hours/            Types + mock data
  env.ts                   Validated environment access
docs/                      Capstone plan, API endpoints, DB schema, design system
```

## Design system

UI work must follow [`docs/DESIGN.md`](docs/DESIGN.md) — it defines the color tokens,
typography, and the treatment split (full-glass auth pages vs. restrained app shell vs.
editorial landing page). Use the existing tokens and status-to-hue mapping; don't invent
new colors or ad hoc badge colors.

## Documentation

- [`docs/capstone-officehours-plan.md`](docs/capstone-officehours-plan.md) — full project plan, scope, and research design
- [`docs/capstone-api-endpoints.md`](docs/capstone-api-endpoints.md) — backend API surface
- [`docs/capstone-db-schema.md`](docs/capstone-db-schema.md) — database schema
- [`docs/DESIGN.md`](docs/DESIGN.md) — design system
