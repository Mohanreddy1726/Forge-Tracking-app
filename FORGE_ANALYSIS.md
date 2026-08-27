# Forge — Complete Reverse-Engineering Analysis

> **Source**: <https://iron-evolve-tracker.lovable.app> (published Lovable app, analyzed 2026-08-25)
> **Method**: Downloaded HTML + all 28 JS chunks + full CSS bundle; extracted routes, schemas, scoring logic, design tokens, and copy.
> **Purpose**: Single source of truth for rebuilding the app in Next.js + Node.js + MongoDB. Read THIS file instead of re-analyzing the site.
> **Note**: Original project name was apparently "Iron Evolve" (subdomain + auth-page logo shows `i`); landing/dashboard branding is now "Forge" with `F`.

---

## 1. App concept

A premium, dark-themed **180-day body transformation tracker**. Each account runs one private "challenge" (default 180 days): daily check-ins, 16 weighted habits scored out of 100, weight analytics with finish predictions, GitHub-style heatmap, workouts/cardio/nutrition/fasting logs, journaling, progress photos with before/after slider, achievements, and printable reports. Tagline: **"Build Yourself. Every Day."**

---

## 2. Original tech stack

| Layer | Technology |
| --- | --- |
| Framework | React 18 + Vite, **TanStack Router** (with SSR streaming), TanStack Query |
| Styling | Tailwind CSS v4, shadcn-style components, dark-only theme |
| Charts | Recharts (AreaChart, LineChart, BarChart, PieChart, RadarChart, PolarAngleAxis, ring progress) |
| Icons | lucide-react |
| Backend | **Supabase**: email/password Auth, Postgres (13 tables), Storage (`progress-photos` bucket) |
| Toasts | sonner-style (`toast.success/error`) |
| Fonts | Google Fonts: **Outfit** (300–700, sans) + **JetBrains Mono** (400/600, mono for numbers) |

---

## 3. Design system (exact tokens)

```css
--radius: 1rem;
--background:            oklch(16% .012 265);   /* near-black blue */
--foreground:            oklch(97% .005 260);
--card:                  oklch(21% .014 265);
--card-foreground:       oklch(97% .005 260);
--popover:               oklch(19% .014 265);
--primary:               oklch(72% .19 45);     /* EMBER ORANGE */
--primary-foreground:    oklch(18% .02 45);
--secondary:             oklch(27% .016 265);
--muted:                 oklch(25% .014 265);
--muted-foreground:      oklch(68% .018 262);
--accent:                oklch(72% .16 195);    /* cyan */
--destructive:           oklch(62% .22 22);     /* red */
--success:               oklch(72% .17 152);    /* green */
--warning:               oklch(80% .16 85);     /* amber */
--border: / --input:     oklch(30% .014 265);
--ring:                  oklch(72% .19 45);
--chart-1: oklch(72% .19 45);  --chart-2: oklch(72% .16 195);
--chart-3: oklch(72% .17 152); --chart-4: oklch(80% .16 85);
--chart-5: oklch(66% .19 320);
--gradient-ember: linear-gradient(135deg, oklch(72% .19 45) 0%, oklch(66% .2 15) 100%);
--gradient-steel: linear-gradient(160deg, oklch(24% .018 265) 0%, oklch(19% .014 265) 100%);
--gradient-glow:  radial-gradient(60% 60% at 50% 0%, oklch(72% .19 45/.18) 0%, transparent 100%);
--shadow-soft: 0 1px 0 0 oklch(100% 0 0/.04) inset, 0 20px 40px -24px oklch(0% 0 0/.8);
```

**Signature utility classes** (recreate these):

```css
.glass {
  backdrop-filter: blur(18px) saturate(140%);
  box-shadow: var(--shadow-soft);
  background: oklch(24% .016 265 / .55);
  border: 1px solid oklch(100% 0 0 / .07);
}
.ember-bg   { background-image: var(--gradient-ember); }
.ember-text { background-image: var(--gradient-ember); color: transparent;
              background-clip: text; -webkit-background-clip: text; }
.surface    { background-image: var(--gradient-steel); border: 1px solid var(--color-border);
              box-shadow: var(--shadow-soft); }
.animate-rise { animation: .45s cubic-bezier(.22,1,.36,1) both iron-rise; } /* rise+fade */
.hover-lift { transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s, border-color .25s; }
.hover-lift:hover { box-shadow: var(--shadow-glow);
  border-color: oklch(72% .19 45/.35); transform: translateY(-3px); }
```

