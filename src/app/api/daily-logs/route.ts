import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { DailyLog } from "@/server/models";
import { getUserId } from "@/server/session";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await connectDB();
  const logs = await DailyLog.find({ userId }).sort({ log_date: 1 });
  return NextResponse.json(logs.map((l) => l.toJSON()));
}

/** Upsert on (user, log_date) — mirrors Supabase onConflict:"user_id,log_date". */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const values = (await req.json()) as Record<string, unknown> & { log_date?: string };
  if (!values.log_date) {
    return NextResponse.json({ error: "log_date is required" }, { status: 400 });
  }

  await connectDB();
  const { log_date, ...rest } = values;
  await DailyLog.findOneAndUpdate(
    { userId, log_date },
    { $set: { ...rest, userId, log_date } },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectDB();
  // Whole-row delete on purpose: a /checkin row holds every field for that
  // day (mood / energy / sleep / water / steps / notes / weight). There is
  // no per-field endpoint — if you only want to clear weight, use
  // DELETE /api/weight instead.
  await DailyLog.deleteOne({ _id: id, userId });

  return NextResponse.json({ ok: true });
}
