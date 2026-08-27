import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { HabitLog } from "@/server/models";
import { getUserId } from "@/server/session";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await connectDB();
  const logs = await HabitLog.find({ userId }).sort({ log_date: 1 });
  return NextResponse.json(logs.map((l) => l.toJSON()));
}

/** Toggle upsert on (user, date, habit) — one row per habit per day. */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { log_date, habit_key, completed } = (await req.json()) as {
    log_date?: string;
    habit_key?: string;
    completed?: boolean;
  };
  if (!log_date || !habit_key) {
    return NextResponse.json({ error: "log_date and habit_key are required" }, { status: 400 });
  }

  await connectDB();
  await HabitLog.findOneAndUpdate(
    { userId, log_date, habit_key },
    { $set: { completed: completed ?? false } },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}
