import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { Challenge } from "@/server/models";
import { getUserId } from "@/server/session";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await connectDB();
  const challenges = await Challenge.find({ userId }).sort({ start_date: -1 });
  return NextResponse.json(challenges.map((c) => c.toJSON()));
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectDB();
  const row = await Challenge.findOneAndDelete({ _id: id, userId });
  // Deleting the active challenge detaches it from the profile.
  if (row?.status === "active") {
    const { Profile } = await import("@/server/models");
    await Profile.updateOne({ userId }, { $set: { active_challenge_id: null } });
  }

  return NextResponse.json({ ok: true });
}
