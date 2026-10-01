# shadcn/ui Refactor Plan

Goal: stop re-writing the same Tailwind class strings in every file. Move repeated UI (buttons, inputs,
dialogs, tabs, badges, tables…) into shared components under `components/ui/`, themed by the existing
tokens in `docs/DESIGN.md` — **no new colors, no visual redesign**. Migrate incrementally.

---

## 0. Progress log

Auth pages and the landing page are **out of scope** (they run on their own neo-brutalist `--po-*` style); the glass
treatment in DESIGN.md §1 is not being pursued.

| Phase | Status | Notes |
|---|---|---|
| 0 Foundations | done | shadcn init + token mapping; `Button` (variants below), `Input`, `Textarea`, `Label`, `Card`, `Badge`, `Skeleton`, `Switch`, `Tabs`, `Dialog`, `AlertDialog`, `Sheet`, `DropdownMenu`, `Tooltip`, `Table`, `NativeSelect`, `Checkbox` |
| 1 Dashboard cards | done | `NextUpCard` on `Button`/`buttonVariants`; `FilterTabs` is a wrapper over `Tabs` with 5 skins (`pill`, `compact`, `chips`, `dark`, `paper`). `dashboard/Card` is intentionally **kept** as a token-styled div (the shadcn `Card` is a flex-col with `gap`/`overflow-hidden` and would break ~40 call sites that pass their own layout); it is now keyboard-operable when `onClick` is passed. Use `components/ui/card` for new composed cards |
| 2 Forms | done | `FormField`/`TextInput` -> `Label`/`Input`; `ToggleSwitch` -> `Switch`; every hand-styled `<select>` -> `NativeSelect`; 2 `<textarea>` -> `Textarea`; 4 checkboxes -> `Checkbox` |
| 3 Overlays | done | `ConfirmModal` -> `AlertDialog` (glass look kept); `AvatarPickerModal`, `BookSlotModal`, `RescheduleModal`, the schedule "Add event" modal and the `TimetableGrid` session-details modal -> `Dialog`; `DashboardShell` mobile drawer -> `Sheet`, user menu and `LocaleSwitcher` -> `DropdownMenu` (outside-click/Esc/focus-return for free) |
| 4 Data display | done | `StatusBadge`, `WaitlistStatusBadge`, admin "Active/Inactive" -> `Badge`; all 8 app tables -> `Table*`; shared `SortButton` extracted (was duplicated); `DashboardSkeleton` -> `Skeleton` |
| 5 Auth | skipped | Out of scope by decision (see above) |
| 6 Monster files | partial | `schedule/page.tsx` (1.4k lines) and `TimetableGrid.tsx` had their buttons/selects/modals migrated but were **not split** into sub-components; the top ~900 lines of `schedule/page.tsx` are a commented-out legacy implementation that can simply be deleted (be careful: scripted edits must anchor on `\nexport default function SchedulePage`, not the first match) |
| 7 Cleanup | done | ESLint `no-restricted-syntax` (warn) flags `<button className>` and `<input|textarea|select className>` outside `components/ui`, landing and auth. **18 accepted warnings remain**: bespoke tile/row buttons (slot picker, calendar day, avatar grid, task/notification rows, timetable cells, toast action) plus `TimetableShowcaseDemo`/`WelcomeExperience` (landing-style) |

**Button variants** (all in `components/ui/button.tsx`): `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`, `glass`,
`ghost-danger|success|brand` (tone-on-hover icon/row actions), `outline-danger`, `dark`, `link-brand|danger|muted`.
Sizes: `default` (h-9), `xs`, `sm`, `lg`, `icon` / `icon-md` / `icon-sm` / `icon-xs` / `icon-lg`. Prop `loading` shows a spinner and disables.

**Codemods** (scripts lived in the session scratchpad, not committed): 26 primary/outline buttons, 12 selects, 36 icon/link/danger/ghost/dark
buttons, 8 table files, 5 segmented controls and 2 modals were converted mechanically; the remainder by hand.

**Not verified in a browser.** Only `tsc --noEmit` and `eslint` were run. Click through: every modal (focus, Esc, outside click),
the mobile drawer, the user/locale menus, the three `FilterTabs` skins, sortable table headers and the bookings bulk-select checkboxes.

---

## 1. What is already installed (this session)

| Item | Detail |
|---|---|
| CLI / style | `shadcn@4` (devDependency), style **`base-nova`** → primitives come from **`@base-ui/react`**, not Radix |
| Config | `components.json` (aliases: `@/components`, `@/components/ui`, `@/lib/utils`) |
| Helpers | `lib/utils.ts` → `cn()` = `clsx` + `tailwind-merge`; `class-variance-authority`, `tw-animate-css` |
| Components | `components/ui/button.tsx` only (so far) |
| Icons | `@phosphor-icons/react` (stat chips, filled/duotone), `lucide-react` kept for existing inline icons |