**Score→color function** (`score >= n ? color`):

- ≥100 → `var(--color-success)` · ≥80 → `oklch(0.75 0.15 145)` · ≥60 → `var(--color-warning)` · ≥40 → `var(--color-primary)` · >0 → `var(--color-destructive)` · 0 → `var(--color-muted)`

**Achievement tier gradients**:

- bronze: `from-[oklch(0.62_0.12_60)] to-[oklch(0.45_0.10_40)]`
- silver: `from-[oklch(0.80_0.02_250)] to-[oklch(0.58_0.02_250)]`
- gold:   `from-[oklch(0.85_0.16_85)] to-[oklch(0.62_0.16_60)]`

Layout idioms: page container `space-y-6`; cards `glass rounded-2xl p-5/p-6` with title+description headers; stat grids `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`; forms `grid gap-3 sm:grid-cols-2 lg:grid-cols-3/6`; inputs `rounded-xl border border-input bg-background/60 py-2.5 px-3 text-sm focus:border-primary`; primary buttons `ember-bg rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground hover:scale-[1.03]`.

---

## 4. Routes / pages (TanStack Router)

| Route | Chunk name | Purpose |
| --- | --- | --- |
| `/` | routes | Landing page |
| `/auth` | auth | Sign in / Sign up (email+password) |
| `/onboarding` | onboarding | Profile + challenge setup wizard |
| `/dashboard` | dashboard | Main hub |
| `/checkin` | checkin | Daily check-in form |
| `/habits` | habits | Habit tracker + custom habits + day-type |
| `/workouts` | workouts | Lift logging w/ multi-set entries |
| `/cardio` | cardio | Cardio session logging |
| `/nutrition` | nutrition | Meal logging (+ pie chart) |
| `/fasting` | fasting | Fasting timer + protocols |
| `/journal` | journal | Daily reflection + searchable history |
| `/photos` | photos | Progress photos + before/after slider |
| `/measurements` | measurements | Tape measurements + charts |
| `/analytics` | analytics | Deep charts (radar, pie, lines) |
| `/heatmap` | heatmap | 180-day GitHub-style heatmap |
| `/reports` | reports | Printable summary (`print:hidden`, print styles) |
| `/achievements` | achievements | 12 badges, bronze/silver/gold |
| `/challenges` | challenges | Multiple challenge runs CRUD |
| `/settings` | settings | Program params, targets, danger zone |
| `/export` | export | CSV export |

Shared components: `stat-card`, `success-modal`, `ring-progress`, `heatmap`, `celebrate`. Central data hook: `useIron()` (see §9).

### Landing page copy (exact)

- Badge pill (trophy icon): "180 days. One version of you."
- H1: "Build Yourself. `Every Day.`" (the words "Every Day." wrapped in `ember-text`)
- Sub: "A single-user transformation command center. Weight, habits, nutrition, workouts, mood and photos — all scored, charted and streaked."
- CTA (ember-bg): "Start your 180 →" → `/auth`
- Header: `F` logo tile (ember-bg, rounded-xl) + "Forge"; right: "Sign in" → `/auth`
- Footer: "Forge — built for one disciplined human."
- 6 feature cards (glass hover-lift): Habit scoring / Weight trends / 180-day heatmap / Workout logs / Progress photos / Deep analytics (copy in §5 route table below matches)

---

## 5. Page-by-page detail

### /auth

- Logo tile letter: `i` (legacy Iron branding). Toggle tabs: signin/signup.
- Titles: "Welcome back" / "Start your 180"; subs: "Sign in to your dashboard" / "Create your private tracker".
- Email + password (minLength 6). Submit: "Sign in" / "Create account". Toggle link: "No account yet? Create one" / "Already have an account? Sign in".
- Flow: signUp({email,password,options:{emailRedirectTo: origin+/dashboard}}) then immediately signInWithPassword → toast "Account created. Signing you in…" → redirect `/dashboard`. Sign-in toast: "Welcome back.". Existing session auto-redirects to `/dashboard`.

### /onboarding

