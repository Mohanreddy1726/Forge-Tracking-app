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

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    await connectDB();
    const filter = { userId };

    const [
      profile,
      challenges,
      dailyLogs,
      habitLogs,
      customHabits,
      nutritionLogs,
      workoutLogs,
      cardioLogs,
      activityLogs,
      fastingLogs,
      measurements,
      journalEntries,
      achievements,
      photos,
    ] = await Promise.all([
      Profile.findOne(filter),
      Challenge.find(filter),
      DailyLog.find(filter),
      HabitLog.find(filter),
      CustomHabit.find(filter),
      NutritionLog.find(filter),
      WorkoutLog.find(filter),
      CardioLog.find(filter),
      ActivityLog.find(filter),
      FastingLog.find(filter),
      Measurement.find(filter),
      JournalEntry.find(filter),
      AchievementRow.find(filter),
      PhotoRow.find(filter),
    ]);

    const backup = {
      version: 1,
      appName: "Forge",
      exportedAt: new Date().toISOString(),
      profile: profile ? profile.toJSON() : null,
      challenges: challenges.map((r) => r.toJSON()),
      dailyLogs: dailyLogs.map((r) => r.toJSON()),
      habitLogs: habitLogs.map((r) => r.toJSON()),
      customHabits: customHabits.map((r) => r.toJSON()),
      nutritionLogs: nutritionLogs.map((r) => r.toJSON()),
      workoutLogs: workoutLogs.map((r) => r.toJSON()),
      cardioLogs: cardioLogs.map((r) => r.toJSON()),
      activityLogs: activityLogs.map((r) => r.toJSON()),
      fastingLogs: fastingLogs.map((r) => r.toJSON()),
      measurements: measurements.map((r) => r.toJSON()),
      journalEntries: journalEntries.map((r) => r.toJSON()),
      achievements: achievements.map((r) => r.toJSON()),
      photos: photos.map((r) => r.toJSON()),
    };

    return NextResponse.json(backup);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Backup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const data = await req.json();
    if (!data || data.appName !== "Forge") {
      return NextResponse.json({ error: "Invalid backup file: not a valid Forge backup" }, { status: 400 });
    }

    await connectDB();
    const filter = { userId };

    // Clean existing user logs before restoring
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
      AchievementRow.deleteMany(filter),
      PhotoRow.deleteMany(filter),
    ]);

    // Restore profile if present
    if (data.profile) {
      const p = { ...data.profile } as Record<string, unknown>;
      delete p.id;
      delete p._id;
      delete p.userId;
      await Profile.findOneAndUpdate({ userId }, { $set: p }, { upsert: true });
    }

    const sanitize = (rows: Record<string, unknown>[] = []) =>
      rows.map((r) => {
        const item = { ...r, userId } as Record<string, unknown>;
        delete item.id;
        delete item._id;
        return item;
      });

    // Bulk restore
    await Promise.all([
      data.dailyLogs?.length ? DailyLog.insertMany(sanitize(data.dailyLogs)) : null,
      data.habitLogs?.length ? HabitLog.insertMany(sanitize(data.habitLogs)) : null,
      data.customHabits?.length ? CustomHabit.insertMany(sanitize(data.customHabits)) : null,
      data.challenges?.length ? Challenge.insertMany(sanitize(data.challenges)) : null,
      data.nutritionLogs?.length ? NutritionLog.insertMany(sanitize(data.nutritionLogs)) : null,
      data.workoutLogs?.length ? WorkoutLog.insertMany(sanitize(data.workoutLogs)) : null,
      data.cardioLogs?.length ? CardioLog.insertMany(sanitize(data.cardioLogs)) : null,
      data.activityLogs?.length ? ActivityLog.insertMany(sanitize(data.activityLogs)) : null,
      data.fastingLogs?.length ? FastingLog.insertMany(sanitize(data.fastingLogs)) : null,
      data.measurements?.length ? Measurement.insertMany(sanitize(data.measurements)) : null,
      data.journalEntries?.length ? JournalEntry.insertMany(sanitize(data.journalEntries)) : null,
      data.achievements?.length ? AchievementRow.insertMany(sanitize(data.achievements)) : null,
      data.photos?.length ? PhotoRow.insertMany(sanitize(data.photos)) : null,
    ]);

    return NextResponse.json({ ok: true, message: "Backup successfully restored" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Restore failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