### Fixes applied to the generated output (do not revert)
`shadcn init` produced three bugs for this repo; all fixed in `app/globals.css`, `lib/utils.ts`, `components/ui/button.tsx`:

1. **`--accent` was overwritten** with a grey oklch value. The repo's `--accent` is the brand-blue interactive color.
   → restored to `var(--brand-500)`; shadcn's "accent" (a subtle hover surface) is exposed as **`--ui-accent`**
   (`--brand-50`) and wired through `--color-accent` in `@theme`. So `bg-accent` in shadcn components = pale brand tint.
2. **`--font-sans: var(--font-sans)`** (self-reference, broke fonts) → `var(--font-geist-sans)`.
3. **`import { cn } from "cn"`** pointed at an unrelated npm package → `@/lib/utils`; `cn` package removed.

Also: shadcn's neutral oklch palette was replaced with a **mapping onto repo tokens**
(`--primary → --brand-500`, `--background → --bg-canvas`, `--card → --bg-surface`, `--border → --border-subtle`,
`--destructive → --danger-500`, `--ring → --focus-ring`, `--radius: 0.75rem` to match the current `rounded-xl`).
Because those source vars already flip in the dark blocks, the generated `.dark` block was deleted and
`@custom-variant dark` now keys off `[data-theme="dark"]`.

### Global cursor fix (already in `globals.css`)
Tailwind 4 resets `<button>` to `cursor: default`. A single base-layer rule now covers
`button:not(:disabled)`, `[role="button"]`, `summary`, `select`. See §6 for the per-file audit — with the global rule
those are *verification items*, not required edits, but new shadcn components should not rely on per-call classes.

---

## 2. Token mapping rules (so shadcn stays on-brand)

- Interactive/primary = **brand-500**. Status colors only via `lib/ui/status-hues.ts` (§4 of DESIGN.md).
  Decorative accents (coral/rose/mint) only for chips/featured surfaces (§1.2) — expose as explicit `Button` variants
  (`accent-rose` …) only if a real use appears; don't add speculative ones.
- Landing page (`app/page.tsx`, `components/landing/*`) uses its own neo-brutalist `--po-*` scope (DESIGN.md §1.1).
  **Out of scope** — do not migrate; shadcn tokens would fight it.
- Auth pages are full-glass (white text on gradient). Use shadcn **primitives** (Input, Button) only with a
  `glass` variant; never the light-surface defaults.
- Toasts keep their dark-glass exception (§1.3) — `ToastProvider` stays; optionally swap to `sonner` later, out of scope here.
- Keep font sizes: repo uses `text-[13px]`; set Button/Input `size` variants to match (see §3.1) instead of changing call sites.

---

## 3. Component inventory & target mapping

Scan results (excluding `components/ui`, `node_modules`): **134 `<button>`, 18 `<input>`, 16 `<select>`,
2 `<textarea>`, 11 `<table>`, 11 dialog/modal markers, 12 `fixed inset-0` overlays, 36 repeats of the brand
primary-button class string across 20 files, 18 repeats of the bordered white input/chip pattern across 9 files.**

