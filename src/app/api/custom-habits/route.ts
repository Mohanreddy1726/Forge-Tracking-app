import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { CustomHabit } from "@/server/models";
import { getUserId } from "@/server/session";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await connectDB();
  const habits = await CustomHabit.find({ userId }).sort({ createdAt: 1 });
  return NextResponse.json(habits.map((h) => h.toJSON()));
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { label, category, points } = (await req.json()) as {
    label?: string;
    category?: string;
    points?: number;
  };
  if (!label || !category || typeof points !== "number" || points < 1 || points > 25) {
    return NextResponse.json(
      { error: "Label, category and points (1-25) are required" },
      { status: 400 },
    );
  }

  await connectDB();

  // Same key shape the original generates client-side.
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const habit_key = `custom_${slug}_${Math.random().toString(36).slice(2, 6)}`;

  const habit = await CustomHabit.create({
    userId,
    habit_key,
    label,
    category,
    points,
    icon: "Sparkles",
  });

  return NextResponse.json(habit.toJSON());
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id, ...patch } = (await req.json()) as {
    id?: string;
    label?: string;
    category?: string;
    points?: number;
  };
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectDB();
  const updated = await CustomHabit.findOneAndUpdate(
    { _id: id, userId },
    { $set: patch },
    { new: true },
  );
  if (!updated) return NextResponse.json({ error: "Habit not found" }, { status: 404 });

  return NextResponse.json(updated.toJSON());
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectDB();
  await CustomHabit.deleteOne({ _id: id, userId });

  return NextResponse.json({ ok: true });
}