Fields: display_name ("Your name"), gender select (male/female/other, labels Male/Female/Other), age, height_cm ("Height (cm)").

Challenge section ("How long are you committing for?"): challenge name, start_date (date input, default today), length in days (preset buttons; validation **7–365**, message "Challenge length must be 7-365 days"), start_weight, goal_weight (kg).

Targets: calorie_goal, protein_goal (g), water_goal_ml, steps_goal, sleep_goal_hours, workout_days/week.

Success modal/toast: "Challenge started. Day 1 begins now." → redirect `/dashboard`. Card title "My Transformation".

### /dashboard

- Pre-start state banner: "Starts in ${daysUntilStart} day(s)".
- Progress ring card: "Day ${day} of ${programDays}" + completion % ring.
- Banner: "${daysRemaining} days remaining · ends ${endDate}".
- Stat tiles (grid of 4-col): Current weight (sub: "Start ${startWeight} kg") · Total lost (success accent, sub: "${lostPct}% of body weight") · Target weight (accent, sub: "${remainingToGoal} kg to go") · Weekly average (kg/wk, warning, sub: "Est. finish ${finishWeight} kg") · Current streak (sub: "Longest ${longestStreak} days") · Longest streak · Habit score.
- Side card: today's score big number + BMI.
- Weight area chart (Recharts AreaChart, gradient fill under curve).
- Active challenges preview card (name + status + start_date + days + ±kg vs start) with link "View all challenges →".
- CTA card linking `/checkin`.

### /checkin

Tagline: "Two minutes a day keeps the transformation honest."

Fields: date picker; Body group: weight (kg), steps, water (ml), sleep (hours); Mind group: sleep_quality slider (1–10, default 7), energy slider (1–10, default 7), mood emoji buttons (6 moods); notes textarea ("How did today actually go?"). Save → success-modal "Check-in saved".

Slider component shows mono value in primary color.

### /habits

Tagline: "Every habit is weighted. Hit them all for a perfect 100."

- Date picker; day-type selector (3 big buttons w/ emoji, active = `border-primary bg-primary/10`).
- Score ring (ring-progress size 150) + weekly/monthly average chips + "${n} habits" count.
- Habit toggle grid `sm:grid-cols-2 lg:grid-cols-4`: unchecked = dashed `bg-muted/10 opacity-50`; checked = solid success bg; hover = `group-hover:border-primary`. Each tile shows label + "${points} points" + category icon.
- Custom habits: "New custom habit" dialog — name (placeholder "Cold shower"), points number (**1–25**, error "Points must be between 1 and 25"), category select (Fitness/Nutrition/Health/Mind), icon optional. Delete via trash icon + window.confirm. Toasts: `Added "${name}"` / `Updated "${name}"`.
- See §6 for the 16 defaults.

### /workouts

Tagline: "Log every lift. Progression is proof." Helper: "Name the workout, add an exercise, then add as many sets as you want."

Form: date, workout name (placeholder "Push Day"), exercise (placeholder "Bench press"), sets array [{weight, reps}] with add-row UI, notes (optional).

Stats tiles: Sessions · Sets logged · Total volume (kg, success accent).

Validation: "Add an exercise name", "Add at least one set with reps". Edit + delete supported ("Set updated").

### /cardio

Tagline: "Every kilometre counts. Endurance is earned."

Fields: date, activity (placeholder "Running"), duration_min, distance_km, calories, avg_hr, intensity enum **easy/moderate/hard/max**, notes.

Stats tiles: Sessions · Total time (min) · Distance (km, success) · Calories burned (kcal).

### /nutrition

Meal slots (fixed): `breakfast, lunch, dinner, snacks, protein_shake` labeled Breakfast/Lunch/Dinner/Snacks/Protein Shake. Pie chart (Recharts PieChart) of distribution. Logs per date.

### /fasting

Tagline: "Intermittent, full-day or custom — the timer keeps you honest."

Protocols (hours): **12, 14, 16, 18, 20, 23, 24, 36** + custom target input ("${h}h custom"). Each protocol has key/hours/blurb.

Timer: live HH:MM:SS elapsed (padStart 2), ring/bar "% of ${target}h". Complete state: "Fast complete · ${h}h of ${target}h target".

Stats tiles: Fasts completed · Targets hit (success, "of ${count} fasts") · Longest fast (accent) · Average fast (h).

