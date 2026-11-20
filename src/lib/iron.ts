export const PROGRAM_DAYS = 180;

export type HabitCategory = "Fitness" | "Nutrition" | "Health" | "Mind";

export type HabitDef = {
  key: string;
  label: string;
  category: HabitCategory;
  points: number;
  icon: string;
};

export const HABITS: HabitDef[] = [
  { key: "workout", label: "Workout", category: "Fitness", points: 20, icon: "Dumbbell" },
  { key: "cardio", label: "Cardio", category: "Fitness", points: 5, icon: "HeartPulse" },
  { key: "stretching", label: "Stretching", category: "Fitness", points: 5, icon: "StretchHorizontal" },
  { key: "steps", label: "Steps Goal", category: "Fitness", points: 10, icon: "Footprints" },
  { key: "calories", label: "Calories Logged", category: "Nutrition", points: 15, icon: "Flame" },
  { key: "protein", label: "Protein Goal", category: "Nutrition", points: 15, icon: "Beef" },
  { key: "no_junk", label: "No Junk Food", category: "Nutrition", points: 5, icon: "Ban" },
  { key: "no_sugar", label: "No Sugar", category: "Nutrition", points: 5, icon: "CandyOff" },
  { key: "meal_prep", label: "Meal Prep", category: "Nutrition", points: 5, icon: "ChefHat" },
  { key: "water", label: "Water Goal", category: "Health", points: 15, icon: "Droplets" },
  { key: "vitamins", label: "Vitamins", category: "Health", points: 5, icon: "Pill" },
  { key: "sleep", label: "Sleep Goal", category: "Health", points: 15, icon: "Moon" },
  { key: "reading", label: "Reading", category: "Mind", points: 5, icon: "BookOpen" },
  { key: "meditation", label: "Meditation", category: "Mind", points: 5, icon: "Brain" },
  { key: "journal", label: "Journal", category: "Mind", points: 5, icon: "PenLine" },
  { key: "coding", label: "Coding", category: "Mind", points: 5, icon: "Code2" },
];

export const HABIT_CATEGORIES: HabitCategory[] = ["Fitness", "Nutrition", "Health", "Mind"];

export const MAX_POINTS = HABITS.reduce((sum, h) => sum + h.points, 0);

export type DayType = "normal" | "rest" | "cheat";

export const DAY_TYPES: {
  value: DayType;
  label: string;
  emoji: string;
  description: string;
}[] = [
  { value: "normal", label: "Normal day", emoji: "⚡", description: "All habits count toward your score." },
  { value: "rest", label: "Rest day", emoji: "😴", description: "Training habits are excused — recovery is part of the plan." },
  { value: "cheat", label: "Cheat day", emoji: "🍕", description: "Diet habits are excused — eat, enjoy, don't lose the streak." },
];

/** Habits that are not required (and not counted) on a given day type. */
export const DAY_TYPE_EXEMPT: Record<DayType, string[]> = {
  normal: [],
  rest: ["workout", "cardio", "stretching", "steps"],
  cheat: ["calories", "protein", "no_junk", "no_sugar", "meal_prep"],
};

export function habitsForDayType(dayType: DayType = "normal", extra: HabitDef[] = []): HabitDef[] {
  const exempt = new Set(DAY_TYPE_EXEMPT[dayType] ?? []);
  return [...HABITS, ...extra].filter((h) => !exempt.has(h.key));
}

export function scoreForKeys(keys: string[], dayType: DayType = "normal", extra: HabitDef[] = []): number {
  const set = new Set(keys);
  const eligible = habitsForDayType(dayType, extra);
  const max = eligible.reduce((s, h) => s + h.points, 0) || MAX_POINTS;
  const points = eligible.filter((h) => set.has(h.key)).reduce((s, h) => s + h.points, 0);
  return Math.round((points / max) * 100);
}

export const MOODS = [
  { value: "amazing", emoji: "😁", label: "Amazing", score: 6 },
  { value: "great", emoji: "😊", label: "Great", score: 5 },
  { value: "good", emoji: "🙂", label: "Good", score: 4 },
  { value: "neutral", emoji: "😐", label: "Neutral", score: 3 },
  { value: "low", emoji: "😔", label: "Low", score: 2 },
  { value: "angry", emoji: "😡", label: "Angry", score: 1 },
];

