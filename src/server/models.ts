import { Schema, model, models, type SchemaDefinition } from "mongoose";

/*
 * Mongoose models mirroring the original Supabase schema 1:1 (snake_case
 * fields preserved so client code ports unchanged). Documents serialize
 * with `id` (string) instead of `_id`/`__v`.
 */

function baseOptions(s: Schema) {
  s.set("toJSON", { virtuals: true, versionKey: false });
}

function def(definition: SchemaDefinition, options?: { strict?: boolean }) {
  const s = new Schema(definition, {
    timestamps: true,
    minimize: false,
    ...options,
  });
  baseOptions(s);
  return s;
}

/* ---------------- auth ---------------- */

const UserSchema = def({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
});

/* ---------------- core tracking ---------------- */

const ProfileSchema = def({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true, ref: "User" },
  display_name: String,
  gender: String,
  age: Number,
  height_cm: Number,
  start_date: String,
  program_days: { type: Number, default: 180 },
  start_weight: Number,
  goal_weight: Number,
  calorie_goal: Number,
  protein_goal: Number,
  water_goal_ml: Number,
  steps_goal: Number,
  sleep_goal_hours: Number,
  workout_days: Number,
  active_challenge_id: String,
  onboarding_completed: { type: Boolean, default: false },
});

const DailyLogSchema = def({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  log_date: { type: String, required: true },
  weight: Number,
  steps: Number,
  water_ml: Number,
  sleep_hours: Number,
  sleep_quality: Number,
  energy: Number,
  mood: String,
  day_type: { type: String, default: "normal" },
  notes: String,
});
DailyLogSchema.index({ userId: 1, log_date: 1 }, { unique: true });

const HabitLogSchema = def({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  log_date: { type: String, required: true },
  habit_key: { type: String, required: true },
  completed: { type: Boolean, default: false },
});
HabitLogSchema.index({ userId: 1, log_date: 1, habit_key: 1 }, { unique: true });

const CustomHabitSchema = def({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  habit_key: { type: String, required: true },
  label: { type: String, required: true },
  category: { type: String, required: true },
  points: { type: Number, required: true },
  icon: { type: String, default: "Sparkles" },
});

const ChallengeSchema = def({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  name: { type: String, required: true },
  start_date: { type: String, required: true },
  days: { type: Number, required: true },
  start_weight: { type: Number, required: true },
  goal_weight: { type: Number, required: true },
  status: { type: String, default: "active" },
  ended_at: String,
  end_weight: Number,
});

/* ---------------- logs ---------------- */

// Page sources for these tables haven't been shared yet — strict:false keeps
// them open to the exact payloads the original app sends.
const NutritionLogSchema = def(
  { userId: { type: Schema.Types.ObjectId, ref: "User" }, log_date: String },
  { strict: false },
);

const WorkoutLogSchema = def(
  { userId: { type: Schema.Types.ObjectId, ref: "User" }, log_date: String },
  { strict: false },
);

const CardioLogSchema = def(
  { userId: { type: Schema.Types.ObjectId, ref: "User" }, log_date: String },
  { strict: false },
);

const ActivityLogSchema = def(
  { userId: { type: Schema.Types.ObjectId, ref: "User" }, log_date: String },
  { strict: false },
);

const FastingLogSchema = def(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    plan: String,
    target_hours: Number,
    started_at: Date,
    ended_at: Date,
    notes: String,
  },
  { strict: false },
);

const MeasurementSchema = def({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  log_date: { type: String, required: true },
  chest: Number,
  waist: Number,
  hip: Number,
  neck: Number,
  biceps: Number,
  forearm: Number,
  thigh: Number,
  calf: Number,
});
MeasurementSchema.index({ userId: 1, log_date: 1 }, { unique: true });

const JournalEntrySchema = def({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  log_date: { type: String, required: true },
  win: String,
  mistake: String,
  gratitude: String,
  tomorrow_goal: String,
  reflection: String,
});
JournalEntrySchema.index({ userId: 1, log_date: 1 }, { unique: true });

const PhotoRowSchema = def({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  pose: { type: String, enum: ["front", "side", "back"] },
  storage_path: { type: String, required: true },
  file_id: String,
  log_date: String,
});

const AchievementRowSchema = def({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  achievement_key: { type: String, required: true },
  unlocked_at: { type: Date, default: () => new Date() },
});
AchievementRowSchema.index({ userId: 1, achievement_key: 1 }, { unique: true });

/* ---------------- registry ---------------- */

export const User = models.User ?? model("User", UserSchema);
export const Profile = models.Profile ?? model("Profile", ProfileSchema);
export const DailyLog = models.DailyLog ?? model("DailyLog", DailyLogSchema);
export const HabitLog = models.HabitLog ?? model("HabitLog", HabitLogSchema);
export const CustomHabit = models.CustomHabit ?? model("CustomHabit", CustomHabitSchema);
export const Challenge = models.Challenge ?? model("Challenge", ChallengeSchema);
export const NutritionLog = models.NutritionLog ?? model("NutritionLog", NutritionLogSchema);
export const WorkoutLog = models.WorkoutLog ?? model("WorkoutLog", WorkoutLogSchema);
export const CardioLog = models.CardioLog ?? model("CardioLog", CardioLogSchema);
export const ActivityLog = models.ActivityLog ?? model("ActivityLog", ActivityLogSchema);
export const FastingLog = models.FastingLog ?? model("FastingLog", FastingLogSchema);
export const Measurement = models.Measurement ?? model("Measurement", MeasurementSchema);
export const JournalEntry = models.JournalEntry ?? model("JournalEntry", JournalEntrySchema);
export const PhotoRow = models.PhotoRow ?? model("PhotoRow", PhotoRowSchema);
export const AchievementRow = models.AchievementRow ?? model("AchievementRow", AchievementRowSchema);
