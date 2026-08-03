# OfficeHours — Design System
### Visual direction, color tokens, and usage rules (v1)

> Reference: color palette extracted and previewed live at
> https://claude.ai/code/artifact/1b35f410-0c98-4194-9949-933048e16e9c (login-form.png sampling, swatches, copy-paste tokens, light/dark toggle).

---

## 1. Visual direction

**Apple-style glassmorphism** — rounded corners, soft shadows, frosted glass panels, abstract gradient backgrounds — sourced from `login-form.png` (deep blue gradient + glass login card).

**Split treatment** (revised — landing moved off full-glass after the `Slingshot.png` reference; see below):

| Surface | Treatment |
|---|---|
| Auth pages (Login, Register) | **Full glass**: brand-500→950 gradient background, glass card (`--glass-bg` / `--glass-border` / `backdrop-filter: blur`), white text. This is where the glassmorphism actually performs. Implemented as `app/(auth)/layout.tsx` + `login/` + `register/`, background is `assets/Login-Background.png` (chosen over `Glass Effect Login Page - Blue.png` for its more balanced shape placement around a centered card). The two routes share one persistent layout so Framer Motion can animate the glass card between them — `layout` prop auto-animates the height difference (register is taller), `AnimatePresence` cross-fades/slides the inner content, direction-aware (login→register vs. reverse) via React's "derive state during render" pattern, not a ref mutation (the React Compiler ESLint rule `react-hooks/refs` forbids writing `ref.current` mid-render). Respects `prefers-reduced-motion` via `useReducedMotion()`. |
| Landing page (`/`) | **Editorial/collage**, referenced from `assets/Slingshot.png`: bold uppercase display headline (Archivo 900), organic paper-cutout blobs (irregular `border-radius` shapes in brand-300/warning-500) behind an arch-topped photo, a hand-drawn wobble badge (SVG `feTurbulence`/`feDisplacementMap`, not a hand-authored path). Same brand-blue token set as the rest of the app — only the *structure* is borrowed from Slingshot, not its terracotta/mustard palette. Dark hero + CTA band use `--brand-900`/`--brand-950` directly (not theme-toggled, a deliberate fixed-dark choice like the reference). No glass on this page. |
| App shell (dashboard, calendars, tables, admin) | **Restrained**: flat `--bg-canvas` / `--bg-surface`, `--accent` used only for buttons/links/focus rings. Reserve glass for chrome only — top nav, modals, dropdowns — never as the base layer under dense content (calendar grids, booking tables, audit logs). |

Reasoning: heavy `backdrop-blur` + busy gradient backgrounds hurt readability and perf on scroll-heavy, data-dense pages (weekly slot calendars, allocation audit logs, analytics). Apple itself reserves glass for chrome, not content-dense screens. Landing gets its own editorial energy because it's a one-shot marketing surface, not a form or a data view — same reasoning that keeps glass off the app shell also keeps it off a page that's mostly headline + photo.

Landing page implementation: `app/page.tsx` + `app/landing.module.css`. Placeholder hero photo is hotlinked from `images.unsplash.com` (Unsplash License, free tier — not a premium/paid asset) pending real campus photography; `next.config.ts` allows that remote host. Swap for real photography before launch.

### 1.1 Landing page style rule: Mixed Media / Painterly Collage + Neo-Brutalism + Organic Modernism

This is the concrete, reusable ruleset for `app/page.tsx` (and only that page — see the split table above, everything else stays **Restrained** or **Full glass**). Follow these when adding or editing landing sections; don't invent new motifs ad hoc.

**Tools:** `rough.js` (already installed) for every hand-drawn accent — underlines, rings/blobs, card-border sketches. Never hand-author a wobbly SVG path; always generate it with `rough.svg(...)`.

**Rough.js parameter ranges** (keep new elements inside these so the page reads as one hand):
- `roughness`: 1.6–2.5
- `bowing`: 1.8–3
- `strokeWidth`: 1.5–5 (rings/underlines heavier at 3–5, card-border sketches lighter at 1.5–2)
- Stroke colors: `#2563eb` / `#3b82f6` (brand blues) for emphasis marks, `#cbd5e1` for subtle card-texture overlays

