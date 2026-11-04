# Handoff: OfficeHours mobile app, hybrid backend, campus GPS

Written 2026-11-03 to continue this work in a new chat session. It records what was decided, what exists, and what is next.

**Changed on 2026-11-04:** chat now runs over backend WebSocket with Postgres, not Firestore. QR check-in (F7, `qr_secret`, `check_in_method`, the check-in and QR endpoints) is dropped: the lecturer confirms the meeting from the chat. `OfficeHours/BACKEND-PLAN.md` and `MOBILE-PLAN.md` are current where they differ from this file.
Verify file and branch details against the repos before relying on them; this is a snapshot.

## 1. Goal

Build a React Native mobile version of **OfficeHours** (EIU capstone: students book office hours with lecturers, with fair allocation when slots are oversubscribed) and use it as the project for **CSW434 Advanced Mobile Programming**, while sharing one backend and one Postgres database with the capstone.

## 2. Key decisions

| Decision | Outcome | Status |
|---|---|---|
| Database approach | **Hybrid:** Postgres is the single source of truth, Firebase is the realtime layer | Confirmed with the CSW434 lecturer, per the user: "you can apply the hybrid method" |
| Number of backends | **One:** the existing Spring Boot backend. No separate mobile backend | Decided |
| Repos | Web, backend and mobile each have their own repo | Mobile repo not created yet |
| Backend base branch | `feature/auth` (modular monolith), not `develop` | Decided by the user |
| Auth model | "Simple auth" per the updated docs: bearer JWT, refresh rotation, no BFF, no Nginx, no cookies, no numeric error codes | Applied on the backend branch |
| Web package manager | Bun | Applied in `CLAUDE.md` and `README.md` |
| GPS feature | Campus only, own 3D map, foreground only, free tools | Plan written (section 8). Three decisions open (section 10) |

Still worth asking both instructors: whether reusing the capstone system in another course is allowed. Only the hybrid database was reported as confirmed. Keep the CSW434 parts (Firebase, AI, realtime, GPS) identifiably separate.

## 3. Locations

| What | Path | Remote |
|---|---|---|
| Web frontend (Next.js 16) | `C:\Users\nguye\OneDrive\Máy tính\Capstone\office-hours` | origin `main` |
| Backend (Spring Boot) | `C:\Users\nguye\OneDrive\Máy tính\Capstone\offfice-hours-backend\office-hours` (note "offfice", Maven project in `OfficeHours/`) | `https://github.com/chaunhattang/office-hours.git` |
| Course material | `C:\Users\nguye\OneDrive\Máy tính\Q12627\CSW434` (`Project/Project Requirements.pdf`, `Materials/`) | |
| Course labs (React Native reference) | `...\Q12627\CSW434\CSW434-AdvancedMobile` (Lab 1: RN 0.88 CLI + Socket.IO) | `github.com/thien-0408/CSW434-AdvancedMobile` |
| API and DB contract | `docs/capstone-api-endpoints.md`, `docs/capstone-db-schema.md`, `docs/BACKEND-API-GUIDE-VI.md`, `docs/capstone-officehours-plan.md` in the web repo | |

## 4. Current repo state (2026-11-03)

**Web repo**
- On branch `docs/claude-md-bun`, commit `b800426` (`CLAUDE.md` guidance and bun). Not merged to `main`, not pushed. To merge: `git checkout main && git merge docs/claude-md-bun`.
- Uncommitted and not made by Claude: `.gitignore` (adds `/graft/`), untracked `.ignore`. Probably from the graft tool; the user should look before committing.
- This handoff file is new and uncommitted.

**Backend repo**
- On `feature/realtime-hybrid`, pushed to origin, head `fbfcd6e`, based on `feature/auth` at `6663980`:
  - `3050959` refactor(error): simplify error contract to status + key
  - `a772b34` feat(security): align CORS and token TTLs with API contract
  - `485d44d` feat(realtime): scaffold Firebase realtime module
  - `fbfcd6e` docs: document hybrid realtime architecture
- No PR opened. Untracked `graft/` cache. GitHub Desktop stashes on `develop` and `main` were left alone.
- `develop` (Chau Nhat Tang's layered layout) and `feature/auth` (the user's modular monolith with Spring Modulith and Flyway) **conflict heavily and are not merged** (about 217 files differ). The team has to reconcile this; the new branch follows `feature/auth`.

**Mobile repo:** does not exist yet.

## 5. CSW434 project requirements

