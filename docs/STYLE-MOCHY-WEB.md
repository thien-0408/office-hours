# Mochy style for the web

The web version of the Mochy redesign. Use this file when refactoring a page into the new style.

- Mobile rules: `office-hours-mobile/docs/STYLE-MOCHY.md` (§8 holds the agreed rules).
- Mobile mocks: `office-hours-mobile/docs/mockups-mochy/`.
- Reference implementation on the web: the auth pages (`app/(auth)/`, branch `feature/mochy-auth`).
- Landing preview: `public/landing-mochy-preview.html`.
- `docs/DESIGN.md` §8 is the short summary. This file is the full spec.

Status, 12/11/2026:

| Area | State |
|---|---|
| Auth (login, register, forgot, reset) | Done. Light and dark, motion |
| Landing | Static preview only, dark only, not wired into `app/page.tsx` |
| Dashboard, admin, public office hours | Old style (`docs/DESIGN.md` §1–7) |

---

## 1. Direction

Mochy Music is a dark, content-first music app. Taken over to OfficeHours:

1. **Content before icons.** People (memoji, later `photoUrl`), brand logos on the buttons that open that service, real numbers. Not icon chips, emoji or sticker cards.
2. **Monochrome UI, color only in content.** The interface is black, white and greys. Color comes from avatars, brand logos, soft background glows and error text.
3. **Glass only for what floats.** Nav, toasts, floating cards, sheets. Content areas (tables, calendars, forms) sit on solid surfaces.
4. **Big, tight type.** Bold headings with negative tracking. Few sizes.
5. **Motion with weight.** Springs taken from Mochy's source, short and physical. Everything still works with motion turned off.

---

## 2. Tokens

All tokens are `--m-*` and only exist inside a `.mochy` root (`app/globals.css`, section "Mochy", inside `@layer components`, so Tailwind utilities still override them).

### 2.1 Color

| Token | Light (default) | Dark | Use |
|---|---|---|---|
| `--m-bg` | `#f2f2f2` | `#000000` | Page |
| `--m-s1` | `#ffffff` | `#0d0d0d` | Cards, fields |
| `--m-s2` | `#ebebeb` | `#161616` | Focused field, raised surface |
| `--m-s3` | `#e2e2e2` | `#1f1f1f` | Avatar tiles |
| `--m-s4` | `#d6d6d6` | `#2a2a2a` | Disabled button |
| `--m-fg` | `#0a0a0a` | `#ffffff` | Text. Also the "focus" fill (selected chip, primary highlight) |
| `--m-fg2` | black 64 % | white 62 % | Secondary text, labels |
| `--m-fg3` | black 50 % | white 50 % | Meta text, placeholders |
| `--m-fg4` | black 16 % | white 16 % | Underlines, decoration only |
| `--m-line` / `--m-line2` | black 7 / 14 % | white 7 / 14 % | Hairlines, hover hairline |
| `--m-focus` | black 40 % | white 34 % | Focus ring and focused field border |
| `--m-primary` / `--m-on-primary` | `#111` / white | `#e0e0e0` / black | Primary pill |
| `--m-primary-hover` | `#000` | `#fff` | |
| `--m-glass` | white 72 % | `rgba(19,19,19,.78)` | Floating parts, with blur 24 px, saturate 160 % |
| `--m-glass-line` | black 6 % | white 5 % | Glass edge |
| `--m-glass-hi` / `--m-glass-hi2` | black 6 / 10 % | white 10 / 14 % | Ghost button, hover inside glass |
| `--m-hover` | black 4 % | white 6 % | Row highlight |
| `--m-shadow` | two soft shadows | small dark shadow | Elevation (does the work in light mode) |
| `--m-shadow-card` | deep soft shadow | deep shadow + 1 px white ring | Floating cards (showcase, popovers) |
| `--m-scrim` | black 32 % | black 70 % | Behind dialogs |
| `--m-sheet` | `#ffffff` | `#121212` | Dialogs, sheets (a color; the sheet easing is `--m-sheet-ease`) |
| `--m-err` | `#c62828` | `#ff8a80` | Error text and invalid field border |
| `--m-glow` | 0.4 | 1 | Multiplier for background glows |
| `--m-grain` / `--m-grain-blend` | 0.035 / multiply | 0.06 / overlay | Noise layer |

Glow tints (always paired with `.m-glow` and a strength `--o`): indigo `#4b47a0` (~0.32), teal `#2f6b52` (~0.22), blue `#3465e0` (~0.22).

**Never** hard-code `text-white`, `bg-white/…`, `bg-black/…` or hex greys inside a Mochy surface. Use tokens, or the page breaks in the other theme.

### 2.2 Type

Font: Inter with the Vietnamese subset (`components/mochy/fonts.ts`, `--font-inter`).

