"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IKContext, IKUpload } from "imagekitio-react";
import { toast } from "sonner";
import { Camera, ImagePlus, Pencil, Search, Trash2, X } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/panel";
import { api } from "@/lib/api";
import { useUpdateRow } from "@/lib/data";
import { todayStr } from "@/lib/iron";

/*
 * Photos page — MongoDB + ImageKit edition.
 *
 *   Upload flow:
 *     1. The page fetches { publicKey, urlEndpoint, token, signature, expire }
 *        from /api/photos/upload-auth on mount.
 *     2. We wrap <IKUpload /> in <IKContext> with those values so the SDK's
 *        internal client init can read them. (Passing urlEndpoint as a prop
 *        on IKUpload alone is unreliable — the SDK's IKImage init hook reads
 *        it from props, but IKUpload's check chain works best via context.)
 *     3. <IKUpload authenticator={...}> asks our endpoint for fresh
 *        token/signature per upload, then pushes the file straight to
 *        ImageKit's CDN.
 *     4. On success, we POST { log_date, pose, storage_path, file_id } to
 *        /api/photos so the row lands in Mongo.
 *
 *   Display flow:
 *     GET /api/photos returns rows WITH a freshly-signed URL (1h expiry)
 *     which we feed straight into <img src=...>.
 *
 *   Delete flow:
 *     DELETE /api/photos?id=... removes both the Mongo row and the
 *     underlying ImageKit file.
 */

type Photo = {
  id: string;
  log_date: string | null;
  pose: "front" | "side" | "back" | null;
  storage_path: string | null;
  url: string | null;
};

type UploadAuth = {
  publicKey: string;
  urlEndpoint: string;
  token: string;
  signature: string;
  expire: number;
};

const POSES = [
  { value: "front", label: "Front" },
  { value: "side", label: "Side" },
  { value: "back", label: "Back" },
] as const;