### /journal

Five prompts (key / label / sub-label):

- win / "Today's win" / "What went right?"
- mistake / "Today's mistake" / "What would you redo?"
- gratitude / "Grateful for" / "One thing you're thankful for"
- tomorrow_goal / "Tomorrow's one goal" / "The single most important thing"
- reflection / "Free reflection" / "Anything else on your mind"

History list with client-side search filter; entries show date + win/goal snippets. Success modal "Journal saved".

### /photos

Poses: **front / side / back**. Upload (file input accept images) → Supabase Storage bucket `progress-photos`, path stored in DB; signed URLs fetched for display. Grid grouped by pose ("${pose} photo · ${count}").

Before/After mode: pick two dates per pose, comparison slider (drag divider, width style %). Delete photo (storage.remove + row delete). Toasts: "Photo uploaded" / "Upload failed".

### /measurements

Tagline: "Log weekly. The scale lies, the tape doesn't."

Fields (cm): **chest, waist, hip, neck, biceps, forearm, thigh, calf**. Line chart comparing First vs Latest per site (legend: First muted / Latest primary). History table (dates × sites). Empty state: "No measurements yet". Success modal "Measurements saved".

### /analytics

Recharts-heavy: RadarChart (habit categories), PieChart, LineCharts. Covers sleep, mood, water, protein, consistency trends. (Chunk mostly Recharts internals; visuals built from same data hooks.)

### /heatmap

GitHub-style: columns = weeks, rows = weekdays, cell color = scoreColor(score) with opacity (score 0 → .45; no data → .35). Tooltip: "${date} — ${score}" / "no data". Legend swatches at scores [10,40,60,80,100]. Links to `/calendar` view.

### /reports

Tagline: "A clean summary you can print, save or send to your coach."

Period selector chips ("Last ${n} days" presets). Print button (window.print, printer icon; `print:` Tailwind variants used).

Summary stats: strong days, missed days, workout days, avg calories, weight delta (decimals 1, accent success/warning by sign). Line: "Day ${day} of 180 · ${strong} strong days · ${missed} missed days".

Full table: date · day-of-program · score · habits count · mood · sleep hours (reverse chronological).

### /achievements

12 badges (see §8). Locked style: `border-border bg-muted/20 opacity-60`; unlocked: tier gradient. Progress header "X of Y unlocked". Counter includes legacy keys (`no_junk`, `water` alongside `_30` versions).

### /challenges

Tagline: "Every run you have committed to, past and present."

CRUD: New Challenge form mirrors onboarding (name, start_date, length 7–365, start_weight, goal_weight; presets row). Status badge "active". Shows ±kg since start ("${delta} kg"), ended_at, days run. Edit → "Challenge updated". Delete confirm: `Delete "${name}"? This cannot be undone.` → "Challenge deleted". Prefills from current stats.

### /settings

Tagline: "Your program parameters and daily targets."

Profile & goals form: display_name, gender select, start_date, numeric grid (lg:grid-cols-3) of all targets with step attributes (same set as onboarding). Save → "Settings saved".

Data section: CSV download of stats (date,score,weight,habits joined). Danger zone: reset all data (typed confirm, clears query cache → toast), delete account ("Account deleted") → sign out → `/auth`.

### /export

Client-side CSV generator: proper escaping (`/[",\n]/ → wrap in quotes, double quotes`), Blob download. Exports each dataset.

---

## 6. The 16 default habits (exact)

Categories order: `["Fitness","Nutrition","Health","Mind"]`. Total = **140 pts**.

| # | key | label | category | points | icon |
| --- | --- | --- | --- | --- | --- |
| 1 | workout | Workout | Fitness | 20 | Dumbbell |
| 2 | cardio | Cardio | Fitness | 5 | HeartPulse |
| 3 | stretching | Stretching | Fitness | 5 | StretchHorizontal |
| 4 | steps | Steps Goal | Fitness | 10 | Footprints |
| 5 | calories | Calories Logged | Nutrition | 15 | Flame |
| 6 | protein | Protein Goal | Nutrition | 15 | Beef |
| 7 | no_junk | No Junk Food | Nutrition | 5 | Ban |
| 8 | no_sugar | No Sugar | Nutrition | 5 | CandyOff |
| 9 | meal_prep | Meal Prep | Nutrition | 5 | ChefHat |
| 10 | water | Water Goal | Health | 15 | Droplets |
| 11 | vitamins | Vitamins | Health | 5 | Pill |
| 12 | sleep | Sleep Goal | Health | 15 | Moon |
| 13 | reading | Reading | Mind | 5 | BookOpen |
| 14 | meditation | Meditation | Mind | 5 | Brain |
| 15 | journal | Journal | Mind | 5 | PenLine |
| 16 | coding | Coding | Mind | 5 | Code2 |