**Neo-brutalist card recipe** (used for value-prop cards, persona quote cards, research stat tiles):
```
border-2 border-blue-950 rounded-[16–18px] shadow-[7px_7px_0_0_#0b1b49]
```
- Hard offset shadow, no blur — `shadow-[Npx_Npx_0_0_<color>]`, N in the 6–8px range.
- Every 2nd or 3rd card in a row inverts to `bg-blue-950 text-white` with the shadow color swapped to a lighter brand blue (e.g. `#3465e0`) so it "pops" — don't invert every card, that reads as a dark section instead of a collage accent.
- Slight rotation per card, alternating: `-rotate-1 / rotate-1 / -rotate-1` (or `rotate-2` on standalone quote/sticker cards). `hover:rotate-0` on interactive cards reads as the card "settling" on click/hover — nice, keep it.
- Numeral/tag chips are small rotated "stickers": rounded-full or rounded-sm, `border-2 border-blue-950`, own hard shadow, rotated -2 to -4deg, positioned to overlap the card edge (e.g. `absolute -top-3 left-6`).

**Organic Modernism accents:** hand-drawn rough.js rings/blobs (two concentric ellipses, outer stroke lighter) sit *behind* a circular content area — used for the hero's "Free for students" badge and the persona-quote illustrations in `#for-students` / `#for-lecturers`. Reuse this exact two-ring pattern rather than introducing a new blob shape per section.

**Palette discipline:** stay inside the existing `--brand-*` / `--paper-*` / `--ink-*` ramp (§3). No terracotta/mustard, no new hues — the collage/brutalist energy comes from *contrast, rotation, and hard shadows*, not new colors. This was already the rule for the Slingshot-referenced structure (§1); it now explicitly covers the brutalist card treatment too.

**Where it's implemented (reference examples):** hero headline underline scribble, hero "Free for students" ring badge, hero "Drag it · Pick a color" sticker on the 3D couch card, the three value-prop cards, the `#for-students` / `#for-lecturers` persona-quote cards with ring blobs, and the research/fairness stat tiles — all in `app/page.tsx`. Copy these patterns forward instead of designing new ones per section.

**`next/image` quality gotcha (Next 16):** the `quality` prop is silently clamped to the closest value in `images.qualities`, which **defaults to `[75]` only** — passing `quality={100}` does nothing unless you allowlist it in `next.config.ts` first. This bit the auth background: at the default q75, Next's WebP re-encoding of the smooth blue gradient (`assets/Glass Effect Login Page - Blue.png`, 1.6MB PNG source) introduced visible banding — a ~40x compression ratio down to ~39KB. Added `images.qualities: [75, 95]` and set `quality={95}` on that one `<Image>`; output is ~64KB, banding gone. Reach for this same fix if any other photo/gradient background looks blocky — check the network tab for the actual `q=` the browser received before assuming the source asset is bad.

**App shell strategy:** one shared responsive shell, nav swaps by role (Student / Lecturer / Admin) — not separate portals.

**Device target:** desktop-first, responsive down. Slot picker / calendar views are optimized for desktop first.

---

## 2. Typography

No external font loading (Artifact/CSP-safe, and matches the Apple-style direction natively):

```css
--font-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
--font-mono: ui-monospace, "SF Mono", "Cascadia Code", Consolas, monospace;
```

Renders as San Francisco on Apple devices (true to the reference), Segoe UI on Windows, sane fallbacks elsewhere. Mono stack reserved for data-alignment contexts (hex codes, IDs, timestamps, tabular numerics — use `font-variant-numeric: tabular-nums` wherever digits line up in a column, e.g. booking tables, analytics).

**Resolved:** kept Geist Sans/Mono (already wired via `next/font`, self-hosted at build time — no runtime request, same "zero extra font fetch" property as the system stack). Added **Archivo** (weights 800/900, `next/font/google`, var `--font-archivo` / Tailwind `font-display`) as a third role: display headlines only, currently just the landing page's bold uppercase hero/CTA type. Body/UI copy stays on Geist everywhere.

---

## 3. Color tokens

Full ramp — copy directly into `app/globals.css`.