export default function PhotosPage() {
  const qc = useQueryClient();

  // Photo rows (with freshly-signed URLs from /api/photos).
  const photosQ = useQuery({
    queryKey: ["photos_v2"],
    queryFn: async (): Promise<Photo[]> => {
      const data = await api<unknown>("/api/photos");
      return Array.isArray(data) ? (data as Photo[]) : [];
    },
  });
  const photos = photosQ.data ?? [];

  // Inline-edit state — mirrors upload fields for the tile being edited.
  const updatePhoto = useUpdateRow("photos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ log_date: string; pose: "front" | "side" | "back" }>({
    log_date: "",
    pose: "front",
  });

  // Persist a successful upload to Mongo.
  const insert = useMutation({
    mutationFn: async (v: {
      log_date: string;
      pose: "front" | "side" | "back";
      storage_path: string;
      file_id: string;
    }) => post("/api/photos", v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos_v2"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) =>
      api(`/api/photos?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["photos_v2"] });
      toast.success("Photo deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Upload state.
  const [date, setDate] = useState(todayStr());
  const [pose, setPose] = useState<"front" | "side" | "back">("front");
  const [uploading, setUploading] = useState(false);
  // maxDate is computed once after mount. We don't render max=… on the
  // server (todayStr() can differ between SSR and first client paint
  // around midnight) — leaving it off server-side avoids the hydration
  // mismatch; once mounted we apply it as a max attribute via state.
  const [maxDate, setMaxDate] = useState<string | undefined>(undefined);
  useEffect(() => {
    setMaxDate(todayStr());
  }, []);

  // Fetch IKConfig from the server once on mount. Skipped during SSR so the
  // initial render matches what the client produces (avoids hydration
  // mismatch on the upload button).
  const [mounted, setMounted] = useState(false);
  const [ikConfig, setIkConfig] = useState<UploadAuth | null>(null);
  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    api<UploadAuth>("/api/photos/upload-auth")
      .then((a) => {
        if (!cancelled && a.publicKey && a.urlEndpoint && a.token) {
          setIkConfig(a);
        } else if (!cancelled) {
          toast.error("ImageKit returned incomplete config");
        }
      })
      .catch((e: Error) =>
        toast.error(e.message || "ImageKit not configured — check IMAGEKIT_* env vars"),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter state.
  const [poseFilter, setPoseFilter] = useState<"" | "front" | "side" | "back">("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return photos
      .filter((p) => !poseFilter || p.pose === poseFilter)
      .filter(
        (p) =>
          !q ||
          (p.log_date ?? "").includes(q) ||
          (p.pose ?? "").toLowerCase().includes(q),
      );
  }, [photos, poseFilter, query]);

  const latest = useMemo(() => {
    const groups: Record<"front" | "side" | "back", Photo | undefined> = {
      front: undefined,
      side: undefined,
      back: undefined,
    };
    for (const p of photos) {
      if (!p.pose || !p.url) continue;
      const cur = groups[p.pose];
      if (!cur || (p.log_date ?? "") > (cur.log_date ?? "")) groups[p.pose] = p;
    }
    return groups;
  }, [photos]);

  // <IKUpload authenticator={...}> — fires before every upload.
  const authenticator = async (): Promise<UploadAuth> => api<UploadAuth>("/api/photos/upload-auth");

  const onUploadStart = () => setUploading(true);

  const onUploadSuccess = (res: {
    filePath?: string;
    fileId?: string;
    url?: string;
    name?: string;
  }) => {
    setUploading(false);
    const storage_path = res.filePath;
    const file_id = res.fileId ?? "";
    if (!storage_path) {
      toast.error("Upload succeeded but no file path returned");
      return;
    }
    insert.mutate(
      { log_date: date, pose, storage_path, file_id },
      {
        onSuccess: () => toast.success("Photo uploaded"),
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  const onUploadError = (err: Error) => {
    setUploading(false);
    toast.error(err.message || "Upload failed");
  };

  function beginEditPhoto(p: Photo) {
    setEditingId(p.id);
    setEditForm({
      log_date: p.log_date ?? todayStr(),
      pose: (p.pose ?? "front") as "front" | "side" | "back",
    });
  }

  function cancelEditPhoto() {
    setEditingId(null);
  }

  function saveEditPhoto() {
    if (!editingId) return;
    updatePhoto.mutate(
      {
        id: editingId,
        values: { log_date: editForm.log_date, pose: editForm.pose },
      },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Photo updated");
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress photos"
        description="Front, side, back — same pose each time so the comparison is honest."
        action={
          <input
            type="date"
            value={date}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
          />
        }
      />

      <Panel title="Upload" description="Direct to ImageKit — never sits on our server.">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <span className="mb-1.5 block text-xs text-muted-foreground">Pose</span>
            <div className="inline-flex overflow-hidden rounded-xl border border-input bg-card">
              {POSES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPose(p.value)}
                  className={`px-4 py-2 text-sm transition-colors ${
                    pose === p.value
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {mounted && ikConfig ? (
            // IKContext provides publicKey + urlEndpoint to its descendants.
            // The SDK's internal useImageKitComponent hook reads urlEndpoint
            // from context (props only) — this is the path the SDK was built
            // around.
            <IKContext
              publicKey={ikConfig.publicKey}
              urlEndpoint={ikConfig.urlEndpoint}
              authenticator={authenticator}
            >
              <label
                className={`inline-flex items-center gap-2 rounded-xl border border-input bg-card px-4 py-2.5 text-sm font-medium transition-colors ${
                  uploading ? "opacity-70" : "cursor-pointer hover:border-primary/40"
                }`}
              >
                <ImagePlus className="size-4" />
                {uploading ? "Uploading…" : "Choose file"}
                <IKUpload
                  fileName={`forge-${pose}-${date}.jpg`}
                  folder="/forge-progress"
                  useUniqueFileName={true}
                  isPrivateFile={true}
                  onUploadStart={onUploadStart}
                  onSuccess={onUploadSuccess}
                  onError={onUploadError}
                  className="hidden"
                  accept="image/*"
                />
              </label>
            </IKContext>
          ) : (
            <span className="text-xs text-muted-foreground">
              {mounted ? "Loading ImageKit config…" : ""}
            </span>
          )}
        </div>
      </Panel>

      <Panel title="Latest by pose" description="The most recent photo of each angle">
        {POSES.every((p) => !latest[p.value]) ? (
          <EmptyState
            icon={<Camera className="size-8" />}
            title="No photos yet"
            description="Upload a front, side and back photo to start tracking."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {POSES.map((p) => {
              const ph = latest[p.value];
              return (
                <div
                  key={p.value}
                  className="overflow-hidden rounded-2xl border border-border bg-muted/20"
                >
                  <div className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-xs">
                    <span className="font-semibold capitalize">{p.label}</span>
                    {ph?.log_date ? (
                      <span className="text-muted-foreground">{ph.log_date}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  {ph?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ph.url}
                      alt={`${p.label} latest`}
                      className="aspect-[3/4] w-full object-cover"
                    />
                  ) : (
                    <div className="grid aspect-[3/4] place-items-center text-xs text-muted-foreground">
                      No {p.label.toLowerCase()} photo yet
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel
        title="Gallery"
        description="Every photo, newest first"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={poseFilter}
              onChange={(e) => setPoseFilter(e.target.value as typeof poseFilter)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
            >
              <option value="">All poses</option>
              {POSES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by date / pose"
                className="rounded-xl border border-input bg-card py-2 pr-3 pl-9 text-sm"
              />
            </div>
          </div>
        }
      >
        {filtered.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) =>
              editingId === p.id ? (
                <div
                  key={p.id}
                  className="space-y-3 rounded-2xl border border-primary/40 bg-primary/5 p-3"
                >
                  {p.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.url}
                      alt={p.pose ?? "progress"}
                      className="aspect-[3/4] w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid aspect-[3/4] place-items-center rounded-xl bg-muted/30 text-xs text-muted-foreground">
                      No URL
                    </div>
                  )}
                  <label className="block">
                    <span className="mb-1 block text-xs text-muted-foreground">Date</span>
                    <input
                      type="date"
                      value={editForm.log_date}
                      onChange={(e) => setEditForm({ ...editForm, log_date: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background/60 px-2 py-1.5 text-xs"
                    />
                  </label>
                  <div>
                    <span className="mb-1 block text-xs text-muted-foreground">Pose</span>
                    <div className="inline-flex overflow-hidden rounded-lg border border-input bg-card">
                      {POSES.map((pp) => (
                        <button
                          key={pp.value}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, pose: pp.value })}
                          className={`px-3 py-1.5 text-xs transition-colors ${
                            editForm.pose === pp.value
                              ? "bg-primary/15 text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {pp.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={cancelEditPhoto}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" /> Cancel
                    </button>
                    <button
                      onClick={saveEditPhoto}
                      disabled={updatePhoto.isPending}
                      className="ember-bg rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={p.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-muted/20"
                >
                  {p.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.url}
                      alt={p.pose ?? "progress"}
                      className="aspect-[3/4] w-full object-cover transition-transform group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="grid aspect-[3/4] place-items-center text-xs text-muted-foreground">
                      No URL
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                    <span className="truncate">
                      {p.pose ? p.pose : "—"} · {p.log_date ?? ""}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => beginEditPhoto(p)}
                        className="rounded-full bg-white/10 p-1.5 text-white transition-colors hover:bg-white/30"
                        aria-label="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => del.mutate(p.id)}
                        className="rounded-full bg-white/10 p-1.5 text-white transition-colors hover:bg-destructive/80"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <EmptyState
            icon={<Camera className="size-8" />}
            title="No matching photos"
            description={
              photos.length ? "Try a different filter." : "Upload your first photo above."
            }
          />
        )}
      </Panel>
    </div>
  );
}

/* ----------- tiny helpers (kept local so this page stays self-contained) ----------- */

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}