From `Project/Project Requirements.pdf`:
- Group of 2-3 students; "each student must complete all requirements independently" (wording is worth clarifying).
- Topic: realtime applications or large-scale data.
- **At least 20 screens** (login/sign-up, profile, realtime dashboard, large list view, notifications, settings, admin panel, search/filter, live data details, help/about...).
- **Realtime APIs** that are bidirectional and optimised for bandwidth and large data (Firebase RTDB, Firestore, WebSocket, GraphQL subscriptions, Realm, AWS, Azure).
- **Database:** "Use Firebase as the main database", with Firestore or Realtime Database. The hybrid approach was accepted against this line.
- **Performance:** Firebase queries with filters, indexing and pagination; minimise latency; lazy loading, batch processing, caching; **Firebase Performance Monitoring**.
- **At least 2 AI features** integrated meaningfully (Gemini, OpenAI, TensorFlow Lite, Hugging Face...).
- **Presentation** of 10-15 slides: intro, technology, architecture, features, performance optimisation, results, future work, references.

Materials: Chapter 1 native code, 2 gesture handler, 3 Android sensors, 4 list performance, 5 Firebase ML Kit, 6 Firebase / Realtime Database / FCM / WebSocket. Slides use `@react-native-firebase/*`. Only the requirements PDF and the Realtime Database/FCM and WebSocket slides were read; the rest is known by title only.

### How OfficeHours maps to the requirements

| Requirement | Plan |
|---|---|
| Realtime topic | Live slot availability, waitlist moves, booking status, student-lecturer chat, lecturer presence |
| 20+ screens | The web app has about 25 routes to mirror, plus Settings, Help/About, Chat, Search and about 6 GPS screens |
| Firebase as main DB | Firestore copies plus Firebase-owned chat and presence |
| Lists and caching | FlatList tuning (Chapter 4), cursor pagination, Firestore offline cache |
| Monitoring | `@react-native-firebase/perf`, custom traces |
| AI feature 1 | Scan a timetable photo with ML Kit text recognition (Chapter 5), matching the web PDF import |
| AI feature 2 | LLM summary of meeting notes, or slot recommendation |

## 6. Hybrid architecture

```
Next.js web ─┐                        ┌─► PostgreSQL  (source of truth: users, slots, bookings, allocation...)
             ├─► Spring Boot REST ────┤
RN mobile ───┘   (JWT, all writes)    └─► Firebase Admin SDK, after each commit
      │                                    ├─ Firestore: read-only copies (slot availability, booking status, notifications)
      │                                    ├─ Firestore: chat/presence (written by the mobile app, Firebase-owned)
      └─ Firestore listeners, FCM push, Performance Monitoring, ML Kit
```

Rules:
1. Every core write goes through Spring Boot into Postgres. The web app and the capstone's fairness research are unaffected.
2. Changes are copied to Firestore **after commit**, never as a two-database write. If Firestore lags, Postgres is still right, and a re-sync job can rebuild the copies. Clients only read these copies (enforced by security rules).
3. Firebase owns some domains outright: chat, typing indicators, online status. This is the answer to "why isn't Firebase just a cache?".
4. One login: Spring Boot issues its JWT and also mints a Firebase custom token for the same user UUID, so security rules can use `request.auth.uid`.
5. Push goes through FCM.

### Why one backend

A second backend would either write the same tables (duplicated business rules, two services changing the schema, possible double-booking) or be a pass-through proxy (extra hop, second login system). The copy step must run where the writes happen.

Separability inside one backend: all Firebase code in `eiu.officehours.realtime`, off by default, with `feat(realtime): ...` commits. Mobile-only features live in the RN app. If a lecturer ever requires full separation, use Firebase Cloud Functions rather than a second Spring app.

## 7. Backend: what exists on `feature/realtime-hybrid`

Stack: Spring Boot 4.1.1, Java 17, Spring Modulith, JPA, Postgres, Flyway, JWT. Read `OfficeHours/ARCHITECTURE.md` first.

**Simple auth**
- Errors: `{ status, error, message, path, timestamp, details? }`, no numeric `code`. Validation: 400 `VALIDATION_FAILED` with `details.errors[{ field, error, message }]`. Several business errors: 400 `MULTIPLE_ERRORS`. `ErrorCodeValidator` became `ErrorKeyValidator` (duplicate-key check only).
- CORS: `CORS_ALLOWED_ORIGINS` (dev `http://localhost:3000`), headers `Authorization, Content-Type, Idempotency-Key, Accept-Language`, no credentials.
- Access token default 15 minutes (900000 ms). The tracked `OfficeHours/.env` `JWT_EXPIRATION_IN_MS` was changed from 86400000 to 900000.
- Already matching the docs: auth routes, `/users/me`, hashed refresh rotation (30 days), reuse revokes all sessions, logout 204, forgot-password always 202. `/auth/reset-password` returns 204.

