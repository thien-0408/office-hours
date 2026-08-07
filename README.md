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
Auth tokens are handled server-side: browser-facing routes under `app/api/auth/*` proxy the
backend and store the access/refresh tokens in `httpOnly` cookies, so JWTs never reach client
JavaScript.

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
echo "API_BASE_URL=http://localhost:8080" > .env.local

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
| `API_BASE_URL` | yes | Base URL of the Spring Boot backend (e.g. `http://localhost:8080`) |

## Project structure

```
app/
  (auth)/                  Login, register, forgot- & reset-password (shared glass layout)
  api/auth/                Server routes proxying the backend; set httpOnly session cookies
  public/office-hours/     Public read-only "office hours this week" view
  page.tsx                 Landing page
lib/
  api-server.ts            Server-only fetch wrapper for the backend
  auth/                    Session cookies, auth context, types
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
