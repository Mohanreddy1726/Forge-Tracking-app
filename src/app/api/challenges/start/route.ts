import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { Challenge, Profile } from "@/server/models";
import { getUserId } from "@/server/session";
import { lastLoggedWeight } from "@/server/challenge-utils";
import { todayStr } from "@/lib/iron";

/**
 * Ends every active challenge (recording end_weight from the latest weigh-in)
 * and starts a fresh one, syncing the profile. Mirrors useStartChallenge.
 */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { name, start_date, days, start_weight, goal_weight, finishStatus } = (await req.json()) as {
    name?: string;
    start_date?: string;
    days?: number;
    start_weight?: number;
    goal_weight?: number;
    finishStatus?: "completed" | "abandoned";
  };

  if (
    !name ||
    !start_date ||
    typeof days !== "number" ||
    days < 7 ||
    days > 365 ||
    typeof start_weight !== "number" ||
    typeof goal_weight !== "number"
  ) {
    return NextResponse.json(
      { error: "Challenge length must be 7-365 days; name and weights are required" },
      { status: 400 },
    );
  }

  await connectDB();

  // Close out any active challenges first.
  const active = await Challenge.find({ userId, status: "active" });
  const endWeight = await lastLoggedWeight(userId);
  for (const c of active) {
    c.status = finishStatus ?? "completed";
    c.ended_at = todayStr();
    c.end_weight = endWeight;
    await c.save();
  }

  const created = await Challenge.create({
    userId,
    name,
    start_date,
    days,
    start_weight,
    goal_weight,
    status: "active",
  });

  await Profile.findOneAndUpdate(
    { userId },
    {
      $set: {
        start_date,
        program_days: days,
        start_weight,
        goal_weight,
        active_challenge_id: String(created._id),
        onboarding_completed: true,
      },
    },
    { upsert: true },
  );

  return NextResponse.json(created.toJSON());
}