**`eiu.officehours.realtime` module (scaffold)**
- `firebase-admin` 9.11.0. `app.firebase.enabled` defaults to false; `credentials-path` and `project-id` come from env vars (`FIREBASE_ENABLED`, `FIREBASE_CREDENTIALS_PATH`, `FIREBASE_PROJECT_ID`, which is optional).
- Public API: `RealtimePublisher`, events `RealtimeProjectionRequested` and `RealtimeProjectionRemoved`, `RealtimeError`.
- Disabled: logging no-op publisher, no Firebase beans. Enabled: Firestore and FCM implementation.
- After-commit listener logs failures and never breaks the original request.
- `sendPush` targets FCM topic `user-<uuid>`, so the mobile app must subscribe to that topic after sign-in. No device-token table yet.
- `POST /realtime/firebase-token` returns `{ firebaseToken }`; 503 `REALTIME_DISABLED` when off, 502 `REALTIME_UPSTREAM_FAILED` if Firebase fails.
- `.gitignore` blocks service-account JSON files.

**Verification so far**
- Passed: compile, `ModularityTests`, `ErrorKeyValidatorTest`, `ErrorCollectorTest`, `ValidationErrorFactoryTest`, `RealtimeProjectionListenerTest`, `FirebaseTokenServiceTest`, `FirebaseWiringTest`.
- **Not run:** all Testcontainers integration tests (`AuthFlow`, `AggregatedErrors`, `SecurityErrors`, `UserAdmin`, `UserProfile`, `Realtime`), because Docker was unavailable. Someone with Docker must run `./mvnw test` before merging.
- Never run with Firebase actually enabled; no credentials yet.

**Not built:** booking, slot and other domain services, chat, device tokens, any real projection.

## 8. GPS tracking plan (mobile)

**Feasibility:** free and possible. Phone GPS is about 3-10 m outdoors and cannot reliably give a room or floor, so design for "where on campus" plus a door check-in. Free parts: on-device GPS, Blender or extruded outlines, OpenStreetMap outlines (needs attribution), Three.js, Firebase Spark plan. No map tiles needed.

**Scope:** foreground only, opt-in, limited to office-hour context. Postgres holds rooms and attendance. Firebase Realtime Database holds live positions (billed by bandwidth, has `onDisconnect()`). Positions are never stored in Postgres.

### Features

| # | Feature | Who | Summary |
|---|---|---|---|
| F1 | Consent and settings | All | Explanation screen, while-in-use permission, share switch, delete-data button |
| F2 | Location engine | All | Drop readings worse than about 25 m, smooth, convert to campus metres, detect building |
| F3 | Floor estimate | All | Barometer after ground-floor calibration; manual override |
| F4 | 3D campus map | All | Buildings, own dot with accuracy circle, visible dots, tap building, follow camera |
| F5 | Lecturer presence | Lecturer, Student | In office / On campus / Away, only during their slots or when switched on |
| F6 | Directions | Student | A* over walkway graph, drawn in 3D, distance and time |
| F7 | Arrival check-in | Student | Entering the building during the booking prompts a door QR scan; backend marks attendance |
| F8 | Live meeting view | Lecturer | Student is on campus / in building / checked in |
| F9 | Campus activity (stretch) | Admin | Anonymous check-in count per building; can serve as the realtime dashboard |

### Coordinates

```
x = (lng - lng0) * 111320 * cos(lat0)
z = (lat - lat0) * 110540
```

Build the 3D model in the same metres. Require 2 consecutive readings inside a building before counting it. Show accuracy instead of implying an exact dot.

### Data

Bundled `campus.json`: origin, campus boundary, buildings (`code, name, outline, floors, floorHeight`), walkway graph, `.glb` model.

Postgres (new Flyway migration; the current schema has no office or room location):

```sql
CREATE TABLE campus_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_code varchar(20) NOT NULL,
  floor smallint NOT NULL,
  name varchar(50) NOT NULL,
  x_m real, z_m real,
  qr_secret text NOT NULL
);
ALTER TABLE lecturer_profiles ADD COLUMN office_room_id uuid REFERENCES campus_rooms(id);
ALTER TABLE meeting_records ADD COLUMN check_in_at timestamptz,
                            ADD COLUMN check_in_method varchar(10); -- 'QR' | 'MANUAL'
```

Firebase Realtime Database:

```
/presence/{uid}                 { status, building, floor, x, z, acc, updatedAt }   lecturers only
/bookingLive/{bookingId}/{uid}  { building, floor, x, z, acc, updatedAt }           only during the booking window
/activeBookings/{bookingId}     { studentId, lecturerId, startAt, endAt }           written by the backend only
```

Rules: users write only their own `uid`; `/presence` is writable only by `LECTURER` and readable when signed in; `/bookingLive/{id}` is limited to that booking's two people, from `startAt` to `endAt + 15 min`. Use `onDisconnect().remove()`; the backend deletes `/bookingLive/{id}` when the booking ends.

### Mobile stack

