"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Flag, Pencil, Plus, Trash2, Trophy, X } from "lucide-react";
import { PageHeader, Panel } from "@/components/panel";
import {
  useChallenges,
  useDeleteChallenge,
  useFinishChallenge,
  useStartChallenge,
  useUpdateChallenge,
} from "@/lib/data";
import type { Challenge } from "@/lib/types";
import { useIron } from "@/lib/use-iron";
import { addDays, daysBetween, todayStr } from "@/lib/iron";
import { celebrate } from "@/lib/celebrate";

/*
 * Challenges — list every challenge past and present, edit, finish, abandon,
 * delete, or launch a new one. Starting a new challenge closes the current
 * one server-side.
 */

const PRESETS = [30, 60, 75, 90, 180, 365];
const inputCls =
  "w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

export function challengeProgress(c: Challenge) {
  const elapsed = Math.min(c.days, Math.max(0, daysBetween(c.start_date, c.ended_at ?? todayStr()) + 1));
  return { elapsed, pct: Math.round((elapsed / c.days) * 100), endDate: addDays(c.start_date, c.days - 1) };
}

export default function ChallengesPage() {
  const { data: challenges = [] } = useChallenges();
  const iron = useIron();
  const start = useStartChallenge();
  const finish = useFinishChallenge();
  const update = useUpdateChallenge();
  const remove = useDeleteChallenge();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Challenge | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    start_date: todayStr(),
    days: "90",
    start_weight: "",
    goal_weight: "",
  });

  function beginEdit(c: Challenge) {
    setEditing(c);
    setEditForm({
      name: c.name,
      start_date: c.start_date,
      days: String(c.days),
      start_weight: String(c.start_weight ?? ""),
      goal_weight: String(c.goal_weight ?? ""),
    });
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const days = Number(editForm.days);
    if (!days || days < 7 || days > 365) {
      toast.error("Challenge length must be 7-365 days");
      return;
    }
    update.mutate(
      {
        id: editing.id,
        name: editForm.name || "Challenge",
        start_date: editForm.start_date,
        days,
        start_weight: Number(editForm.start_weight || 0),
        goal_weight: Number(editForm.goal_weight || 0),
      },
      {
        onSuccess: () => {
          toast.success("Challenge updated");
          setEditing(null);
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  }

  function deleteChallenge(c: Challenge) {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    remove.mutate(c.id, {
      onSuccess: () => toast.success("Challenge deleted"),
      onError: (err: Error) => toast.error(err.message),
    });
  }

  const active = challenges.find((c) => c.status === "active");
  const past = challenges.filter((c) => c.status !== "active");
  const activeDone = active ? challengeProgress(active).elapsed >= active.days : false;

  const [form, setForm] = useState({
    name: "New Challenge",
    start_date: todayStr(),
    days: "90",
    start_weight: "",
    goal_weight: "",
  });

  const defaults = useMemo(
    () => ({
      start_weight: form.start_weight || String(iron.currentWeight || ""),
      goal_weight: form.goal_weight || String(iron.goalWeight || ""),
    }),
    [form.start_weight, form.goal_weight, iron.currentWeight, iron.goalWeight],
  );

  function launch(e: React.FormEvent) {
    e.preventDefault();
    const days = Number(form.days);
    if (!days || days < 7 || days > 365) {
      toast.error("Challenge length must be 7-365 days");
      return;
    }
    start.mutate(
      {
        name: form.name || "New Challenge",
        start_date: form.start_date,
        days,
        start_weight: Number(defaults.start_weight || 0),
        goal_weight: Number(defaults.goal_weight || 0),
      },
      {
        onSuccess: () => {
          toast.success("New challenge started");
          celebrate();
          setOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Challenges"
        description="Every run you have committed to, past and present."
        action={
          <button
            onClick={() => setOpen((o) => !o)}
            className="ember-bg inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            <Plus className="size-4" /> Start a new challenge
          </button>
        }
      />

      {open ? (
        <Panel title="New challenge" description="Starting a new challenge closes the current one.">
          <form onSubmit={launch} className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Name</span>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Start date</span>
              <input type="date" className={inputCls} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Length (days)</span>
              <input type="number" className={inputCls} value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              {PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm({ ...form, days: String(d) })}
                  className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
                    form.days === String(d) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Start weight (kg)</span>
              <input type="number" step="0.1" className={inputCls} value={defaults.start_weight} onChange={(e) => setForm({ ...form, start_weight: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Goal weight (kg)</span>
              <input type="number" step="0.1" className={inputCls} value={defaults.goal_weight} onChange={(e) => setForm({ ...form, goal_weight: e.target.value })} />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={start.isPending}
                className="ember-bg rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                Launch challenge
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      {editing ? (
        <Panel title={`Edit — ${editing.name}`} description="Update the details of this challenge.">
          <form onSubmit={saveEdit} className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Name</span>
              <input className={inputCls} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Start date</span>
              <input type="date" className={inputCls} value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Length (days)</span>
              <input type="number" className={inputCls} value={editForm.days} onChange={(e) => setEditForm({ ...editForm, days: e.target.value })} />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              {PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setEditForm({ ...editForm, days: String(d) })}
                  className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
                    editForm.days === String(d) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Start weight (kg)</span>
              <input type="number" step="0.1" className={inputCls} value={editForm.start_weight} onChange={(e) => setEditForm({ ...editForm, start_weight: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Goal weight (kg)</span>
              <input type="number" step="0.1" className={inputCls} value={editForm.goal_weight} onChange={(e) => setEditForm({ ...editForm, goal_weight: e.target.value })} />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={update.isPending}
                className="ember-bg rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/50"
              >
                <X className="size-4" /> Cancel
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      {active ? (
        <Panel
          title={`Active — ${active.name}`}
          description={`Day ${challengeProgress(active).elapsed} of ${active.days} · ends ${challengeProgress(active).endDate}`}
        >
          <Bar pct={challengeProgress(active).pct} />
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Cell label="Start weight" value={`${active.start_weight} kg`} />
            <Cell label="Current" value={`${iron.currentWeight} kg`} />
            <Cell label="Goal" value={`${active.goal_weight} kg`} />
            <Cell label="Avg score" value={`${iron.avgScore}%`} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() =>
                finish.mutate(
                  { id: active.id, status: "completed" },
                  {
                    onSuccess: () => {
                      toast.success("Challenge completed");
                      celebrate();
                    },
                    onError: (e: Error) => toast.error(e.message),
                  },
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-success/50 px-4 py-2.5 text-sm text-success hover:bg-success/10"
            >
              <CheckCircle2 className="size-4" /> {activeDone ? "Complete challenge" : "Finish early as complete"}
            </button>
            <button
              onClick={() =>
                finish.mutate(
                  { id: active.id, status: "abandoned" },
                  { onSuccess: () => toast("Challenge closed"), onError: (e: Error) => toast.error(e.message) },
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-destructive/50 hover:text-destructive"
            >
              <Flag className="size-4" /> Abandon
            </button>
            <button
              onClick={() => beginEdit(active)}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary"
            >
              <Pencil className="size-4" /> Edit
            </button>
            <button
              onClick={() => deleteChallenge(active)}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-destructive/50 hover:text-destructive"
            >
              <Trash2 className="size-4" /> Delete
            </button>
          </div>
        </Panel>
      ) : (
        <Panel title="No active challenge" description="Start a new one to resume tracking against a target.">
          <p className="text-sm text-muted-foreground">
            Your history stays intact — a new challenge simply resets the day counter and targets.
          </p>
        </Panel>
      )}

      <Panel title="Past challenges" description={`${past.length} completed or closed`}>
        {past.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {past.map((c) => {
              const change =
                c.end_weight != null ? Math.round((Number(c.start_weight) - Number(c.end_weight)) * 10) / 10 : null;
              return (
                <div key={c.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{c.name}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] ${
                        c.status === "completed" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.start_date} → {c.ended_at ?? addDays(c.start_date, c.days - 1)} · {c.days} days
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <Cell label="Start" value={`${c.start_weight} kg`} />
                    <Cell label="End" value={c.end_weight != null ? `${c.end_weight} kg` : "—"} />
                    <Cell label="Change" value={change != null ? `${change > 0 ? "-" : "+"}${Math.abs(change)} kg` : "—"} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => beginEdit(c)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary"
                    >
                      <Pencil className="size-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => deleteChallenge(c)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="size-4" /> No finished challenges yet. Your first one is in progress.
          </p>
        )}
      </Panel>
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="ember-bg h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/30 p-3">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}