export const MEALS = ["breakfast", "lunch", "dinner", "snacks", "protein_shake"] as const;
export const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
  protein_shake: "Protein Shake",
};

export const MEASUREMENT_FIELDS = [
  "chest",
  "waist",
  "hip",
  "neck",
  "biceps",
  "forearm",
  "thigh",
  "calf",
] as const;

export const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "You don't have to be extreme, just consistent.",
  "The iron never lies to you.",
  "Small daily improvements are the key to staggering long-term results.",
  "Suffer the pain of discipline or suffer the pain of regret.",
  "Motivation gets you started. Habit keeps you going.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "One day or day one. You decide.",
  "Nobody cares. Work harder.",
  "The only bad workout is the one that didn't happen.",
  "Progress, not perfection.",
  "Win the morning, win the day.",
];

export function quoteForDate(date: Date): string {
  const seed = Math.floor(date.getTime() / 86400000);
  return QUOTES[seed % QUOTES.length]!;
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}

export function programDay(startDate: string, on = todayStr()): number {
  return Math.min(PROGRAM_DAYS, Math.max(1, daysBetween(startDate, on) + 1));
}

export function bmi(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function movingAverage(values: (number | null)[], window = 7): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v != null);
    if (!slice.length) return null;
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 100) / 100;
  });
}

export function scoreColor(score: number): string {
  if (score >= 100) return "var(--color-success)";
  if (score >= 80) return "oklch(0.75 0.15 145)";
  if (score >= 60) return "var(--color-warning)";
  if (score >= 40) return "var(--color-primary)";
  if (score > 0) return "var(--color-destructive)";
  return "var(--color-muted)";
}

export function formatDateLabel(s: string): string {
  return parseDate(s).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const ACHIEVEMENTS: {
  key: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
}[] = [
  { key: "streak_7", title: "7 Day Streak", description: "Seven days in a row", icon: "Flame", tier: "bronze" },
  { key: "streak_30", title: "30 Day Streak", description: "A full month unbroken", icon: "Flame", tier: "silver" },
  { key: "day_50", title: "50 Days In", description: "Reached day 50", icon: "Calendar", tier: "bronze" },
  { key: "day_100", title: "100 Days In", description: "Reached day 100", icon: "Calendar", tier: "silver" },
  { key: "day_180", title: "180 Complete", description: "Finished the program", icon: "Trophy", tier: "gold" },
  { key: "lose_5", title: "Lose 5kg", description: "Down 5kg from start", icon: "TrendingDown", tier: "bronze" },
  { key: "lose_10", title: "Lose 10kg", description: "Down 10kg from start", icon: "TrendingDown", tier: "gold" },
  { key: "goal_weight", title: "Target Hit", description: "Reached your goal weight", icon: "Target", tier: "gold" },
  { key: "workouts_100", title: "100 Workouts", description: "Logged 100 workout sessions", icon: "Dumbbell", tier: "gold" },
  { key: "no_junk_30", title: "30 Days Clean", description: "30 days of no junk food", icon: "Salad", tier: "silver" },
  { key: "water_30", title: "Hydrated", description: "Hit your water goal 30 times", icon: "Droplets", tier: "bronze" },
  { key: "perfect_day", title: "Perfect Day", description: "Scored 100 in a single day", icon: "Star", tier: "silver" },
];

export type ForgeLevel = {
  level: number;
  title: string;
  minScore: number;
  maxScore: number;
};

export const FORGE_LEVELS: ForgeLevel[] = [
  { level: 1, title: "Spark", minScore: 0, maxScore: 500 },
  { level: 2, title: "Anvil", minScore: 500, maxScore: 1500 },
  { level: 3, title: "Iron", minScore: 1500, maxScore: 3500 },
  { level: 4, title: "Tempered", minScore: 3500, maxScore: 7000 },
  { level: 5, title: "Obsidian", minScore: 7000, maxScore: 12000 },
  { level: 6, title: "Forge Master", minScore: 12000, maxScore: Infinity },
];

export function getForgeLevel(totalScore: number): ForgeLevel {
  const lvl = FORGE_LEVELS.slice().reverse().find((l) => totalScore >= l.minScore);
  return lvl ?? FORGE_LEVELS[0]!;
}
