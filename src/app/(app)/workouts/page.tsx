"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  CheckCircle2,
  Dumbbell,
  Flame,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Timer,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { hapticSuccess, hapticTap } from "@/lib/haptic";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useDeleteRow,
  useInsertRow,
  useUpdateRow,
  useWorkoutLogs,
} from "@/lib/data";
import { formatDateLabel, todayStr } from "@/lib/iron";
import {
  axisTick,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "@/lib/chart-style";
import { EXERCISES, MUSCLE_GROUPS } from "@/lib/exercises";

type SetRow = { weight: string; reps: string };

/**
 * The generic `WorkoutLog` in `src/lib/types.ts` carries an open
 * `[key: string]: unknown` index signature to match the MongoDB schema,
 * but every row at runtime has the same concrete shape that the original
 * Lovable app stored. Narrow it locally so the page code is type-safe.
 */
type WorkoutRow = {
  id: string;
  log_date: string;
  workout_name: string;
  exercise: string;
  weight: number;
  sets: number;
  reps: number;
  notes?: string | null;
};

const EMPTY_SET: SetRow = { weight: "", reps: "10" };
const NOT_LISTED = "__not_listed__";

function playChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Ignore audio context errors
  }
}

function calculate1RM(weight: number, reps: number): number {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export default function WorkoutsPage() {
  const { data: rowsRaw = [] } = useWorkoutLogs();
  const rows = (rowsRaw ?? []) as unknown as WorkoutRow[];
  const insert = useInsertRow("workout_logs");
  const del = useDeleteRow("workout_logs");
  const updateRow = useUpdateRow("workout_logs");
  const [date, setDate] = useState(todayStr());

  // Rest Timer state
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(60);
  const [restRunning, setRestRunning] = useState(false);

  useEffect(() => {
    if (!restRunning || restRemaining === null) return;
    if (restRemaining <= 0) {
      setRestRunning(false);
      setRestRemaining(null);
      hapticSuccess();
      playChime();
      toast.success("Rest complete! Ready for next set.");
      return;
    }
    const timer = setTimeout(() => {
      setRestRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [restRunning, restRemaining]);

  function startRest(seconds: number) {
    hapticTap(15);
    setRestTotal(seconds);
    setRestRemaining(seconds);
    setRestRunning(true);
  }

  // Cascade: workout-name (muscle group) → exercise (filtered list).
  const [muscleGroup, setMuscleGroup] = useState<string>("");
  const [exercisePreset, setExercisePreset] = useState<string>("");
  const [exerciseCustom, setExerciseCustom] = useState("");
  const exercise = exercisePreset === NOT_LISTED ? exerciseCustom : exercisePreset;

  const [notes, setNotes] = useState("");
  const [setRows, setSetRows] = useState<SetRow[]>([{ ...EMPTY_SET }]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [success, setSuccess] = useState<null | { name: string; exercise: string; sets: number }>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    log_date: todayStr(),
    workout_name: "",
    exercise: "",
    weight: "",
    reps: "",
    notes: "",
  });

  const exerciseList = useMemo(
    () => (muscleGroup ? (EXERCISES[muscleGroup] ?? []) : []),
    [muscleGroup],
  );

  const exercises = useMemo(
    () => Array.from(new Set(rows.map((r) => r.exercise))).sort(),
    [rows],
  );
  const activeExercise = selected || exercises[0] || "";

  // Progressive Overload Ghosting: lookup previous session for the active form exercise
  const lastSession = useMemo(() => {
    if (!exercise.trim()) return null;
    const forEx = rows
      .filter((r) => r.exercise.toLowerCase() === exercise.trim().toLowerCase())
      .sort((a, b) => b.log_date.localeCompare(a.log_date));
    return forEx[0] ?? null;
  }, [rows, exercise]);

  // All-time best estimated 1RM for the active exercise
  const allTimeBest1RM = useMemo(() => {
    if (!exercise.trim()) return 0;
    const forEx = rows.filter((r) => r.exercise.toLowerCase() === exercise.trim().toLowerCase());
    return forEx.reduce((max, r) => Math.max(max, calculate1RM(Number(r.weight), r.reps)), 0);
  }, [rows, exercise]);

  const progression = useMemo(
    () =>
      rows
        .filter((r) => r.exercise === activeExercise)
        .slice()
        .sort((a, b) => a.log_date.localeCompare(b.log_date))
        .map((r) => ({
          label: formatDateLabel(r.log_date),
          weight: Number(r.weight),
          volume: Number(r.weight) * r.sets * r.reps,
        })),
    [rows, activeExercise],
  );

  const filtered = rows.filter(
    (r) =>
      !query ||
      r.exercise.toLowerCase().includes(query.toLowerCase()) ||
      r.workout_name.toLowerCase().includes(query.toLowerCase()),
  );

  const sessions = new Set(rows.map((r) => r.log_date)).size;
  const totalVolume = rows.reduce((a, r) => a + Number(r.weight) * r.sets * r.reps, 0);

  function updateSet(index: number, patch: Partial<SetRow>) {
    setSetRows((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSet() {
    setSetRows((prev) => [...prev, { ...(prev[prev.length - 1] ?? EMPTY_SET) }]);
  }

  function removeSet(index: number) {
    setSetRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!exercise.trim()) {
      toast.error("Pick or add an exercise");
      return;
    }
    if (!muscleGroup) {
      toast.error("Pick a muscle group");
      return;
    }
    const valid = setRows.filter((s) => Number(s.reps) > 0);
    if (!valid.length) {
      toast.error("Add at least one set with reps");
      return;
    }
    let done = 0;
    valid.forEach((s) => {
      insert.mutate(
        {
          log_date: date,
          workout_name: muscleGroup,
          exercise: exercise.trim(),
          weight: Number(s.weight || 0),
          sets: 1,
          reps: Number(s.reps || 0),
          notes: notes || null,
        },
        {
          onSuccess: () => {
            done += 1;
            if (done === valid.length) {
              setSuccess({ name: muscleGroup, exercise: exercise.trim(), sets: valid.length });
              setExercisePreset("");
              setExerciseCustom("");
              setNotes("");
              setSetRows([{ ...EMPTY_SET }]);
            }
          },
          onError: (err) => toast.error(err.message),
        },
      );
    });
  }

  function beginEdit(r: (typeof rows)[number]) {
    setEditingId(r.id);
    setEditForm({
      log_date: r.log_date,
      workout_name: r.workout_name,
      exercise: r.exercise,
      weight: String(r.weight),
      reps: String(r.reps),
      notes: r.notes ?? "",
    });
  }

  function saveEdit() {
    if (!editingId) return;
    if (!editForm.exercise.trim()) {
      toast.error("Exercise name is required");
      return;
    }
    updateRow.mutate(
      {
        id: editingId,
        values: {
          log_date: editForm.log_date,
          workout_name: editForm.workout_name,
          exercise: editForm.exercise.trim(),
          weight: Number(editForm.weight || 0),
          reps: Number(editForm.reps || 0),
          notes: editForm.notes || null,
        },
      },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Set updated");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workout tracker"
        description="Log every lift. Progression is proof."
        action={
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Sessions" value={sessions} icon={<Dumbbell className="size-4" />} />
        <StatCard label="Sets logged" value={rows.length} accent="accent" />
        <StatCard label="Total volume" value={Math.round(totalVolume)} suffix=" kg" accent="success" />
      </div>

      <Panel title="Log a workout" description="Pick a muscle group, then an exercise, then log your sets.">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Workout name — muscle group dropdown (Radix Select, styled). */}
            <div>
              <span className="mb-1.5 block text-xs text-muted-foreground">Workout name (muscle group)</span>
              <Select
                value={muscleGroup}
                onValueChange={(v) => {
                  setMuscleGroup(v);
                  setExercisePreset("");
                  setExerciseCustom("");
                }}
              >
                <SelectTrigger className="rounded-xl px-3 py-2.5">
                  <SelectValue placeholder="Pick a muscle group…" />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exercise — filtered by selected muscle group + custom fallback. */}
            <div>
              <span className="mb-1.5 block text-xs text-muted-foreground">Exercise</span>
              <Select
                value={exercisePreset}
                onValueChange={(v) => {
                  setExercisePreset(v);
                  if (v !== NOT_LISTED) setExerciseCustom("");
                }}
                disabled={!muscleGroup}
              >
                <SelectTrigger className="rounded-xl px-3 py-2.5">
                  <SelectValue
                    placeholder={
                      muscleGroup ? "Pick an exercise…" : "Pick a muscle group first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{muscleGroup || "—"}</SelectLabel>
                    {exerciseList.map((ex) => (
                      <SelectItem key={ex} value={ex}>
                        {ex}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectItem value={NOT_LISTED}>Not listed — enter here</SelectItem>
                </SelectContent>
              </Select>
              {exercisePreset === NOT_LISTED ? (
                <input
                  value={exerciseCustom}
                  onChange={(e) => setExerciseCustom(e.target.value)}
                  placeholder="Custom exercise"
                  className="mt-2 w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
                />
              ) : null}
            </div>

            <Input label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />
          </div>

          {/* Progressive Overload Ghost Banner */}
          {lastSession && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-primary">
                <Trophy className="size-4" /> Previous Session ({lastSession.log_date}):
              </span>
              <span className="font-medium text-foreground">
                {lastSession.weight} kg × {lastSession.reps} reps (Vol: {Number(lastSession.weight) * lastSession.sets * lastSession.reps} kg)
              </span>
            </div>
          )}

          {/* In-App Rest Timer */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-primary" />
              <span className="text-xs font-semibold">Rest Timer</span>
              {restRemaining !== null && (
                <span className="ml-1 rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  {restRemaining}s left
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {[30, 60, 90, 120].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => startRest(sec)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    restRemaining !== null && restTotal === sec
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card hover:border-primary/50"
                  }`}
                >
                  {sec}s
                </button>
              ))}
              {restRemaining !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setRestRunning(false);
                    setRestRemaining(null);
                  }}
                  className="rounded-lg border border-border bg-card p-1 text-muted-foreground hover:text-destructive"
                  title="Reset timer"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Sets</p>
            {setRows.map((s, i) => {
              const est1RM = calculate1RM(Number(s.weight), Number(s.reps));
              const isPR = allTimeBest1RM > 0 && est1RM > allTimeBest1RM;

              return (
                <div key={i} className="flex flex-col gap-1 rounded-xl border border-border bg-muted/20 p-2">
                  <div className="flex items-end gap-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="grid flex-1 gap-2 sm:grid-cols-2">
                      <Input label="Weight (kg)" type="number" value={s.weight} onChange={(v) => updateSet(i, { weight: v })} />
                      <Input label="Reps" type="number" value={s.reps} onChange={(v) => updateSet(i, { reps: v })} />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSet(i)}
                      disabled={setRows.length === 1}
                      className="mb-2.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
                      aria-label={`Remove set ${i + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {est1RM > 0 && (
                    <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                      <span>Est. 1RM: <strong className="text-foreground">{est1RM} kg</strong></span>
                      {isPR && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                          <Flame className="size-3 fill-primary" /> NEW PR!
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={addSet}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Plus className="size-4" /> Add set
            </button>
          </div>

          <button className="ember-bg inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Save workout
          </button>
        </form>
      </Panel>

      <Panel
        title="Progression"
        description={activeExercise ? `Weight and volume for ${activeExercise}` : "Log a lift to see progression"}
        action={
          exercises.length ? (
            <select
              value={activeExercise}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
            >
              {exercises.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          ) : null
        }
      >
        {progression.length ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progression}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" tick={axisTick} tickLine={false} axisLine={false} width={40} />
                <YAxis yAxisId="r" orientation="right" tick={axisTick} tickLine={false} axisLine={false} width={50} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
                <Line yAxisId="l" type="monotone" dataKey="weight" name="Weight (kg)" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line yAxisId="r" type="monotone" dataKey="volume" name="Volume" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState icon={<Dumbbell className="size-8" />} title="No workouts logged" description="Add your first set to unlock progression charts." />
        )}
      </Panel>

      <Panel
        title="History"
        action={
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises"
              className="rounded-xl border border-input bg-card py-2 pr-3 pl-9 text-sm"
            />
          </div>
        }
      >
        {filtered.length ? (
          <div className="space-y-2">
            {filtered.slice(0, 60).map((r) =>
              editingId === r.id ? (
                <div key={r.id} className="rounded-xl border border-primary/50 bg-muted/20 p-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-1.5 block text-xs text-muted-foreground">Date</span>
                      <input
                        type="date"
                        value={editForm.log_date}
                        max={todayStr()}
                        onChange={(e) => setEditForm({ ...editForm, log_date: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
                      />
                    </label>
                    <Input label="Workout name" value={editForm.workout_name} onChange={(v) => setEditForm({ ...editForm, workout_name: v })} />
                    <Input label="Exercise" value={editForm.exercise} onChange={(v) => setEditForm({ ...editForm, exercise: v })} />
                    <Input label="Weight (kg)" type="number" value={editForm.weight} onChange={(v) => setEditForm({ ...editForm, weight: v })} />
                    <Input label="Reps" type="number" value={editForm.reps} onChange={(v) => setEditForm({ ...editForm, reps: v })} />
                    <Input label="Notes" value={editForm.notes} onChange={(v) => setEditForm({ ...editForm, notes: v })} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={updateRow.isPending}
                      className="ember-bg rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm"
                    >
                      <X className="size-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {r.exercise} <span className="text-muted-foreground">· {r.workout_name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.log_date} · {r.weight}kg × {r.sets} × {r.reps}
                      {r.notes ? ` · ${r.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => beginEdit(r)} className="text-muted-foreground hover:text-primary" aria-label="Edit set">
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Delete this set?")) del.mutate(r.id);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete set"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <EmptyState title="No matching workouts" />
        )}
      </Panel>

      <Dialog open={success !== null} onOpenChange={(open) => !open && setSuccess(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" /> Workout added successfully
            </DialogTitle>
            <DialogDescription>
              {success
                ? `${success.sets} set${success.sets > 1 ? "s" : ""} of ${success.exercise} logged under ${success.name}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={() => setSuccess(null)}
            className="ember-bg mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Done
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
      />
    </label>
  );
}