React Native CLI with TypeScript (like Lab 1), `install-expo-modules` for `expo-gl`; `react-native-geolocation-service`; `react-native-sensors`; `three`, `@react-three/fiber/native`, `expo-three`; `react-native-vision-camera`; `@react-native-firebase/app`, `auth`, `database`, `perf`; pure TypeScript `geo.ts` tested with Jest. Library compatibility with RN 0.88 has not been checked.

Update rate: about 2 s with the map open, 10 s with sharing on and the map closed, none in the background. Throttle Firebase writes to one per 5 s, or immediately on moving more than 5 m or changing building.

### Backend work needed

1. Migration above plus seed rooms.
2. `GET /campus/rooms`, and `officeRoom` in `GET /lecturers/{id}`.
3. `POST /bookings/{id}/check-in` with `{ qrPayload }`: caller is the booking's student, time within the window give or take 15 minutes, QR signature matches the office room; upsert `meeting_records`; safe to repeat. Depends on the unbuilt booking module.
4. Publish and remove `/activeBookings/{id}` through the after-commit listener. Note: the current publisher targets Firestore and FCM, so a Realtime Database write path has to be added.
5. `GET /admin/campus-rooms/{id}/qr` for printable HMAC-signed `{ roomId, version }` codes.

### Phases (about 4-5 weeks for one developer)

| Phase | Work | Done when |
|---|---|---|
| P0 Survey, 2-3 days | Origin, GPS logging walk, corners and walkways, `campus.json`, accuracy at 5 points | `campus.json` and an accuracy note exist |
| P1 Engine, 3-4 days | `geo.ts`, tests, `useCampusLocation`, consent, settings | Debug screen shows correct metres and building while walking |
| P2 3D map, 5-7 days | Box buildings, then `.glb`; dot, accuracy circle, camera, tap | Dot passes the right block when walking |
| P3 Presence, 3-4 days | Custom-token sign-in, `/presence`, rules and emulator tests, lecturer status | Two phones sync in about 2 s; rules reject writing another user's path |
| P4 Booking flow, 4-5 days | `/activeBookings`, `/bookingLive`, A*, arrival prompt, QR endpoint and screen | Full booking ends with attendance in Postgres |
| P5 Polish, 2-3 days | Floor estimate, perf traces (`location_to_render`, `presence_publish`), battery, error states | Data visible in Firebase console; screenshots for slides |

P0-P2 do not need the backend. P4 waits for the booking milestone or a temporary test booking.

### Risks

- GPS drift near buildings: accuracy circle, 2-reading rule, QR (not GPS) as attendance proof.
- Barometer unreliable: treat as a hint, allow manual floor.
- 3D work overruns: ship extruded boxes first.
- Privacy: location is treated as sensitive data under Vietnam's Decree 13/2023 (stated from general knowledge, not checked against the text). Use opt-in, app-open only, booking or lecturer scope, automatic deletion, in-app explanation and a delete button. Get university permission before testing beyond the team.

## 9. Project conventions

- Web repo (`CLAUDE.md`, `AGENTS.md`, `CODEX.md`): smallest complete change; don't run builds, lint or tests, or start servers, unless asked; don't commit unless asked; read `node_modules/next/dist/docs/` before Next.js code and `docs/DESIGN.md` before UI. Use `bun`.
- Backend (`ARCHITECTURE.md`): package-by-feature, `api` / `application` / `domain` / `infrastructure`, modules talk through public API and events, schema changes through Flyway.
- This is a private, localhost-only course project; committed `.env` files are not to be flagged as a problem. Firebase service-account files must still stay out of git.
- The user asked for Sonnet 5.5 when delegating the backend implementation.

## 10. Open decisions and next steps

**Decisions for the user**
1. Attendance proof: QR only (recommended), or allow GPS-only fallback.
2. Should students see other students' dots? The plan says no.
3. Campus origin: which corner, and its latitude/longitude. Needed to start P0.
4. FCM topics (`user-<uuid>`) for now (recommended for the demo), or a device-token table.
5. Clarify "each student must complete all requirements independently" and who the 2-3 mobile group members are; the capstone team has 5 people.

**Suggested next steps**
1. Merge or push `docs/claude-md-bun` in the web repo; decide on `.gitignore` and `.ignore`.
2. Run `./mvnw test` with Docker on `feature/realtime-hybrid`, then review and open a PR.
3. Agree with Chau Nhat Tang how `develop` and `feature/auth` come together.
4. Create the Firebase project; get credentials; test `POST /realtime/firebase-token` with `FIREBASE_ENABLED=true`.
5. Create the `office-hours-mobile` repo; check library compatibility; set up auth against the backend.
6. Start GPS P0-P1 once the origin is chosen.
7. Add the Realtime Database write path and security rules.
