# Forge – Improvement Wishlist

This document collects all visual and functional ideas that could make the **Forge** app more interesting, cool, and engaging.  It serves as a living reference for the upcoming implementation phases.

---

## 🎨 Visual & UX Polish

| # | Idea | Why it matters |
|---|------|-----------------|
| 1 | **Dark‑mode toggle** – store preference (localStorage or user profile) | Allows users to work comfortably in any lighting condition. |
| 2 | **Design‑system tokens** – central `src/theme.ts` for colors, fonts, spacing | Guarantees consistent branding and makes future color tweaks trivial. |
| 3 | **Landing‑page hero carousel** with animated gradient / progress preview | Gives first‑time visitors an immediate sense of progress and excitement. |
| 4 | **Animated progress rings** – SVG stroke‑dashoffset animation, hover pulse | Adds a gamified “level‑up” feel when milestones are reached. |
| 5 | **Enhanced charts** – gradient‑filled area/line charts, zoom‑pan, brush selector, toggle view types | Makes data exploration richer and more insightful for power users. |
| 6 | **Micro‑animations** (button press, page transitions, confetti on goal) using `framer‑motion` or CSS | Small motion cues make interactions feel rewarding without being noisy. |
| 7 | **Customizable dashboard widgets** – drag‑and‑drop layout, persisted per user | Users get a personalized view rather than a one‑size‑fits‑all page. |
| 8 | **Responsive‑first design audit** – ensure all tables/charts live in `overflow‑x:auto`, mobile‑first sidebar/tab bar | Guarantees a smooth experience on phones, tablets, and desktops. |
| 9 | **Typography hierarchy** – Google Fonts for headings (`Outfit`) + monospaced for numbers, consistent Tailwind utilities | Improves readability and visual polish. |
|10| **Dark‑mode‑friendly images** – two logo versions swapped via `prefers-color-scheme` | Keeps branding crisp in both themes. |
|11| **Accessibility audit** – ARIA labels, color‑contrast, keyboard focus outlines | Makes the app usable for a broader audience and future‑proofs for compliance. |
|12| **Loading skeletons** – use existing `Skeleton` component for async sections (charts, habit list, profile) | Reduces perceived latency and feels modern. |

---

## ⚙️ Functional & Feature Extensions

| # | Feature | Sketch of Implementation |
|---|---------|---------------------------|
| 1 | **Badges / Achievements** – reward streaks, weight‑loss milestones, habit consistency. Store in a new `Badge` collection and display on the profile page. | Add `Badge` model, UI component, `useBadges` hook. |
| 2 | **Goal‑setting wizard** – multi‑step onboarding that gathers target weight, challenge length, habit priorities and suggests a starter plan. | Use `useReducer` or a small state machine; persist partial data locally. |
| 3 | **AI‑driven daily tips** – based on recent logs suggest a habit (“drink 500 ml more water”). | Small server endpoint runs a regression / rule‑engine; UI shows tip cards. |
| 4 | **Weight‑loss forecast** – extrapolate future weight assuming current trend and display an estimated target date. | Use linear regression on `iron.stats`; show in dashboard. |
| 5 | **Export / Import** – CSV/JSON export of all logs (already partially there) and an import UI that parses the file and bulk‑inserts rows. | Re‑use `downloadCsv`; add file‑upload component that calls bulk API. |
| 6 | **Push notifications / reminders** – ask user to enable browser notifications for daily check‑ins, streak warnings, challenge end alerts. | Register a service‑worker, expose `/api/notify` endpoint, schedule with `CronCreate`. |
| 7 | **Social sharing** – one‑click share‑my‑progress button that generates a stylized PNG of the weight chart + tagline, then opens Twitter/Instagram share dialog. | New `ShareCard` component; backend route returns a PNG blob (e.g., `node‑canvas`). |
| 8 | **Health‑app integrations** – connect to Apple Health / Google Fit to sync weight, steps, sleep automatically. | OAuth flow, store tokens in profile; scheduled sync jobs. |
| 9 | **Webhook endpoint** – allow third‑party services (Zapier, IFTTT) to receive progress events. | Simple `/api/webhooks/progress` that posts JSON payloads. |
|10| **Custom habit library** – searchable list of common habits (drink water, meditate) with one‑click add, plus user‑created habits. | Extend `CustomHabit` UI with a dropdown and “favorite” flag. |
|11| **Progress‑photo carousel** – swipeable carousel (or scroll‑snap) for before/after images, with timeline slider. | Use existing `PhotoRow` data, implement a `Carousel` component. |
|12| **In‑app help / guided tour** – walkthrough using `react‑joyride` or custom tooltip steps for new users. | Trigger on first sign‑in or via a “Help” button. |
|13| **Multi‑language support** – i18n using `next‑i18next`; store locale in user profile. | Wrap strings with `t('key')`. |
|14| **Performance tuning** – adjust React Query stale‑time, lazy‑load heavy pages with `next/dynamic`. | Small code changes for a snappier UI. |
|15| **Central error boundary** – friendly modal with retry, logs errors to a server endpoint. | Wrap `AppLayout` in an `<ErrorBoundary>` component. |
|16| **Heat‑map legend toggle** – let users switch between score heat‑map and habit‑completion heat‑map, with a color picker. | Extend `Heatmap` component props. |
|17| **User‑driven accent colors** – color picker that updates CSS `--color-primary` at runtime, stored in profile. | Simple component that writes a `<style>` tag with the chosen value. |
|18| **Real‑time collaborative view (future)** – allow a coach to watch a user’s dashboard live via WebSocket. | Overkill for now but a cool future idea. |

---

## 📋 Next Steps
1. **Create the file** – this `IMPROVEMENTS.md` now lives in the project root and serves as the source of truth for the roadmap.
2. **Prioritise** – decide which visual or functional improvement you want to tackle first (e.g., dark‑mode toggle is a quick win).
3. **Create tasks** – each item can be turned into a task via Claude Code’s task list (`TaskCreate`) for tracking.
4. **Iterate** – implement, test, and mark completed; then move on to the next item.

Feel free to edit this file, reorder items, or add additional ideas as the product evolves. Happy building! 🚀