```css
:root {
  color-scheme: light dark;

  /* Brand — sampled from login-form.png gradient */
  --brand-50:  #EFF4FF;
  --brand-100: #DCE7FF;
  --brand-200: #B7CEFF;
  --brand-300: #8FB0FF;
  --brand-400: #5C8AF0;
  --brand-500: #3465E0;  /* primary interactive */
  --brand-600: #274FC0;
  --brand-700: #1D3B98;
  --brand-800: #142A6E;
  --brand-900: #0B1B49;  /* auth gradient anchor / dark button */
  --brand-950: #071230;

  /* Neutrals — blue-biased, not pure gray */
  --paper-0:   #FFFFFF;
  --paper-50:  #F6F8FC;
  --paper-100: #EDF1F8;
  --paper-200: #DCE2ED;
  --ink-300: #B7BFCE;
  --ink-400: #8D96AA;
  --ink-500: #6B7488;
  --ink-600: #4E566A;
  --ink-700: #383F52;
  --ink-800: #262B3B;
  --ink-900: #171A26;
  --ink-950: #0B0D14;

  /* Status — separate hues from brand blue, so a badge always reads at a glance */
  --success-500: #1E9E6B; --success-100: #D7F4E8; --success-700: #12704A;
  --warning-500: #D9822B; --warning-100: #FBEAD4; --warning-700: #A15E17;
  --danger-500:  #E24C4C; --danger-100:  #FBDEDE; --danger-700:  #A62F2F;
  --info-500:    #7C5CFF; --info-100:    #E8E1FF; --info-700:    #5433C4;

  /* Semantic roles (light default) */
  --bg-canvas: var(--paper-50);
  --bg-surface: var(--paper-0);
  --bg-surface-raised: var(--paper-0);
  --border-subtle: var(--paper-200);
  --text-primary: var(--ink-900);
  --text-secondary: var(--ink-600);
  --text-on-brand: var(--paper-0);
  --accent: var(--brand-500);
  --accent-hover: var(--brand-600);
  --focus-ring: var(--brand-400);

  /* Glass (auth/landing + chrome only — see §1) */
  --glass-bg: rgba(255,255,255,0.14);
  --glass-border: rgba(255,255,255,0.32);
  --glass-sheen: rgba(255,255,255,0.45);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-canvas: var(--ink-950);
    --bg-surface: var(--ink-900);
    --bg-surface-raised: var(--ink-800);
    --border-subtle: var(--ink-700);
    --text-primary: var(--paper-50);
    --text-secondary: var(--ink-300);
    --accent: var(--brand-400);
    --accent-hover: var(--brand-300);
    --focus-ring: var(--brand-300);
  }
}

/* Explicit theme override (e.g. a user-facing toggle), same tokens as above */
:root[data-theme="dark"] {
  --bg-canvas: var(--ink-950);
  --bg-surface: var(--ink-900);
  --bg-surface-raised: var(--ink-800);
  --border-subtle: var(--ink-700);
  --text-primary: var(--paper-50);
  --text-secondary: var(--ink-300);
  --accent: var(--brand-400);
  --accent-hover: var(--brand-300);
  --focus-ring: var(--brand-300);
}
:root[data-theme="light"] {
  --bg-canvas: var(--paper-50);
  --bg-surface: var(--paper-0);
  --bg-surface-raised: var(--paper-0);
  --border-subtle: var(--paper-200);
  --text-primary: var(--ink-900);
  --text-secondary: var(--ink-600);
  --accent: var(--brand-500);
  --accent-hover: var(--brand-600);
  --focus-ring: var(--brand-400);
}
```

---

## 4. Status color mapping

Maps directly to `bookings.status` and `waitlist_entries.status` enums (`capstone-db-schema.md` §3.2, §4.1) — pick the badge color from this table, don't invent new ones per screen.

| Enum value | Source | Hue | Meaning |
|---|---|---|---|
| `PENDING` | `bookings.status` | warning | awaiting lecturer confirm |
| `CONFIRMED` | `bookings.status` | success | locked in |
| `DECLINED` | `bookings.status` | danger | lecturer said no |
| `CANCELLED` | `bookings.status` | neutral | withdrawn by either side |
| `COMPLETED` | `bookings.status` | brand | meeting happened |
| `NO_SHOW` | `bookings.status` | danger (700 weight) | student missed it |
| `WAITING` | `waitlist_entries.status` | warning | in queue |
| `OFFERED` | `waitlist_entries.status` | info (violet) | action needed — expires |
| `FULFILLED` | `waitlist_entries.status` | success | offer accepted |
| `EXPIRED` | `waitlist_entries.status` | neutral | offer window closed |
| `CANCELLED` (waitlist) | `waitlist_entries.status` | neutral | left the queue |

Badge pattern: `background: var(--{hue}-100); color: var(--{hue}-700);` with a small `var(--{hue}-500)` dot. `neutral` and `brand` reuse the paper/ink and brand-100/700 pairs (no dedicated neutral-status tokens needed).

---

## 5. Open items

1. ~~Geist vs. system-font stack~~ — resolved, see §2.
2. Confirm brand blue saturation/hue reads right once placed next to real content (not just the swatch preview) — revisit after the first 2-3 pages ship.
3. `research-tools` (§7.1 API) has no UI — excluded from FE scope per earlier decision.
4. Landing hero photo is an Unsplash placeholder (`images.unsplash.com/photo-1514369118554-...`) — replace with real campus/office-hours photography before launch.
5. ~~Nav anchors `#for-students` / `#for-lecturers` have no matching sections~~ — resolved, both sections added to `app/page.tsx` (see §1.1).
