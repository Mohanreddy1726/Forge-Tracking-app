import { NextResponse } from "next/server";
import type { Model } from "mongoose";
import { connectDB } from "@/server/db";
import {
  NutritionLog,
  WorkoutLog,
  CardioLog,
  ActivityLog,
  PhotoRow,
  FastingLog,
} from "@/server/models";
import { getUserId } from "@/server/session";

const TABLES: Record<string, { model: Model<unknown>; sort: Record<string, 1 | -1> }> = {
  "nutrition-logs": { model: NutritionLog, sort: { log_date: 1 } },
  "workout-logs": { model: WorkoutLog, sort: { log_date: -1, createdAt: -1 } },
  "cardio-logs": { model: CardioLog, sort: { log_date: -1 } },
  "activity-logs": { model: ActivityLog, sort: { log_date: -1, createdAt: -1 } },
  photos: { model: PhotoRow, sort: { log_date: 1 } },
  "fasting-logs": { model: FastingLog, sort: { started_at: -1 } },
};

type Ctx = { params: Promise<{ table: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { table } = await params;
  const entry = TABLES[table];
  if (!entry) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

  await connectDB();
  const rows = await entry.model.find({ userId }).sort(entry.sort);
  return NextResponse.json(rows.map((r) => r.toJSON()));
}

/** Insert a row (user_id is always taken from the session). */
export async function POST(req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { table } = await params;
  const entry = TABLES[table];
  if (!entry) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

  const values = (await req.json()) as Record<string, unknown>;
  delete values.id;
  delete values._id;
  delete values.userId;

  await connectDB();
  const row = await entry.model.create({ ...values, userId });
  return NextResponse.json(row.toJSON());
}

/** Update a row by id — body shape { id, values }. */
export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { table } = await params;
  const entry = TABLES[table];
  if (!entry) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

  const { id, values } = (await req.json()) as { id?: string; values?: Record<string, unknown> };
  if (!id || !values) return NextResponse.json({ error: "id and values are required" }, { status: 400 });

  delete values.id;
  delete values._id;
  delete values.userId;

  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (entry.model as any).findOneAndUpdate(
    { _id: id, userId },
    { $set: values },
    { new: true },
  );
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated.toJSON());
}

export async function DELETE(req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { table } = await params;
  const entry = TABLES[table];
  if (!entry) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectDB();
  await entry.model.deleteOne({ _id: id, userId });

  return NextResponse.json({ ok: true });
}
