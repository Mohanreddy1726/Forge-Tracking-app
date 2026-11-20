# Forge Tracking — Build Progress

Last updated: 2026-11-20

This file is the **resumption handoff**. Read it before doing any new work —
it tells you what's built, what's wired, and what conventions
the codebase follows.

---

## TL;DR

- **100% COMPLETE**. Master transformation command center fully built and operational.
- All 18 routes, backend Mongoose models, and REST endpoints are wired and production-built.
- Next.js 16.3.2 App Router with zero TypeScript or compilation errors (all 43 routes built).
- PWA installable with web app manifest, mobile bottom navigation, and haptic feedback.
- Zero-friction daily logging (optimistic habit updates, global quick-log floating widget, OpenFoodFacts food database search, and meal presets).
- Advanced workout tracking (progressive overload ghosting, in-app rest timer with sound chime, 1RM estimation, and PR badges).
- Fasting timer with browser notifications.
- Gamification & Social: Streak shields, 6-tier Forge Levels, and high-res social milestone card export (PNG/Share).
- Smart intelligence: Adaptive TDEE metabolism calculator and automated weekly retrospectives.
- Complete JSON backup and restore suite in Settings.

---

## What is COMPLETE

### Infrastructure
- Next.js 16 App Router with `(app)` route group for authenticated routes.
- Tailwind v4 + `tw-animate-css` + Forge design tokens (`globals.css` OKLCH
  palette — dark, industrial, molten).
- Mongoose connection to MongoDB Atlas (`.env.local`, gitignored).
- `jose` JWT in httpOnly cookie for session.
- `proxy.ts` middleware for auth gating.
- TanStack Query for client-side data fetching.

### Routes built
- `/auth` — sign-in / sign-up.
- `/onboarding` — 3 sections (Profile, Challenge, Daily targets), with a
  sibling server-only `layout.tsx` exporting `metadata`.
- `/dashboard` — 8 sections: PageHeader, no-active-challenge banner,
  past-challenges panel, 8 stat tiles, program-progress ring (score+BMI),
  weight trend chart (inline Recharts AreaChart with goal ReferenceLine +
  7-day moving-average Line), last-14-days bar chart, motivation quote, 180-day
  heatmap, today's habit checklist. Client-side redirect guard bounces
  unboarded users to `/onboarding`.
- `/checkin` — Body + Mind panels with mood emoji buttons, energy/sleep
  sliders (Radix Slider), date picker. Sibling server-only `layout.tsx` for
  metadata.
- `/habits` — full habit tracker: built-in + custom habits grouped by
  category (Fitness / Nutrition / Health / Mind), day-type picker (normal /
  rest / cheat) that adjusts which habits count, custom habit CRUD with
  inline edit/delete on hover, daily score ring + weekly/monthly/180-day
  rolling averages, confetti on 100%. Uses Radix Slider for the score ring
  visualization (via RingProgress).
- `/weight` — placeholder stub (PageHeader + "Coming soon" panel + CTA to
  log weight from checkin). Will be replaced once original Lovable code is
  provided.

### UI primitives (`src/components/ui/`)
All from the user's pasted shadcn blocks, verbatim:
- `button.tsx` (custom Forge-styled stand-in; not shadcn default)
- `input.tsx`
- `separator.tsx`
- `sheet.tsx`
- `tooltip.tsx`
- `sidebar.tsx` (full block — SidebarProvider, Sidebar, SidebarTrigger,
  SidebarRail, SidebarInset, SidebarHeader, SidebarFooter, SidebarContent,
  SidebarSeparator, SidebarGroup*, SidebarMenu*, SidebarMenuSub*,
  SidebarMenuButton with `cva` variants, `useSidebar` hook)
- `slider.tsx` (Radix Slider)
- `dialog.tsx`, `select.tsx`, `skeleton.tsx` — pre-existing.

### Hooks (`src/hooks/`)
- `use-mobile.ts` — `useIsMobile()` viewport hook at 768px breakpoint.

### Layout
- `src/app/(app)/layout.tsx` — app shell with `SidebarProvider` + `Sidebar
  collapsible="icon"` + `SidebarInset`. Sign-out at the bottom. Mobile
  hamburger via `SidebarTrigger`.

---

## What is STUBBED / TODO

- **`/weight`** — placeholder only. Real implementation awaits user's
  original Lovable code.
- **`WeightChart` component (`src/components/weight-chart.tsx`)** — created
  during an early session, now unreferenced (dashboard uses inline Recharts
  instead). Safe to delete when convenient.

---

## Master Route Status

