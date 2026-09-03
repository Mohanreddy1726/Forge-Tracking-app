import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import {
  AchievementRow,
  ActivityLog,
  CardioLog,
  Challenge,
  CustomHabit,
  DailyLog,
  FastingLog,
  HabitLog,
  JournalEntry,
  Measurement,
  NutritionLog,
  PhotoRow,
  WorkoutLog,
  Profile,
} from "@/server/models";
import { getUserId } from "@/server/session";

/*
 * POST /api/account/reset — wipes every log row tied to the signed-in user,
 * keeps the account. Used by the Danger Zone in /settings.
 *
 * Note: /photos uses ImageKit for storage. We intentionally do NOT touch
 * ImageKit here — uploaded files stay on the CDN in case the user undoes
 * the action. They can be cleaned up later by the support team if needed.
 * (Adding per-user file delete here would require iterating every photo
 * row and calling ik.deleteFile, which the page never needs to be fast.)
 */
export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    await connectDB();
    const filter = { userId };
    await Promise.all([
      DailyLog.deleteMany(filter),
      HabitLog.deleteMany(filter),
      CustomHabit.deleteMany(filter),
      Challenge.deleteMany(filter),
      NutritionLog.deleteMany(filter),
      WorkoutLog.deleteMany(filter),
      CardioLog.deleteMany(filter),
      ActivityLog.deleteMany(filter),
      FastingLog.deleteMany(filter),
      Measurement.deleteMany(filter),
      JournalEntry.deleteMany(filter),
      PhotoRow.deleteMany(filter),
      AchievementRow.deleteMany(filter),
    ]);
    // Keep the session; clear onboarding state on profile
await Profile.findOneAndUpdate(
  { userId },
  { $set: { onboarding_completed: false, active_challenge_id: null },
    $unset: { start_date: "", program_days: "", start_weight: "", goal_weight: "" },
  },
  { new: true }
);
// Note: destroySession() removed to retain login after reset.

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reset failed" },
      { status: 500 },
    );
  }
}