**Custom habits** append to this list (points 1–25, any of the 4 categories).

---

## 7. Scoring engine (exact logic)

```js
const TOTAL_POINTS = sum(all habit points); // 140 with defaults

// Day types — excused habits are removed from BOTH numerator eligibility and denominator
const EXCUSED = {
  normal: [],
  rest:   ["workout","cardio","stretching","steps"],          // training excused
  cheat:  ["calories","protein","no_junk","no_sugar","meal_prep"], // diet excused
};
// Copy:
// normal: "All habits count toward your score."        ⚡
// rest:   "Training habits are excused — recovery is part of the plan." 😴
// cheat:  "Diet habits are excused — eat, enjoy, don't lose the streak." 🍕

function applicableHabits(dayType, customHabits) {
  const excused = new Set(EXCUSED[dayType] ?? []);
  return [...DEFAULT_HABITS, ...customHabits].filter(h => !excused.has(h.key));
}
function computeScore(doneKeys, dayType = "normal", customHabits = []) {
  const done = new Set(doneKeys);
  const applicable = applicableHabits(dayType, customHabits);
  const denom = applicable.reduce((s,h)=>s+h.points,0) || TOTAL_POINTS;
  const earned = applicable.filter(h=>done.has(h.key)).reduce((s,h)=>s+h.points,0);
  return Math.round(earned/denom*100);
}
```

**Moods** (emoji / label / numeric score):

amazing 😁 6 · great 😊 5 · good 🙂 4 · neutral 😐 3 · low 😔 2 · angry 😡 1

**Streak rule**: consecutive days with `score >= threshold` (threshold default **60**; function signature `computeStreaks(days, threshold=60)`): longest scans all history; current counts back from most recent day.

---

## 8. Achievements (exact, 12)

| key | title | description | icon | tier |
| --- | --- | --- | --- | --- |
| streak_7 | 7 Day Streak | Seven days in a row | Flame | bronze |
| streak_30 | 30 Day Streak | A full month unbroken | Flame | silver |
| day_50 | 50 Days In | Reached day 50 | Calendar | bronze |
| day_100 | 100 Days In | Reached day 100 | Calendar | silver |
| day_180 | 180 Complete | Finished the program | Trophy | gold |
| lose_5 | Lose 5kg | Down 5kg from start | TrendingDown | bronze |
| lose_10 | Lose 10kg | Down 10kg from start | TrendingDown | gold |
| goal_weight | Target Hit | Reached your goal weight | Target | gold |
| workouts_100 | 100 Workouts | Logged 100 workout sessions | Dumbbell | gold |
| no_junk_30 | 30 Days Clean | 30 days of no junk food | Salad | silver |
| water_30 | Hydrated | Hit your water goal 30 times | Droplets | bronze |
| perfect_day | Perfect Day | Scored 100 in a single day | Star | silver |

(Legacy unlock keys `no_junk`, `water` still counted in the progress total.)

---

## 9. Derived stats — `useIron()` hook (formulas decoded)

Central hook combining: `profile`, `logs` (daily_logs), `habits` (custom_habits), `stats` (scored days). All memoized. Computed values:

```text
programDays      = profile.program_days ?? 180
startDate        = profile.start_date ?? today
notStarted       = today < startDate
daysUntilStart   = 1 - dayNumber  (when negative-day)
day              = clamp(daysBetween(startDate, today) + 1, …, programDays)   // 0 if not started
endDate          = startDate + (programDays - 1) days
daysRemaining    = max(0, programDays - day)
completionPct    = round(day / programDays * 100)
elapsedDays      = max(0, daysBetween(startDate, today) + 1)

currentWeight    = last logged weight ?? start_weight ?? 0
lost             = round((start_weight - currentWeight)*10)/10
lostPct          = start_weight ? round(lost/start_weight*1000)/10 : 0     // % body weight
weeksElapsed     = max(1, day/7)
weeklyAvgLoss    = round(lost/weeksElapsed*100)/100                        // kg/wk
remainingToGoal  = round((currentWeight - goal_weight)*10)/10
finishWeight     = weeklyAvgLoss > 0
                   ? round((currentWeight - weeklyAvgLoss*((programDays-day)/7))*10)/10
                   : currentWeight                       // linear-trend projection
etaDate          = weeklyAvgLoss > 0 ? today + round(goalRemaining/weeklyAvgLoss)*7 days : null
bmi              = bmi(currentWeight, height_cm)

currentStreak / longestStreak   = computeStreaks(scoredDays, 60)
avgScore (allTime) = round(mean(all daily scores))
todayScore         = today's score ?? 0
todayHabits        = today's done habit keys
weekly  = mean score last 7 logged-range days
monthly = mean score last 30
```

Also exposes `isLoading` (any of the 4 queries pending).

---

## 10. Database schema (13 Supabase tables → MongoDB collections)

| Table | Fields observed (from queries/forms) |
| --- | --- |
| profiles | id (=auth user id), display_name, gender, age, height_cm, start_date, program_days, start_weight, goal_weight, calorie_goal, protein_goal, water_goal_ml, steps_goal, sleep_goal_hours, workout_days, active_challenge_id, onboarding_completed |
| daily_logs | user_id, log_date (unique per user+date), weight, steps, water_ml, sleep_hours, sleep_quality (1–10), energy (1–10), mood (enum 6), day_type (normal/rest/cheat), notes |
| habit_logs | **one row per habit per day**: user_id, log_date, habit_key, completed (bool); unique (user_id, log_date, habit_key); upserted on toggle |
| custom_habits | user_id, key, label, category, points (1–25), icon |
| workout_logs | user_id, log_date, name, exercises[] {exercise, weight, reps}, notes |
| cardio_logs | user_id, log_date, activity, duration_min, distance_km, calories, avg_hr, intensity (easy/moderate/hard/max), notes |
| activity_logs | 14th table — generic activity rows (user_id, log_date, created_at + payload); used by useActivityLogs/useInsertRow/useUpdateRow |
| nutrition_logs | user_id, log_date, meals keyed breakfast/lunch/dinner/snacks/protein_shake |
| fasting_logs | user_id, plan (key), target_hours, started_at, ended_at, notes |
| journal | user_id, log_date, win, mistake, gratitude, tomorrow_goal, reflection |
| measurements | user_id, log_date, chest, waist, hip, neck, biceps, forearm, thigh, calf |
| photos | user_id, pose (front/side/back), storage_path, uploaded_at |
| achievements | user_id, key, unlocked_at |
| challenges | user_id, name, start_date, days, start_weight, goal_weight, status (active/completed/abandoned), ended_at, end_weight; starting a new challenge ends active ones (status + end_weight = last logged weight) and syncs profile |

Key lifecycle logic from data.ts: `useStartChallenge` ends all active challenges (records end_weight from latest daily_log weight), inserts the new one, then updates profile (start_date/program_days/start_weight/goal_weight/active_challenge_id/onboarding_completed=true). `useFinishChallenge` sets completed/abandoned + clears profile.active_challenge_id. `useUpdateChallenge` syncs profile when editing the active one.

Storage: Supabase bucket `progress-photos`, objects keyed by user/path; photos page fetches signed URLs.

**Auth**: Supabase email/password. Client checks `getSession()` on mount; guarded pages redirect to `/auth`; after sign-in redirect `/dashboard`.

---

## 11. Proposed target architecture (for the rebuild)

- **Next.js (App Router) + TypeScript** — reuse Tailwind v4 theme tokens (§3), recreate `.glass/.ember-bg/.hover-lift/.animate-rise`, Outfit + JetBrains Mono via next/font.
- **API routes (Node runtime)** under `app/api/*` replacing all Supabase calls; or separate Express server if preferred.
- **MongoDB + Mongoose**: one collection per table above; indexes on `{userId, log_date}` unique compound; photos on local disk/S3-compatible storage behind `/api/photos` upload/stream endpoints.
- **Auth**: JWT in httpOnly cookie (or NextAuth credentials provider); middleware guards `/dashboard`, `/checkin`, etc. → redirect `/auth`; onboarding-completion flag gates `/dashboard` → `/onboarding`.
- **Port scoring/stats verbatim** from §6–§9 into shared lib (`lib/scoring.ts`, `lib/stats.ts`) so numbers match the original exactly.
- TanStack Router pages → App Router routes (same paths); TanStack Query can be kept (works in Next) or replaced with server components + server actions.

