import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { Measurement } from "@/server/models";
import { getUserId } from "@/server/session";

const FIELDS = ["chest", "waist", "hip", "neck", "biceps", "forearm", "thigh", "calf"] as const;

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await connectDB();
  const rows = await Measurement.find({ userId }).sort({ log_date: 1 });
  return NextResponse.json(rows.map((r) => r.toJSON()));
}

/** Upsert on (user, log_date). */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown> & { log_date?: string };
  if (!body.log_date) return NextResponse.json({ error: "log_date is required" }, { status: 400 });

  await connectDB();

  const values: Record<string, unknown> = { userId, log_date: body.log_date };
  for (const field of FIELDS) {
    if (field in body) values[field] = body[field];
  }

  await Measurement.findOneAndUpdate(
    { userId, log_date: body.log_date },
    { $set: values },
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
  await Measurement.deleteOne({ _id: id, userId });

  return NextResponse.json({ ok: true });
}
