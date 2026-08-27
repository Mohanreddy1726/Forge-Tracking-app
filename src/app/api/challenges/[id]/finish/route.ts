import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { Challenge, Profile } from "@/server/models";
import { getUserId } from "@/server/session";
import { lastLoggedWeight } from "@/server/challenge-utils";
import { todayStr } from "@/lib/iron";

/** Mark a challenge completed or abandoned and detach it from the profile. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const { status } = (await req.json()) as { status?: "completed" | "abandoned" };
  if (status !== "completed" && status !== "abandoned") {
    return NextResponse.json({ error: "status must be completed or abandoned" }, { status: 400 });
  }

  await connectDB();

  const endWeight = await lastLoggedWeight(userId);
  const updated = await Challenge.findOneAndUpdate(
    { _id: id, userId },
    { $set: { status, ended_at: todayStr(), end_weight: endWeight } },
    { new: true },
  );
  if (!updated) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  await Profile.updateOne({ userId }, { $set: { active_challenge_id: null } });

  return NextResponse.json(updated.toJSON());
}