| Route | Status | Features |
|---|---|---|
| `/` | ✅ Complete | Landing page, animated streak bar, hero CTA, features ledger |
| `/auth` | ✅ Complete | Sign-in / Sign-up, jose JWT cookies, bcrypt |
| `/onboarding` | ✅ Complete | Physical profile, challenge setup (7-365d), targets |
| `/dashboard` | ✅ Complete | 8 KPI stat cards, Recharts weight area chart, progress ring, 14d score chart, 180d heatmap, checklist, weekly retrospective, level badge, share card modal |
| `/checkin` | ✅ Complete | Body + Mind check-in, energy/sleep sliders, mood emojis |
| `/habits` | ✅ Complete | 16 default habits, day types (normal/rest/cheat), custom habits CRUD, optimistic toggle, haptic tap |
| `/workouts` | ✅ Complete | Lift logging, muscle groups, progressive overload ghosting, rest timer w/ audio chime, 1RM & PR badges |
| `/cardio` | ✅ Complete | 7 activity classes, duration, distance, heart rate, calories, intensity |
| `/nutrition` | ✅ Complete | 5 meal slots, OpenFoodFacts food database search, meal presets, copy from yesterday, macro pie chart |
| `/fasting` | ✅ Complete | 8 fasting protocols, live timer, web notifications, history |
| `/journal` | ✅ Complete | 5 guided reflection prompts, searchable history |
| `/photos` | ✅ Complete | 3 poses, ImageKit CDN upload & signed delivery, before/after slider |
| `/measurements` | ✅ Complete | 8-point body tape tracker, comparative line charts |
| `/analytics` | ✅ Complete | Category radar, weekday distribution, adaptive TDEE & metabolism calculator |
| `/calendar` | ✅ Complete | Custom 6-week month calendar, score-colored days, day inspection modal |
| `/achievements` | ✅ Complete | 12 milestone badges, tier gradients, auto-granting |
| `/challenges` | ✅ Complete | Multi-challenge lifecycle (start, edit, finish, abandon) |
| `/reports` | ✅ Complete | Printable coach reports (7d/30d), CSV export |
| `/settings` | ✅ Complete | Goals update, CSV export, full JSON backup & restore, danger zone |
| `/weight` | ✅ Complete | Multi-range weight charts, moving averages, history management |

---

## Project conventions

### Memory rules (must follow)
- **No new files unless asked.** If a new file is needed, ask the user to
  paste the code rather than creating it.
- Original code must be ported **verbatim** (not paraphrased).
- Sidebar primitive changes propagate through `sidebarMenuButtonVariants` —
  don't override classNames on individual `<SidebarMenuButton>` call sites.

### File structure
```
src/
  app/
    (app)/                  ← authenticated route group
      layout.tsx            ← SidebarProvider + Sidebar + SidebarInset shell
      dashboard/page.tsx
      checkin/{page,layout}.tsx
      weight/{page,layout}.tsx
    onboarding/{page,layout}.tsx   ← outside (app) so it has no sidebar
    auth/...
    api/...
  components/
    ui/                     ← shadcn primitives
    panel.tsx               ← PageHeader + Panel
    stat-card.tsx
    ring-progress.tsx
    heatmap.tsx
    success-modal.tsx
    weight-chart.tsx        ← UNUSED, can delete
  hooks/
    use-mobile.ts
  lib/
    api.ts                  ← `post()` helper for /api calls
    celebrate.ts            ← confetti for saved check-in
    chart-style.ts          ← shared Recharts tooltip styles
    data.ts                 ← TanStack Query hooks (useChallenges,
                              useToggleHabit, useDailyLogs, useSaveDailyLog,
                              useStartChallenge, useProfile, etc.)
    iron.ts                 ← date math, HABITS array, MOODS array,
                              movingAverage(), scoreColor(), quoteForDate()
    use-iron.ts             ← derived iron state from profile/challenges/logs
    utils.ts                ← `cn()` helper (clsx + tailwind-merge)
    types.ts
```

### Patterns established
- **Sibling server-only `layout.tsx` for metadata** — every client-component
  page that needs a `<title>` gets a sibling `layout.tsx` exporting
  `metadata`. Pattern: `app/(app)/<route>/page.tsx` ("use client") + sibling
  `app/(app)/<route>/layout.tsx` (server component, just renders children).
- **`seededRef` pattern** for form re-seeding — gate `useEffect` `setState`
  with a `useRef<string | null>(null)` so user edits survive re-renders
  triggered by stale query data. Only re-seed when the user explicitly picks
  a different date / record id.
- **`useSyncExternalStore` for localStorage** — used in any component that
  needs to persist UI state across navigation (sidebar collapsed state,
  etc.).

