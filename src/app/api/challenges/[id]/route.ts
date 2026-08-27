import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { Challenge, Profile } from "@/server/models";
import { getUserId } from "@/server/session";

/**
 * Update a challenge. Editing the ACTIVE challenge syncs the profile's
 * program parameters, exactly like the original useUpdateChallenge.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as {
    name?: string;
    start_date?: string;
    days?: number;
    start_weight?: number;
    goal_weight?: number;
  };

  const patch: Record<string, unknown> = {};
  for (const key of ["name", "start_date", "days", "start_weight", "goal_weight"] as const) {
    if (key in body) patch[key] = body[key];
  }

  await connectDB();

  const updated = await Challenge.findOneAndUpdate({ _id: id, userId }, { $set: patch }, { new: true });
  if (!updated) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  if (updated.status === "active") {
    await Profile.findOneAndUpdate(
      { userId },
      {
        $set: {
          start_date: updated.start_date,
          program_days: updated.days,
          start_weight: updated.start_weight,
          goal_weight: updated.goal_weight,
        },
      },
    );
  }

  return NextResponse.json(updated.toJSON());
}