| Role | Size / line height | Weight | Tracking |
|---|---|---|---|
| Display (landing hero) | clamp(48 px, 6.6vw, 88 px) / 1.02 | 700 | −0.055em |
| Panel headline | 42 / 1.02 | 700 | −0.06em |
| Page title | 34 / 1.05 | 700 | −0.055em |
| Section title | 22–28 | 700 | −0.045em |
| Body, field text | 15 | 500 | −0.015em |
| Lead | 15–17 / 1.55 | 500 | −0.012em |
| Label | 13 | 600 | −0.01em |
| Meta | 12–12.5 | 500 | −0.01em |
| Countdown (odometer) | 28+ | 700 | −0.05em, tabular numbers |

Wordmark: lowercase **officehours**, Inter 700, −0.05em.

### 2.3 Shape and spacing

| Element | Radius |
|---|---|
| Buttons, chips in a row, nav, switchers | Pill (999 px) |
| Fields, choice chips | 18 px (squircle 29 px where `corner-shape` is supported) |
| Glass card | 26 px |
| Large card, panel | 32 px |
| Avatar tile | 22 px (large), 16 px (small) |
| Logo tile | 11 px at 36 px |

Heights: field 56 px, primary button 54 px, small button 40–42 px, switcher 36 px.
Spacing: 4 px grid. Form fields 16 px apart. Page side padding 24 px. Content max width 1240 px.

---

## 3. Theme (light and dark)

- **Order of tokens:** light tokens are the default on `.mochy`. Dark tokens apply under `data-mochy-theme="dark"`, and under `"system"` when the OS is dark (`@media (prefers-color-scheme: dark)`, no JavaScript, no flash).
- **Storing the choice:** cookie `NEXT_THEME` (`system` | `light` | `dark`, default `system`). Constants live in `components/mochy/theme.ts`, the server reader in `theme-server.ts`, the control in `ThemeSwitcher.tsx`.
- **Pattern for a route group:** a server `layout.tsx` reads the cookie and passes it to a client shell, which puts `data-mochy-theme` on the `.mochy` root. See `app/(auth)/layout.tsx` + `AuthShell.tsx`.
- **Scope:** the attribute sits on the `.mochy` root, not `<html>`, because the old app shell is still pinned to `data-theme="light"`. Once every surface is Mochy, move it to `<html>` and drop the old theme.

**Light is not an inversion:**
- In light, depth comes from shadow (`--m-shadow`, `.m-card`) on a light grey page with white cards. In dark, depth comes from lighter surfaces.
- "White means focus" becomes "text color means focus". Selected chips, the logo tile and highlights use `--m-fg` with `--m-bg` text.
- Glows are scaled down, grain switches to `multiply`, and error red is darker.

---

## 4. Components

### 4.1 Built (`components/mochy/`)

| File | What |
|---|---|
| `fonts.ts` | Inter, `--font-inter` |
| `OhLogo.tsx` | `OhMark` (the "oh" mark, `currentColor`) and `OhLogo` (tile + wordmark) |
| `StatusGlyph.tsx` | Solid status glyph: a filled circle with the symbol knocked out by a mask. Has `ok`, `wait`, `no` |
| `auth-styles.ts` | Class strings for auth forms (title, lead, field, label, submit, link, error, footer) |
| `theme.ts`, `theme-server.ts`, `ThemeSwitcher.tsx` | Theme handling, see §3 |
| `motion.ts` | Spring and easing presets, see §5 |
| `Press3D.tsx` | Lean-toward-pointer wrapper |
| `Odometer.tsx` | Digit reels for countdowns |

`LocaleSwitcher` has `variant="mochy"`.

### 4.2 CSS classes (`app/globals.css`)

| Class | What |
|---|---|
| `.mochy` | Root: tokens, background, font |
| `.m-glass` | Floating glass: blur, edge, shadow |
| `.m-card` | Solid card with hairline and shadow |
| `.m-glow` (+ `[--o:…]`), `.m-grain` | Background atmosphere |
| `.m-field`, `.m-label` | Inputs. `aria-invalid="true"` gives the error border |
| `.m-btn` + `.m-btn-primary` / `.m-btn-ghost` | Pill buttons with press bounce |
| `.m-link` | Inline link with a soft underline |
| `.m-chip` (+ `.m-slide` + `.m-fill`) | Choice chip. `aria-pressed` selects it; the slide variant animates the fill |
| `.m-press` | Press bounce on anything |
| `.m-hl` | Row highlight (fast in, slow out) |
| `.m-page` | Children rise in on mount |
| `.m-rise-in` (+ `[--d:…]`) | Hero line entrance |
| `.m-ghost`, `.m-ghost-row` (`.rev`) | Outlined drifting words |
| `.m-odo*` | Odometer parts |

### 4.3 Still needed for the app shell