---

## 12. Asset URLs (for re-download if ever needed)

Base: `https://iron-evolve-tracker.lovable.app/assets/`

Key chunks: `index-DH9arkNx.js` (router/vendor), `routes-CppC7273.js` (landing), `data-7a9V7gNe.js` (schemas/scoring/achievements — 53KB, richest file), `use-iron-CGRF6t4h.js` (stats hook), `styles-DY0Y72vD.css` (full theme). Local copies downloaded to `/tmp/forge_assets/` during analysis (may not persist).

---

## 13. Port progress log

Rebuild lives in this folder (Next.js 16 App Router + TS + Tailwind v4). Original files received so far: landing (`routes/index.tsx`), `__root.tsx`, `dashboard.tsx`, `checkin.tsx`, `styles.css`, `lib/iron.ts`, `lib/data.ts`.

Done:

- Landing page, layout (fonts via next/font: Outfit + JetBrains Mono as `--font-outfit`/`--font-jetbrains`), providers (TanStack Query + sonner Toaster top-right richColors), not-found (ember 404), error boundary → `src/app/*`
- `globals.css` = faithful port of styles.css (@theme inline tokens incl. radius-sm…4xl scale derived from --radius:1rem, sidebar tokens, @utility glass/surface/ember-text/ember-bg/hover-lift/animate-rise, iron-rise keyframes, body gradient-glow 100%×640px, scrollbar styling); tw-animate-css installed
- `src/lib/iron.ts` ported verbatim (HABITS/DAY_TYPES/MOODS/QUOTES/ACHIEVEMENTS + date/bmi/movingAverage/scoreColor/scoreForKeys helpers)
- All shared components ported: panel (PageHeader/Panel/EmptyState), stat-card, animated-counter, ring-progress, heatmap (TanStack Link→next/link), success-modal, ui/skeleton, ui/dialog, ui/select, ui/button (STAND-IN until original arrives); libs chart-style, celebrate ("use client" added where hooks/runtime need it)
- **Backend built** (replaces Supabase): Mongoose models in `src/server/models.ts` (all 14 tables, snake_case fields, toJSON→id); session via jose JWT in httpOnly cookie (`src/server/session.ts`); bcrypt signup/signin/signout/me under `/api/auth/*`; REST endpoints `/api/profile`, `/api/daily-logs`, `/api/habit-logs`, `/api/custom-habits`, `/api/challenges(+start,[id],[id]/finish)`, `/api/logs/[table]` (nutrition/workout/cardio/activity/photos/fasting), `/api/measurements`, `/api/journal`, `/api/achievements`; challenge lifecycle (start ends actives w/ last weight + syncs profile) implemented server-side
- `src/lib/types.ts` (row types replacing Tables<>), `src/lib/api.ts` (fetch wrapper), `src/lib/data.ts` (ALL original hooks reimplemented 1:1 against /api), `src/lib/use-iron.ts` verbatim
- `/auth` page ported to /api/auth (same copy incl. legacy "i" logo); `src/proxy.ts` guards all app routes + redirects signed-in users away from /auth (Next 16 renamed middleware→proxy)
- Deps: lucide-react, recharts, sonner, @tanstack/react-query, clsx, tailwind-merge, tw-animate-css, @radix-ui/react-dialog/select/slot, class-variance-authority, canvas-confetti, mongoose, bcryptjs, jose

Pending original files: ui/button.tsx original, remaining route pages (onboarding, habits, workouts, cardio, nutrition, fasting, journal, photos, measurements, analytics, heatmap, calendar, reports, achievements, challenges, settings, export), _authenticated.tsx (superseded by proxy.ts but useful for nav/shell layout), integrations/supabase/types.ts not needed.

Setup required: `.env.local` with MONGODB_URI (+ JWT_SECRET) per `.env.example`.
