import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { DailyLog } from "@/server/models";
import { getUserId } from "@/server/session";

/*
 * Weight API:
 *
 * Weight values live inside the DailyLog collection — there is no separate
 * `weight` table. Each day's weight is just the `weight` field on that
 * day's DailyLog row. The /weight page already writes/reads via
 * /api/daily-logs (upsert on (userId, log_date)); this route only exists
 * to support per-day weight deletion without wiping the day's check-in.
 *
 *   DELETE → $unset the `weight` field on the matching DailyLog row, so the
 *            day's mood / energy / sleep / steps / water / notes stay intact.
 *            Query: ?id=<DailyLog _id>
 */

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectDB();
  const updated = await DailyLog.findOneAndUpdate(
    { _id: id, userId },
    { $unset: { weight: "" } },
    { new: true },
  );
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
