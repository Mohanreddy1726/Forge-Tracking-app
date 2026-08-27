import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { PhotoRow } from "@/server/models";
import { getUserId } from "@/server/session";
import { deleteFile, signedUrl } from "@/lib/imagekit";

/*
 * Photos API:
 *   GET    → list the user's photos with freshly signed URLs.
 *   POST   → record a successfully-uploaded photo (called by the client
 *            after <IKUpload onSuccess /> fires). Body: { log_date, pose,
 *            storage_path, file_id } — `storage_path` is what we later
 *            feed to signedUrl() for display.
 *   PATCH  → edit a photo's metadata. Body: { id, values: { log_date?,
 *            pose? } }. Only those two fields are accepted; storage_path /
 *            file_id / userId / _id can never be overwritten through this
 *            route.
 *   DELETE → remove both the Mongo row and the underlying ImageKit file.
 */

type LeanPhoto = {
  _id: unknown;
  log_date?: string | null;
  pose?: string | null;
  storage_path?: string | null;
  file_id?: string | null;
};

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    await connectDB();
    const rows = await PhotoRow.find({ userId }).sort({ log_date: -1, _id: -1 }).lean<LeanPhoto[]>();
    const out = rows.map((r) => ({
      id: String(r._id),
      log_date: r.log_date,
      pose: r.pose,
      storage_path: r.storage_path,
      url: r.storage_path ? signedUrl(r.storage_path) : null,
    }));
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list photos" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { log_date, pose, storage_path, file_id } = (await req.json()) as {
    log_date?: string;
    pose?: string;
    storage_path?: string;
    file_id?: string;
  };
  if (!storage_path) {
    return NextResponse.json({ error: "storage_path is required" }, { status: 400 });
  }

  await connectDB();
  const row = await PhotoRow.create({
    userId,
    log_date: log_date ?? null,
    pose: pose ?? null,
    storage_path,
    file_id: file_id ?? null,
  });
  return NextResponse.json(row.toJSON());
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectDB();
  const row = await PhotoRow.findOne({ _id: id, userId }).lean<LeanPhoto>();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await PhotoRow.deleteOne({ _id: id, userId });
  if (row.file_id) {
    try {
      await deleteFile(row.file_id);
    } catch {
      // best-effort: even if ImageKit delete fails, the row is gone.
    }
  }
  return NextResponse.json({ ok: true });
}

const PATCHABLE_FIELDS = ["log_date", "pose"] as const;

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json()) as {
    id?: string;
    values?: Record<string, unknown>;
  };
  if (!body.id || !body.values) {
    return NextResponse.json({ error: "id and values are required" }, { status: 400 });
  }

  // Whitelist-only — never let the client overwrite storage_path, file_id,
  // userId, or _id through this route.
  const set: Record<string, unknown> = {};
  for (const k of PATCHABLE_FIELDS) {
    if (k in body.values) set[k] = body.values[k];
  }
  if (Object.keys(set).length === 0) {
    return NextResponse.json({ error: "No patchable fields supplied" }, { status: 400 });
  }

  try {
    await connectDB();
    const updated = await PhotoRow.findOneAndUpdate(
      { _id: body.id, userId },
      { $set: set },
      { new: true },
    ).lean<LeanPhoto>();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: String(updated._id),
      log_date: updated.log_date,
      pose: updated.pose,
      storage_path: updated.storage_path,
      file_id: updated.file_id,
      url: updated.storage_path ? signedUrl(updated.storage_path) : null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update photo" },
      { status: 500 },
    );
  }
}