| Pattern in repo today | Where | shadcn target | Notes |
|---|---|---|---|
| Primary button `bg-[var(--brand-500)] text-white … hover:bg-[var(--brand-600)]` (36×, 20 files) | NextUpCard, UpcomingList, SuggestedSlotsCard, BookSlotModal, RescheduleModal, ConfirmModal, LoginForm, RegisterForm, forms in admin/* … | `Button` (`default`) | Tune sizes: `default` h-9 `text-[13px]`, `lg` h-10 for auth |
| Outline/secondary button `border border-[var(--paper-200)] … hover:bg-[var(--paper-100)]` | NextUpCard Reschedule, SuggestedSlotsCard, modals | `Button variant="outline"` | |
| Destructive/danger buttons (Decline, Cancel booking, delete) | bookings/[id], admin/users, availability, waitlist | `Button variant="destructive"` | Variant currently tinted-style; verify contrast vs `--danger-100/700` |
| Icon-only buttons (collapse sidebar, calendar chevrons, pencil/trash) | DashboardShell, MiniCalendar, availability | `Button size="icon*"` | Requires `aria-label` — several are missing it |
| `TextInput` in `FormField.tsx` + raw `<input>` (18×) | FormField, LoginForm, RegisterForm, BookingsTable search, DashboardShell search, research | `Input` + `Label`; keep `FormField` as a thin wrapper | Auth needs glass variant |
| `<select>` (16×) styled by hand | schedule/page (6), admin/*, availability, recurring, ActivityChart | `Select` (Base UI) or native `NativeSelect` | Use `NativeSelect` where option lists are huge/simple to avoid regressions |
| `<textarea>` (2×) | allocation, bookings/[id] | `Textarea` | |
| Hand-rolled modals (`fixed inset-0`, 12× / 9 files) + framer-motion | BookSlotModal, RescheduleModal, AvatarPickerModal, ConfirmModal (glass), DashboardShell (mobile drawer), schedule/page, TimetableGrid, LoginForm, WelcomeExperience | `Dialog` (+ `AlertDialog` for ConfirmModal) ; `Sheet` for mobile drawer | Biggest win: focus-trap, Esc, scroll-lock, aria are currently re-implemented per file. ConfirmModal's glass look → a `glass` content variant |
| `FilterTabs` segmented control | bookings, notifications | `Tabs` (pill variant) | Keep `FilterTabs` API as a wrapper so call sites don't change |
| `ToggleSwitch` (input + custom) | availability, profile | `Switch` | |
| Status/waitlist/other pills `rounded-full text-[11–12px]` (16×, 11 files) | StatusBadge, WaitlistStatusBadge, chips | `Badge` with variants fed by `HUE_TOKENS` | Keep `StatusBadge` as the domain wrapper |
| `Card` (`rounded-2xl border bg-white p-5`) | everywhere | `Card` + `CardHeader/Content` | `Card` has an `onClick` on a `<div>` (no keyboard access) — fix when migrating |
| Tables (11×) | BookingsTable, admin/*, TimetableImport, ActivityChart (table view) | `Table` | Large; do after primitives |
| Skeletons `animate-pulse` (11×) | DashboardSkeleton | `Skeleton` | Trivial |
| User menu dropdown (`absolute right-0 …`) | DashboardShell | `DropdownMenu` | Also the notification + locale menus |
| `LocaleSwitcher` custom popover | LocaleSwitcher | `DropdownMenu` / `Select` | |
| FAQ accordion | landing (out of scope) | — | skip |
| Tooltips (title attributes today) | UpcomingList dot, collapsed sidebar rail | `Tooltip` | |
| Toast | ToastProvider | keep | §1.3 exception |

### 3.1 `Button` customisation to do first
Edit `components/ui/button.tsx` once (then call sites stay clean):
- `default` size → `h-9 px-3.5 text-[13px] font-semibold rounded-xl`; `lg` → `h-10 px-5 text-sm`; keep `icon*`.
- Add `glass` variant for auth pages and `accent` (rose-600) only if needed.
- Add `loading` prop (spinner + `disabled`) — login/register/forms currently inline this.
- Add `cursor-pointer` to the base class string anyway (global rule is a safety net, not the contract).
- Support `asChild`-style rendering for `<Link>`: with Base UI use the `render` prop (`<Button render={<Link href=… />} />`). **Check `node_modules/@base-ui/react` docs / Next docs before use — AGENTS.md warns APIs differ.** Many "buttons" here are `<Link className="…bg-brand…">` (NextUpCard, UpcomingList, SuggestedSlotsCard).

---

## 4. Phased migration (each phase = one PR, app stays shippable)

**Phase 0 — Foundations (mostly done)**
- [x] shadcn init, token mapping, `cn`, global cursor rule.
- [x] `Button` customised (h-9 / `text-[13px]` / `rounded-xl`, `lg`, `icon`, `glass` variant, `loading` prop, `cursor-pointer`, hover = `--accent-hover`).
- [x] Added `Input`, `Textarea` (match old `TextInput` look), `Label`, `Card` (matches `dashboard/Card`), `Badge` (+ status hue variants from `HUE_TOKENS`), `Skeleton`.
- [x] **Gotcha:** `shadcn add` re-writes `import { cn } from "cn"` in every generated file and re-adds the `cn` npm dep. After every `shadcn add`: `sed -i 's#from "cn"#from "@/lib/utils"#' components/ui/*.tsx && bun remove cn`.
- [x] Links as buttons: Base UI `Button` renders a `<button>`; for `<Link>` use `className={buttonVariants({...})}` (done in `NextUpCard`) instead of `render`.
- [ ] Add a `/dev/ui` (or Storybook-less) preview route listing every variant in light + dark + a Vietnamese long-label row.
- [ ] Add a section to `docs/DESIGN.md`: "UI kit: shadcn on repo tokens" + the `--ui-accent` rule.

**Phase 1 — Dashboard cards touched this session (low risk, proves the setup)** — `NextUpCard` ✅ migrated
`NextUpCard`, `UpcomingList`, `StatTile`, `MiniCalendar`, `TaskList`, `FilterTabs`, `SectionHeader`.

**Phase 2 — Forms**
`FormField`/`TextInput` → `Label`+`Input`; `ToggleSwitch` → `Switch`; `<select>` → `Select`/`NativeSelect`.
Files: FormField, ToggleSwitch, BookSlotModal, RescheduleModal, availability, profile, recurring, admin/users, admin/allocation, bookings/[id].

**Phase 3 — Overlays (highest payoff)**
`Dialog`/`AlertDialog`/`Sheet`/`DropdownMenu`/`Tooltip`.
Order: ConfirmModal (glass) → BookSlotModal → RescheduleModal → AvatarPickerModal → DashboardShell (mobile drawer, user/notification/locale menus) → schedule/page + TimetableGrid modals.
Keep framer-motion only for page/stagger transitions; let Base UI/`tw-animate-css` own overlay animation. Respect `prefers-reduced-motion` (already required by DESIGN.md §1).

**Phase 4 — Data display**
`Badge` (wrap `StatusBadge`, `WaitlistStatusBadge`), `Table` (BookingsTable, admin/*, TimetableImport), `Card` everywhere.

**Phase 5 — Auth surfaces**
Login/Register/Forgot/Reset with `glass` Button/Input variants. Verify the shared-layout card animation (DESIGN.md §1) still works.

**Phase 6 — The two monsters**
`app/(dashboard)/dashboard/schedule/page.tsx` (**1491 lines**, 18 buttons, 6 selects) and `components/dashboard/TimetableGrid.tsx` (808 lines).
Split into sub-components *first* (separate PR, no behavior change), then migrate primitives.

**Phase 7 — Cleanup**
Delete dead one-off components (`FormField.TextInput`, `ToggleSwitch`, etc.), add ESLint rule/`no-restricted-syntax` to ban raw `<button className=…>` / `<input className=…>` outside `components/ui`, update DESIGN.md.

### Definition of done per file
- No hand-written `bg-[var(--brand-500)]`/`rounded-xl border border-[var(--paper-200)]` button/input strings left.
- Keyboard: Tab order + Esc + focus return checked for every overlay.
- Light + dark (`data-theme`) + `vi` locale screenshot checked.
- `tsc --noEmit` and `eslint` clean.

---

## 5. Risks / things to watch
- **Base UI ≠ Radix.** `base-nova` uses `@base-ui/react`; `asChild` doesn't exist (use `render`). Most online shadcn snippets assume Radix. If this becomes painful, re-init with a Radix style (`components.json` `style`) — decide before Phase 3.
- **`--accent` collision** — never write `bg-accent` expecting brand blue; use `bg-primary`. Document in DESIGN.md.
- **Base layer `* { border-border }`** (shadcn) changes the *default* border color from `currentColor` to `--border`. Elements with bare `border` and no color class will turn grey; grep `className="…border…"` without a color if something looks off.
- **Specificity**: unlayered `body { background … }` in globals.css wins over shadcn's layered `bg-background` — intended, but don't move it into a layer without checking.
- **Bundle**: Base UI is tree-shaken per import; still avoid barrel imports.
- **Auth glass / landing** need explicit variants or opt-out; don't let default shadcn light styles leak onto them.
- **Next 16 + React 19 + React Compiler lint rules** (`react-hooks/refs`, no setState-in-effect) — shadcn snippets sometimes violate them; run eslint on every added component.

---

## 6. `cursor-pointer` audit

Root cause: Tailwind 4 preflight sets buttons to `cursor: default`.

**Fixed globally** by the base-layer rule in `app/globals.css` (`button:not(:disabled)`, `[role=button]`, `summary`, `select`);
`Button`, `Switch`, `NativeSelect` and `DropdownMenuItem` also set it themselves. Brace-aware re-scan after the refactor
(the first scan in this doc over-counted because it stopped at the `>` in `=>`):
**31 raw `<button>` remain (app + components, excl. auth/landing), 9 carry the class, the rest rely on the global rule.**
All clickable non-buttons are fixed (`Card` with `onClick` is now `role=button` + keyboard + `cursor-pointer`;
`TimetableAgenda` delete handle and `TimetableGrid` block wrapper got the class).

Raw `<button>`s still without the class (intentional bespoke surfaces; covered by the global rule):
`admin/research` [466 policy tile] - `profile` [54 avatar] - `waitlist` [57, 115 expandable rows] - `TimetableShowcaseDemo` [82, 94, 106] -
`ToastProvider` [109] - `WelcomeExperience` [284] - `AvatarPickerModal` [47] - `MiniCalendar` [71 day tile] - `NotificationItem` [17] -
`TaskList` [32] - `TimetableAgenda` [126 row] - `WeekSlotGrid` [44 slot tile] - `app/public/office-hours` [117].

**Convention:** never hand-add `cursor-pointer` to a `<button>`; use `<Button>` (or `buttonVariants()` on a `<Link>`).
Disabled buttons use `cursor-not-allowed` (the global rule skips `:disabled`).
