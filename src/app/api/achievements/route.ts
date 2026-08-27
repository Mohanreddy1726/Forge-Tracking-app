import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { AchievementRow } from "@/server/models";
import { getUserId } from "@/server/session";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await connectDB();
  const rows = await AchievementRow.find({ userId });
  return NextResponse.json(rows.map((r) => r.toJSON()));
}

/** Grant achievements — ignores ones already unlocked (ignoreDuplicates). */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const keys = ((await req.json()) as { keys?: string[] }).keys ?? [];
  if (!keys.length) return NextResponse.json({ ok: true });

  await connectDB();

  const ops = keys.map((achievement_key) => ({
    updateOne: {
      filter: { userId, achievement_key },
      update: { $setOnInsert: { userId, achievement_key, unlocked_at: new Date() } },
      upsert: true,
    },
  }));
  await AchievementRow.bulkWrite(ops);

  return NextResponse.json({ ok: true });
}