### Sidebar nav (current order, matches original Lovable)
Dashboard → Today → Habits → Weight → Measurement → Nutrition → Workouts →
Cardio → Fasting → Calendar → Analytics → Photos → Journal → Challenges →
Achievements → Reports → Settings (17 items).

Routes that don't exist yet will 404 — the sidebar links are pre-wired but
the pages will be built on demand when the user provides code.

### Active-tab highlight rules
- Active nav item: `bg-primary/10` + `text-primary` + 1px `ring-primary/30`
  outline (orange tint, less opaque than the original `bg-primary/15`).
- Hover: gray (`bg-sidebar-accent` + `text-sidebar-accent-foreground`).
- No double-highlighting: when two nav items would both match a route
  (e.g. Today + Weight both pointing to `/checkin`), the second one is
  suppressed. Currently Weight has its own `/weight` route, so this hack is
  not needed.

### Sidebar collapsed-mode sizing
- `SIDEBAR_WIDTH_ICON = "4rem"` (64px) — sidebar rail width.
- Icon-mode button: `!size-11` (44×44), icon `size-5` (20px), centered.
- `SidebarContent` has `overflow-y-auto` so all 17 items are reachable by
  scroll on short viewports.

### Icon hover animation
- `hover:[&>svg]:scale-110 hover:[&>svg]:translate-x-0.5` — icon scales to
  110% and slides 2px right over 150ms.
- `active:[&>svg]:scale-95` — icon shrinks 5% on click for tactile feedback.

### Dependencies
- `@radix-ui/react-dialog` ^1.1.23
- `@radix-ui/react-select` ^2.3.7
- `@radix-ui/react-separator` ^1.1.7
- `@radix-ui/react-sheet` (transitive via react-dialog)
- `@radix-ui/react-slot` ^1.3.3
- `@radix-ui/react-slider` ^1.3.6
- `@radix-ui/react-tooltip` ^1.2.8
- `class-variance-authority` ^0.7.1
- `tailwind-merge` ^3.6.0
- `tw-animate-css` ^1.4.0 (Tailwind v4 successor to `tailwindcss-animate`)

### Dev server
- `npm run dev` → Next.js 16.3.2 with Turbopack on port 3000.
- If a stale compile error appears, kill processes on port 3000
  (`powershell Get-NetTCPConnection -LocalPort 3000 | Stop-Process`) and
  clear `rm -rf .next/dev/types` before restarting.

---

## Things to watch out for

1. **Mongoose `findOneAndUpdate` deprecation warning** — uses old `new`
   option instead of `returnDocument: 'after'`. Cosmetic, not blocking.
2. **Browser warning** about `scroll-behavior: smooth` on `<html>` — add
   `data-scroll-behavior="smooth"` to silence. Cosmetic.
3. **`tw-animate-css` vs `tailwindcss-animate`** — Sheet + Tooltip snippets
   use `animate-in/fade-in-0/slide-in-from-*` utilities. Both packages
   provide these, but if the Sheet/Tooltip animations look broken (no fade,
   no slide), the fix is to swap the animation utility names for explicit
   Tailwind v4 transitions (`transition`, `duration-*`, `translate-*`).
4. **`tailwindcss-animate` import in `globals.css` is NOT `tailwindcss-animate`**
   — it's `tw-animate-css`. Don't add `tailwindcss-animate`.

---

## Resumption checklist

When you start a new session and the user says "continue" / "what's next":

1. Read `PROGRESS.md` (this file).
2. Read `FORGE_ANALYSIS.md` §13 for the route plan.
3. Read `AGENTS.md` + `CLAUDE.md` for project rules.
4. Read user's memory: `~/.claude/projects/.../memory/MEMORY.md` — surface
   any feedback rules.
5. Confirm what route the user wants to build next.
6. Ask the user to paste the original Lovable code for that route.
7. Convert TanStack Router → Next.js:
   - Move logic into a client `page.tsx` with `"use client"`.
   - Add a sibling server-only `layout.tsx` for metadata.
   - Replace `useNavigate()` → `useRouter().push()` from `next/navigation`.
   - Replace `<Link>` from `@tanstack/react-router` → `next/link`.
   - Strip TanStack Router file-based routing artifacts.
   - Replace shadcn `cn` import path if needed (`@/lib/utils` works here).
8. Verify: dev server compiles, route returns 200, no console errors.
9. Mark progress in this file (move the route from "Not started" to
   "Complete").

---

## Known TODOs in code (search for these)

```bash
grep -rn "TODO\|FIXME" src/
```

(If you add new TODOs, prefer adding them to this file's "Stubbed/TODO"
section rather than inline comments.)