| Component | Notes |
|---|---|
| Floating nav pill | Glass pill. Tabs are icon-only; the active tab gets a `--m-glass-hi` fill and shows its label. The highlight slides (indicator spring) |
| Frosted top bar | Transparent at the top, `--m-glass` with blur after scrolling 24 px (Mochy `home.css .topnav.solid`) |
| Progressive blur header | Several stacked `backdrop-filter` layers with gradient masks, sharp at the top and fading out. Only possible on the web, not on mobile |
| "Next booking" floating card | Replaces a mini player: glass card above the nav, from 60 minutes before a booking until it ends, with an odometer countdown |
| Section header row | The whole row "Gợi ý cho bạn ›" is the hit area, with no icon. On press it lights up as a full-width pill (`.m-hl`) |
| Horizontal shelf | Square avatar tiles (memoji or photo), name and one meta line below, no border |
| List row | 48 px avatar, two lines of text, glyph or chevron at the end, hairline between rows |
| Grouped list | `--m-s1` block with 20 px radius, rows of 52 px, value on the right in `--m-fg3` |
| Segmented control | Glass track, sliding fill |
| Sheet / dialog | `--m-sheet`, 28 px top radius, grab handle, `--m-scrim` behind |
| Toast | Keep the dark-glass exception from `DESIGN.md` §1.3 (dark in both themes). Enter: ζ 0.74 spring from above, scale from 0.92. Exit: 0.26 s |
| Skeleton | Surface block with a soft sweep, then content fades and rises in |
| Status glyphs | Add `done`, `queue`, `offer`, `off`, `warn` (see §6) |

---

## 5. Motion

Values are taken from Mochy's source, not guessed:
- the Compose app: `ui/component/Press3D.kt`, `TouchFeedback.kt`, `TopToast.kt`, `ContainerTransform.kt`;
- the website: `docs/assets/css/site.css`, `home.css`, `js/home.js`.

Compose springs (damping ratio ζ, stiffness k, mass 1) become framer-motion damping with `c = 2·ζ·√k`. Presets are in `components/mochy/motion.ts`.

| Name | Spec | Use |
|---|---|---|
| `pressDown` / `pressUp` | ζ 1, k 1600 / ζ 0.38, k 520. CSS version: 0.12 s ease-out down, 0.42 s `cubic-bezier(.34,1.56,.64,1)` up | Buttons, chips, links (`.m-btn`, `.m-press`) |
| `press3d` | ζ 1, k 420. Lean up to 7°, scale 0.97 while held, perspective 900 | Cards (`Press3D`) |
| `indicator` | ζ 0.82, k 700 | Sliding highlights (`layoutId`) |
| `toast` | ζ 0.74, k 1500. Opacity 0.16 s, scale 0.92 → 1 | Toasts, floating cards arriving |
| `hero` | ζ 0.38, k 300 | Hero cards entering |
| `containerOpen` | ζ 0.88, k 150 (~0.6 s). Close: 0.56 s `cubic-bezier(.4,0,.1,1)` | Card → detail transitions |
| `MOCHY_EASE` | `cubic-bezier(.32,.72,0,1)` | Reveals, page rises, sheets |
| Page change | Children rise 14 px over 0.55 s, 40 ms apart; old page leaves up 8 px in 0.16 s ease-in | `.m-page` + `PAGE_RISE.leave` |
| Reveal on scroll | From 48 px below at scale 0.98, about 1 s, **once** (stays shown after scrolling away) | `REVEAL` |
| Hero lines | 40 px, 0.9 s, 0.1 / 0.22 / 0.36 s stagger | `.m-rise-in` |
| Ghost words | 46 s and 52 s linear loops, opposite directions | `.m-ghost-row` |
| Row highlight | In 90 ms, out 340 ms | `.m-hl` |

