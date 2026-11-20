"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Download, LogOut, Upload } from "lucide-react";
import { PageHeader, Panel } from "@/components/panel";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { downloadCsv } from "@/lib/export";
import { useIron } from "@/lib/use-iron";

/*
 * Settings — profile fields, daily targets, CSV export, sign out, and the
 * Danger Zone (reset data / delete account).
 *
 * Differences from the original TanStack Router build:
 *   - useRouter replaces useNavigate.
 *   - account actions are POSTed to /api/account/reset|delete; sign-out
 *     hits /api/auth/signout.
 *   - tanstack/react-start useServerFn replaced by plain fetch.
 */

const NUMERIC = [
  { key: "start_weight", label: "Start weight (kg)", step: "0.1" },
  { key: "goal_weight", label: "Goal weight (kg)", step: "0.1" },
  { key: "height_cm", label: "Height (cm)", step: "0.1" },
  { key: "age", label: "Age", step: "1" },
  { key: "calorie_goal", label: "Daily calories", step: "10" },
  { key: "protein_goal", label: "Daily protein (g)", step: "5" },
  { key: "water_goal_ml", label: "Water goal (ml)", step: "100" },
  { key: "steps_goal", label: "Steps goal", step: "500" },
  { key: "sleep_goal_hours", label: "Sleep goal (h)", step: "0.5" },
  { key: "workout_days", label: "Workout days / week", step: "1" },
] as const;

export default function SettingsPage() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const iron = useIron();
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [confirmText, setConfirmText] = useState("");
  const [resetText, setResetText] = useState("");
  const [busy, setBusy] = useState<null | "reset" | "delete" | "signout">(null);

  async function handleReset() {
    if (resetText !== "reset all data") {
      toast.error('Type "reset all data" to confirm');
      return;
    }
    if (!window.confirm("Delete ALL logs, photos, challenges and progress? This cannot be undone.")) return;
    setBusy("reset");
    try {
      const res = await fetch("/api/account/reset", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      qc.clear();
      setResetText("");
      toast.success("All data wiped. Set up a fresh challenge.");
      router.replace("/onboarding");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (confirmText !== "delete my account") {
      toast.error('Type "delete my account" to confirm');
      return;
    }
    setBusy("delete");
    try {
      const res = await fetch("/api/account/delete", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      qc.clear();
      toast.success("Account deleted");
      router.replace("/auth");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function downloadJsonBackup() {
    try {
      setBusy("backup" as unknown as null);
      const res = await fetch("/api/account/backup", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch backup");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forge-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Complete JSON backup downloaded");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Backup failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Restore this backup? This will replace your current logs with the backup data.")) {
      e.target.value = "";
      return;
    }

    try {
      setBusy("restore" as unknown as null);
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/account/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(json),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Restore failed");
      }
      await qc.invalidateQueries();
      toast.success("Backup successfully restored!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (!profile) return;
    const next: Record<string, string> = {
      display_name: profile.display_name ?? "",
      gender: profile.gender ?? "male",
      start_date: profile.start_date ?? "",
    };
    for (const n of NUMERIC) next[n.key] = String(profile[n.key] ?? "");
    setForm(next);
  }, [profile]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      display_name: form["display_name"] || null,
      gender: form["gender"],
      start_date: form["start_date"],
    };
    for (const n of NUMERIC) payload[n.key] = Number(form[n.key] || 0);
    update.mutate(payload, {
      onSuccess: () => toast.success("Settings saved"),
      onError: (e: Error) => toast.error(e.message),
    });
  }

  async function signOut() {
    setBusy("signout");
    try {
      await qc.cancelQueries();
      qc.clear();
      await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
      router.replace("/auth");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign out failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your program parameters and daily targets." />

      <Panel title="Profile & goals">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Display name</span>
              <input
                value={form["display_name"] ?? ""}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Gender</span>
              <select
                value={form["gender"] ?? "male"}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Program start date</span>
              <input
                type="date"
                value={form["start_date"] ?? ""}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
              />
            </label>
            {NUMERIC.map((n) => (
              <label key={n.key} className="block">
                <span className="mb-1.5 block text-xs text-muted-foreground">{n.label}</span>
                <input
                  type="number"
                  step={n.step}
                  value={form[n.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [n.key]: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
                />
              </label>
            ))}
          </div>
          <button className="ember-bg rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Save settings
          </button>
        </form>
      </Panel>

      <Panel title="Data & Backups" description="Export or restore a complete snapshot of your entire transformation ledger.">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadJsonBackup}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20"
          >
            <Download className="size-4" /> Export full backup (JSON)
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleRestoreFile}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:border-primary/50 hover:text-primary"
          >
            <Upload className="size-4" /> Restore from JSON
          </button>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                "iron180-all-days.csv",
                iron.stats.map((s) => ({
                  date: s.date,
                  score: s.score,
                  weight: s.weight ?? "",
                  habits: s.habits.join(" "),
                  mood: s.log?.mood ?? "",
                  energy: s.log?.energy ?? "",
                  sleep_hours: s.log?.sleep_hours ?? "",
                  water_ml: s.log?.water_ml ?? "",
                  steps: s.log?.steps ?? "",
                })),
              )
            }
            className="rounded-xl border border-border px-4 py-2.5 text-sm hover:border-primary/50 hover:text-primary"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={signOut}
            disabled={busy === "signout"}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-destructive/50 hover:text-destructive disabled:opacity-60"
          >
            <LogOut className="size-4" /> {busy === "signout" ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </Panel>

      <section className="overflow-hidden rounded-2xl border border-destructive/50">
        <header className="flex items-center gap-2 border-b border-destructive/40 bg-destructive/10 px-6 py-4">
          <AlertTriangle className="size-4 text-destructive" />
          <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
        </header>
        <div className="divide-y divide-border bg-card">
          <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium">Reset all data</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Deletes every log, photo, measurement, journal entry, achievement and challenge. Your account stays.
                Type <code>reset all data</code> to confirm.
              </p>
              <input
                value={resetText}
                onChange={(e) => setResetText(e.target.value)}
                placeholder="reset all data"
                className="w-72 rounded-xl border border-input bg-background/60 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleReset}
              disabled={busy !== null || resetText !== "reset all data"}
              className="self-start rounded-xl border border-destructive px-5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-40 sm:self-end"
            >
              {busy === "reset" ? "Resetting…" : "Reset data"}
            </button>
          </div>
          <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium">Delete this account</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Permanently removes your account and all data. Type <code>delete my account</code> to confirm.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete my account"
                className="w-72 rounded-xl border border-input bg-background/60 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleDelete}
              disabled={busy !== null || confirmText !== "delete my account"}
              className="self-start rounded-xl bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground transition-opacity disabled:opacity-40 sm:self-end"
            >
              {busy === "delete" ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}