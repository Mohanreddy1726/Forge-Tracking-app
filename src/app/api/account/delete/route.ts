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
  Profile,
  User,
  WorkoutLog,
} from "@/server/models";
import { destroySession, getUserId } from "@/server/session";

/*
 * POST /api/account/delete — permanently removes the signed-in user and
 * every row tied to them, then clears the session cookie.
 *
 * ImageKit files are NOT deleted here. They live on the CDN outside Mongo;
 * removing them per-user would require listing every photo row + calling
 * ik.deleteFile, which the page doesn't need. (This matches the reset
 * route's behaviour; support can purge files separately.)
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
      Profile.deleteMany(filter),
    ]);
    await User.deleteOne({ _id: userId });
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 },
    );
  }
}