Rules:
- CSS entrance animations use `animation-fill-mode: backwards`, never `both`. With `both`, the final transform sticks and blocks `:active` press scaling.
- Animate `transform` and `opacity` only. Pause looping animations when they are off screen (Mochy's `.resting`).
- `prefers-reduced-motion`: everything above is disabled in CSS and through `useReducedMotion()`. Content must never depend on an animation to appear.
- One signature moment per screen is enough (a drifting headline, a countdown). Do not animate every element.

Landing ideas from Mochy's homepage, not built yet:
- full-height sections stick and the next one slides over, the covered one scaling to 0.93 under a darkening shade;
- a pinned strip that scrolls sideways with the middle card largest;
- phones that lean toward the mouse.

---

## 6. Content, icons and status

- **Icons only for:** nav tabs, back and close, compact controls (show password, theme), chevrons. No icons in field labels, no emoji, no ✨ for AI, no icon chips beside headings.
- **People:** memoji from `lib/avatar.ts` until real `photoUrl` exists. **Stock photos never ship in the app.** The landing preview uses memoji too.
- **Brand logos (Simple Icons, CC0):** only on a button or row that opens that service: Zoom, Google Meet, Google Calendar (template link), Gmail. Keep their original colors. Pick the meeting logo from the `meetingUrl` domain; fall back to "Open link".
- **No fake sign-in buttons.** The backend has no OAuth.
- **Status is a glyph, never a colored dot or colored badge.**

  | Glyph | Statuses |
  |---|---|
  | `wait` | PENDING |
  | `ok` | CONFIRMED, FULFILLED |
  | `done` | COMPLETED |
  | `queue` | WAITING |
  | `offer` | OFFERED |
  | `no` | DECLINED |
  | `off` | CANCELLED, EXPIRED |
  | `warn` | NO_SHOW |

  Glyphs use `currentColor`. The active state uses `--m-fg`; past or closed states use `--m-fg3`.
- **Charts are web only** (admin analytics, research). Draw them monochrome: `--m-fg` for the series in focus, `--m-fg3`/`--m-s4` for the rest, values written on the chart instead of a legend, no grid. A ranked list with thin bars beats a bar chart for "load per lecturer".
- **Location** (map pages): always say where it came from: "(ước lượng)", "(tự chọn)", "tại phòng 306.B11".

---

## 7. Accessibility

- Text contrast is at least 4.5:1. `--m-fg3` is the lightest color allowed for text. `--m-fg4` is decoration only.
- Every interactive element gets a 2 px `--m-focus` outline on `:focus-visible`.
- Icon-only controls have `aria-label` and `title`.
- Toggle groups use `role="radiogroup"` / `aria-checked` or `aria-pressed`.
- Odometers have screen-reader text with the plain value.
- Invalid fields set `aria-invalid="true"`. Errors use `role="alert"` and must be text, not color alone.
- Reduced motion: see §5.

---

## 8. Refactor plan

Order, smallest risk first:

1. **Landing.** Port `public/landing-mochy-preview.html` to components under `components/landing/` (or a new `components/mochy/landing/`). Add the theme root and the scroll moments from §5. Remove Satoshi and the neo-brutalist pieces (`components/landing/shared.tsx`, `tokens.ts`) once nothing imports them.
2. **Public office hours** (`app/public/office-hours`). One read-only page; good test for list rows, shelves and glyphs.
3. **App shell** (`components/dashboard/DashboardShell.tsx`). Floating nav pill or a slim glass sidebar, frosted top bar, theme root, `NEXT_THEME` read in `app/(dashboard)/layout.tsx`.
4. **UI primitives** (`components/ui/*`, shadcn on Base UI). Remap their CSS variables to `--m-*` inside `.mochy` instead of rewriting each component. Check button, input, select, dialog, dropdown, tabs.
5. **Status.** Replace `components/StatusBadge.tsx` and `lib/ui/status-hues.ts` with `StatusGlyph` plus a text label, then delete the hue mapping.
6. **Charts.** `components/dashboard/ActivityChart.tsx` and the admin analytics pages: drop the coral, rose and mint accents and follow §6. Data for advisor load comes from BE-51.
7. **Toasts** (`components/ToastProvider.tsx`). Use the toast spring and solid glyphs; keep them dark in both themes.
8. **Clean up.** Move `data-mochy-theme` to `<html>`, delete the old tokens in `globals.css` and the old sections of `DESIGN.md`.

### Checklist for each page

- [ ] Root inside a `.mochy` element that has `data-mochy-theme`.
- [ ] No hard-coded white, black or hex greys. Only `--m-*` tokens.
- [ ] Glass only on floating parts.
- [ ] No icons on fields and no emoji. Status shown with glyphs.
- [ ] People shown as memoji or `photoUrl`; brand logos only on their own buttons.
- [ ] Press feedback on everything clickable (`.m-btn`, `.m-press`, `Press3D`).
- [ ] At most one signature animation. Works with reduced motion.
- [ ] Checked in light and dark (Edge `--force-dark-mode` works for screenshots).
- [ ] New strings added to both `i18n/messages/en.ts` and `vi.ts`.

---

## 9. Open items

- **Hard-coded English in auth forms:** some strings are still not translated (role descriptions, forgot-password copy, toast texts, demo dialog). Move them to i18n.
- **Memoji vs. names:** memoji are picked by hashing the name, so a female name can get a bearded memoji in the showcase. Pick indices by hand for showcase data.
- **Language switch without reload:** Done. `setLocale` updates React state and calls `router.refresh()` to update server components without `location.reload()`.
- **Landing preview is dark only.** Give it the light tokens when porting.
- **Squircle corners** only show where `corner-shape` is supported; elsewhere they are plain radii. That is fine, do not polyfill.
