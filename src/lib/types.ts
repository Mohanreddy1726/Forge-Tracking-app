/*
 * Row types mirroring the original Supabase tables 1:1 (snake_case fields).
 * These replace the generated Database<Tables<"...">> types.
 */

export interface Profile {
  id: string;
  display_name?: string | null;
  gender?: string | null;
  age?: number | null;
  height_cm?: number | null;
  start_date?: string | null;
  program_days?: number | null;
  start_weight?: number | null;
  goal_weight?: number | null;
  calorie_goal?: number | null;
  protein_goal?: number | null;
  water_goal_ml?: number | null;
  steps_goal?: number | null;
  sleep_goal_hours?: number | null;
  workout_days?: number | null;
  active_challenge_id?: string | null;
  onboarding_completed?: boolean | null;
}

export interface DailyLog {
  id: string;
  log_date: string;
  weight?: number | null;
  steps?: number | null;
  water_ml?: number | null;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  energy?: number | null;
  mood?: string | null;
  day_type?: string | null;
  notes?: string | null;
}

export interface HabitLog {
  id: string;
  log_date: string;
  habit_key: string;
  completed: boolean;
}

export interface CustomHabit {
  id: string;
  habit_key: string;
  label: string;
  category: string;
  points: number;
  icon?: string | null;
}

export interface NutritionLog {
  id: string;
  log_date?: string | null;
  [key: string]: unknown;
}

export interface WorkoutLog {
  id: string;
  log_date?: string | null;
  name?: string | null;
  exercises?: { exercise: string; weight?: number | null; reps?: number | null }[] | null;
  notes?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface CardioLog {
  id: string;
  log_date?: string | null;
  activity?: string | null;
  duration_min?: number | null;
  distance_km?: number | null;
  calories?: number | null;
  avg_hr?: number | null;
  intensity?: string | null;
  notes?: string | null;
  [key: string]: unknown;
}

export interface ActivityLog {
  id: string;
  log_date?: string | null;
  [key: string]: unknown;
}

export interface Measurement {
  id: string;
  log_date: string;
  chest?: number | null;
  waist?: number | null;
  hip?: number | null;
  neck?: number | null;
  biceps?: number | null;
  forearm?: number | null;
  thigh?: number | null;
  calf?: number | null;
}

export interface JournalEntry {
  id: string;
  log_date: string;
  win?: string | null;
  mistake?: string | null;
  gratitude?: string | null;
  tomorrow_goal?: string | null;
  reflection?: string | null;
}

export interface PhotoRow {
  id: string;
  pose?: "front" | "side" | "back" | null;
  storage_path: string;
  log_date?: string | null;
}

export interface AchievementRow {
  id: string;
  achievement_key: string;
  unlocked_at?: string | null;
}

export interface Challenge {
  id: string;
  name: string;
  start_date: string;
  days: number;
  start_weight: number;
  goal_weight: number;
  status: string;
  ended_at?: string | null;
  end_weight?: number | null;
}

export interface FastingLog {
  id: string;
  plan?: string | null;
  target_hours?: number | null;
  started_at?: string | null;
  ended_at?: string | null;
  notes?: string | null;
}
