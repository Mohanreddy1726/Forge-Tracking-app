import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { Profile } from "@/server/models";
import { getUserId } from "@/server/session";

const EDITABLE = [
  "display_name",
  "gender",
  "age",
  "height_cm",
  "start_date",
  "program_days",
  "start_weight",
  "goal_weight",
  "calorie_goal",
  "protein_goal",
  "water_goal_ml",
  "steps_goal",
  "sleep_goal_hours",
  "workout_days",
] as const;

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await connectDB();
  let profile = await Profile.findOne({ userId });
  // Mirrors the original maybeSingle→insert behavior.
  if (!profile) profile = await Profile.create({ userId });

  return NextResponse.json(profile.toJSON());
}

export async function PUT(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await connectDB();
  const body = (await req.json()) as Record<string, unknown>;

  const patch: Record<string, unknown> = {};
  for (const key of EDITABLE) {
    if (key in body) patch[key] = body[key];
  }

  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: patch },
    { new: true, upsert: true },
  );

  return NextResponse.json(profile.toJSON());
}
