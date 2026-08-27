"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Flame, Play, Square, Timer, Trash2 } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { RingProgress } from "@/components/ring-progress";
import { SuccessModal } from "@/components/success-modal";
import {
  useDeleteFast,
  useFastingLogs,
  useStartFast,
  useUpdateFast,
} from "@/lib/data";
import { celebrate } from "@/lib/celebrate";

const PLANS = [
  { key: "12:12", hours: 12, blurb: "Beginner overnight fast" },
  { key: "14:10", hours: 14, blurb: "Gentle daily fast" },
  { key: "16:8", hours: 16, blurb: "Classic intermittent fast" },
  { key: "18:6", hours: 18, blurb: "Deeper fat burn" },
  { key: "20:4", hours: 20, blurb: "Warrior protocol" },
  { key: "OMAD", hours: 23, blurb: "One meal a day" },
  { key: "24h", hours: 24, blurb: "Full day fast" },
  { key: "36h", hours: 36, blurb: "Extended fast" },
] as const;

function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function fmtDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function hoursBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 3600000;
}

export default function FastingPage() {
  const { data: rows = [] } = useFastingLogs();
  const start = useStartFast();
  const update = useUpdateFast();
  const del = useDeleteFast();

  const [plan, setPlan] = useState<string>("16:8");
  const [customHours, setCustomHours] = useState("16");
  const [startedAt, setStartedAt] = useState(() => toLocalInput(new Date()));
  const [notes, setNotes] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [success, setSuccess] = useState<string | null>(null);

  const activeRaw = rows.find((r) => !r.ended_at);
  // The schema marks started_at as optional, but a row with !ended_at was
  // started — narrow once so the rest of the file can use it as a string.
  const active = activeRaw?.started_at
    ? { ...activeRaw, started_at: activeRaw.started_at as string }
    : undefined;

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const targetHours =
    plan === "custom"
      ? Number(customHours || 0)
      : PLANS.find((p) => p.key === plan)?.hours ?? 16;

  const elapsedMs = active ? now - new Date(active.started_at).getTime() : 0;
  const targetMs = active ? Number(active.target_hours) * 3600000 : 0;
  const pct =
    targetMs > 0 ? Math.min(100, Math.round((elapsedMs / targetMs) * 100)) : 0;

  const completed = useMemo(
    () =>
      rows.filter(
        (r): r is typeof r & { started_at: string; ended_at: string } =>
          !!r.ended_at && !!r.started_at,
      ),
    [rows],
  );
  const stats = useMemo(() => {
    const durations = completed.map((r) => hoursBetween(r.started_at, r.ended_at));
    const hit = completed.filter((r, i) => durations[i]! >= Number(r.target_hours)).length;
    const totalHours = durations.reduce((a, b) => a + b, 0);
    return {
      count: completed.length,
      hit,
      longest: durations.length ? Math.max(...durations) : 0,
      avg: durations.length ? totalHours / durations.length : 0,
    };
  }, [completed]);

  function startFast() {
    if (active) return;
    if (!targetHours || targetHours <= 0) {
      toast.error("Set a target longer than 0 hours");
      return;
    }
    start.mutate(
      {
        plan: plan === "custom" ? `${targetHours}h custom` : plan,
        target_hours: targetHours,
        started_at: new Date(startedAt).toISOString(),
        notes: notes || null,
      },
      {
        onSuccess: () => {
          setNotes("");
          setNow(Date.now());
          setSuccess(`Fast started · target ${targetHours}h`);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  function endFast() {
    if (!active) return;
    const endedAt = new Date().toISOString();
    const total = hoursBetween(active.started_at, endedAt);
    update.mutate(
      { id: active.id, values: { ended_at: endedAt } },
      {
        onSuccess: () => {
          if (total >= Number(active.target_hours)) celebrate();
          setSuccess(
            `Fast complete · ${total.toFixed(1)}h of ${active.target_hours}h target`,
          );
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fasting"
        description="Intermittent, full-day or custom — the timer keeps you honest."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Fasts completed" value={stats.count} />
        <StatCard label="Targets hit" value={stats.hit} accent="success" hint={`of ${stats.count} fasts`} />
        <StatCard
          label="Longest fast"
          value={Math.round(stats.longest * 10) / 10}
          suffix=" h"
          accent="accent"
        />
        <StatCard
          label="Average fast"
          value={Math.round(stats.avg * 10) / 10}
          suffix=" h"
          accent="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title={active ? "Fast in progress" : "Start a fast"}
          description={
            active
              ? `${active.plan} · target ${active.target_hours}h`
              : "Pick a protocol and hit start"
          }
          className="lg:col-span-1"
        >
          <div className="flex flex-col items-center gap-4 py-2">
            <RingProgress
              value={active ? pct : 0}
              size={190}
              label={active ? fmtDuration(elapsedMs) : "00:00:00"}
              sublabel={active ? `${pct}% of ${active.target_hours}h` : "No active fast"}
            />
            {active ? (
              <>
                <p className="text-center text-xs text-muted-foreground">
                  Started {new Date(active.started_at).toLocaleString()}
                  {elapsedMs > targetMs
                    ? " · target reached, keep going or end it"
                    : ""}
                </p>
                <button
                  onClick={endFast}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-destructive/40 hover:text-destructive"
                >
                  <Square className="size-4" /> End fast
                </button>
              </>
            ) : (
              <button
                onClick={startFast}
                className="ember-bg inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <Play className="size-4" /> Start fast
              </button>
            )}
          </div>
        </Panel>

        <Panel
          title="Protocol"
          description="Choose a preset or set your own window"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PLANS.map((p) => (
              <button
                key={p.key}
                type="button"
                disabled={!!active}
                onClick={() => setPlan(p.key)}
                className={`rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-50 ${
                  plan === p.key
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-muted/20 hover:border-primary/30"
                }`}
              >
                <p className="text-sm font-semibold">{p.key}</p>
                <p className="text-[11px] text-muted-foreground">{p.blurb}</p>
              </button>
            ))}
            <button
              type="button"
              disabled={!!active}
              onClick={() => setPlan("custom")}
              className={`rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-50 ${
                plan === "custom"
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-muted/20 hover:border-primary/30"
              }`}
            >
              <p className="text-sm font-semibold">Custom</p>
              <p className="text-[11px] text-muted-foreground">Your own target</p>
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {plan === "custom" ? (
              <label className="block">
                <span className="mb-1.5 block text-xs text-muted-foreground">Target hours</span>
                <input
                  type="number"
                  min={1}
                  value={customHours}
                  disabled={!!active}
                  onChange={(e) => setCustomHours(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm disabled:opacity-50"
                />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Start time</span>
              <input
                type="datetime-local"
                value={startedAt}
                disabled={!!active}
                onChange={(e) => setStartedAt(e.target.value)}
                className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm disabled:opacity-50"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs text-muted-foreground">Notes</span>
              <input
                value={notes}
                disabled={!!active}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Water + black coffee only"
                className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm disabled:opacity-50"
              />
            </label>
          </div>
          {active ? (
            <p className="mt-3 text-xs text-muted-foreground">
              End the current fast to configure a new one.
            </p>
          ) : null}
        </Panel>
      </div>

      <Panel title="Fasting history" description="Most recent first">
        {rows.length ? (
          <div className="space-y-2">
            {rows.map((r) => {
              const done = !!r.ended_at;
              const hrs = done && r.started_at
                ? hoursBetween(r.started_at, r.ended_at as string)
                : elapsedMs / 3600000;
              const hitTarget = hrs >= Number(r.target_hours);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {done ? (
                        <Timer className="size-4 text-muted-foreground" />
                      ) : (
                        <Flame className="size-4 text-primary" />
                      )}
                      {r.plan} · {hrs.toFixed(1)}h / {r.target_hours}h
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          done
                            ? hitTarget
                              ? "bg-success/15 text-success"
                              : "bg-warning/15 text-warning"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        {done ? (hitTarget ? "target hit" : "short") : "running"}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.started_at ? new Date(r.started_at).toLocaleString() : "—"}
                      {r.ended_at ? ` → ${new Date(r.ended_at).toLocaleString()}` : ""}
                      {r.notes ? ` · ${r.notes}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => del.mutate(r.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Timer className="size-8" />}
            title="No fasts yet"
            description="Pick a protocol above and start your first fast."
          />
        )}
      </Panel>

      <SuccessModal
        open={success !== null}
        title="Fasting updated"
        description={success ?? undefined}
        onClose={() => setSuccess(null)}
      />
    </div>
  );
}
