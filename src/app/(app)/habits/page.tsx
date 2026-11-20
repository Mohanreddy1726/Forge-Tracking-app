"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/panel";
import { RingProgress } from "@/components/ring-progress";
import {
  customHabitToDef,
  useAddCustomHabit,
  useCustomHabits,
  useDeleteCustomHabit,
  useSaveDailyLog,
  useToggleHabit,
  useUpdateCustomHabit,
} from "@/lib/data";
import { useIron } from "@/lib/use-iron";
import {
  DAY_TYPES,
  DAY_TYPE_EXEMPT,
  HABITS,
  HABIT_CATEGORIES,
  addDays,
  scoreForKeys,
  todayStr,
  type DayType,
  type HabitDef,
} from "@/lib/iron";
import { celebrate } from "@/lib/celebrate";
import { hapticTap } from "@/lib/haptic";

/*
 * Habit tracker — full habit list grouped by category, custom habit CRUD,
 * day-type picker (normal/rest/cheat) that adjusts which habits count toward
 * the daily score, and three rolling averages (weekly, monthly, 180-day).
 */

export default function Habits(): React.JSX.Element {
  const [date, setDate] = useState(todayStr());
  const iron = useIron();
  const toggle = useToggleHabit();
  const saveDay = useSaveDailyLog();
  const { data: customRows = [] } = useCustomHabits();
  const addHabit = useAddCustomHabit();
  const removeHabit = useDeleteCustomHabit();
  const editHabit = useUpdateCustomHabit();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState({ label: "", category: "Mind", points: "5" });

  const custom: HabitDef[] = useMemo(() => customRows.map(customHabitToDef), [customRows]);
  const customById = useMemo(
    () => new Map(customRows.map((r) => [r.habit_key, r.id])),
    [customRows],
  );

  function beginEditHabit(key: string) {
    const row = customRows.find((r) => r.habit_key === key);
    if (!row) return;
    setEditingId(row.id);
    setNewHabit({ label: row.label, category: row.category, points: String(row.points) });
    setShowForm(true);
  }

  function resetHabitForm() {
    setNewHabit({ label: "", category: "Mind", points: "5" });
    setEditingId(null);
    setShowForm(false);
  }

  function submitHabit(e: React.FormEvent) {
    e.preventDefault();
    const label = newHabit.label.trim();
    const points = Number(newHabit.points);
    if (!label) {
      toast.error("Give your habit a name");
      return;
    }
    if (!points || points < 1 || points > 25) {
      toast.error("Points must be between 1 and 25");
      return;
    }
    const handlers = {
      onSuccess: () => {
        toast.success(editingId ? `Updated "${label}"` : `Added "${label}"`);
        resetHabitForm();
      },
      onError: (err: Error) => toast.error(err.message),
    };
    if (editingId) {
      editHabit.mutate({ id: editingId, label, category: newHabit.category, points }, handlers);
    } else {
      addHabit.mutate({ label, category: newHabit.category, points }, handlers);
    }
  }

  const dayType = ((iron.logs.find((l) => l.log_date === date) as { day_type?: string } | undefined)
    ?.day_type ?? "normal") as DayType;
  const exempt = DAY_TYPE_EXEMPT[dayType] ?? [];
  const activeType = DAY_TYPES.find((d) => d.value === dayType) ?? DAY_TYPES[0]!;

  function setDayType(value: DayType) {
    saveDay.mutate(
      { log_date: date, day_type: value } as never,
      {
        onSuccess: () => {
          const meta = DAY_TYPES.find((d) => d.value === value)!;
          toast.success(`${meta.emoji} ${meta.label}`, { description: meta.description });
          if (value !== "normal") celebrate();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  const dayHabits = useMemo(
    () => iron.habits.filter((h) => h.log_date === date && h.completed).map((h) => h.habit_key),
    [iron.habits, date],
  );
  const score = scoreForKeys(dayHabits, dayType, custom);

  const ranges = useMemo(() => {
    const avg = (n: number) => {
      const from = addDays(todayStr(), -(n - 1));
      const sub = iron.stats.filter((s) => s.date >= from);
      return sub.length ? Math.round(sub.reduce((a, b) => a + b.score, 0) / sub.length) : 0;
    };
    return { daily: score, weekly: avg(7), monthly: avg(30), all: iron.avgScore };
  }, [iron.stats, iron.avgScore, score]);

  function flip(key: string, done: boolean) {
    hapticTap(15);
    toggle.mutate(
      { log_date: date, habit_key: key, completed: !done },
      {
        onSuccess: () => {
          if (!done && scoreForKeys([...dayHabits, key], dayType, custom) === 100) celebrate();
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habit tracker"
        description="Every habit is weighted. Hit them all for a perfect 100."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (showForm ? resetHabitForm() : setShowForm(true))}
              className="ember-bg inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              <Plus className="size-4" /> Add habit
            </button>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
            />
          </div>
        }
      />

      {showForm ? (
        <Panel
          title={editingId ? "Edit custom habit" : "New custom habit"}
          description="Your own habits count toward the daily score just like the built-in ones."
        >
          <form onSubmit={submitHabit} className="grid gap-4 sm:grid-cols-4">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs text-muted-foreground">Habit name</span>
              <input
                value={newHabit.label}
                onChange={(e) => setNewHabit({ ...newHabit, label: e.target.value })}
                placeholder="Cold shower"
                className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Category</span>
              <select
                value={newHabit.category}
                onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {HABIT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Points (1-25)</span>
              <input
                type="number"
                min={1}
                max={25}
                value={newHabit.points}
                onChange={(e) => setNewHabit({ ...newHabit, points: e.target.value })}
                className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <div className="flex gap-2 sm:col-span-4">
              <button
                type="submit"
                disabled={addHabit.isPending || editHabit.isPending}
                className="ember-bg rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {editingId
                  ? editHabit.isPending
                    ? "Saving…"
                    : "Save changes"
                  : addHabit.isPending
                    ? "Adding…"
                    : "Add habit"}
              </button>
              <button
                type="button"
                onClick={resetHabitForm}
                className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/50"
              >
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel title="Day type" description={activeType.description}>
        <div className="grid gap-3 sm:grid-cols-3">
          {DAY_TYPES.map((d) => {
            const on = d.value === dayType;
            return (
              <button
                key={d.value}
                type="button"
                disabled={saveDay.isPending}
                onClick={() => setDayType(d.value)}
                className={`hover-lift flex items-start gap-3 rounded-2xl border p-4 text-left transition-all disabled:opacity-60 ${
                  on ? "border-primary bg-primary/10" : "border-border bg-muted/20"
                }`}
              >
                <span className="text-2xl">{d.emoji}</span>
                <span>
                  <span className="block text-sm font-medium">{d.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{d.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="flex items-center justify-center">
          <RingProgress value={score} size={140} label={`${score}%`} sublabel="Daily score" />
        </Panel>
        <Metric label="Weekly average" value={ranges.weekly} />
        <Metric label="Monthly average" value={ranges.monthly} />
        <Metric label="180-day average" value={ranges.all} />
      </div>

      {HABIT_CATEGORIES.map((cat) => {
        const list = [...HABITS, ...custom].filter((h) => h.category === cat);
        return (
          <Panel key={cat} title={cat} description={`${list.length} habits`}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((h) => {
                const done = dayHabits.includes(h.key);
                const excused = exempt.includes(h.key);
                return (
                  <button
                    key={h.key}
                    disabled={excused}
                    onClick={() => flip(h.key, done)}
                    className={`hover-lift group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                      excused
                        ? "border-dashed border-border bg-muted/10 opacity-50"
                        : done
                          ? "border-success/50 bg-success/10"
                          : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium">{h.label}</span>
                      <span
                        className={`grid size-6 place-items-center rounded-lg border transition-colors ${
                          done
                            ? "border-success bg-success text-success-foreground"
                            : "border-border group-hover:border-primary"
                        }`}
                      >
                        {done ? <Check className="size-4" /> : null}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {excused ? `Excused — ${activeType.label.toLowerCase()}` : `${h.points} points`}
                    </p>
                    {customById.has(h.key) ? (
                      <span className="absolute right-2 bottom-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <span
                          role="button"
                          tabIndex={0}
                          title="Edit habit"
                          onClick={(e) => {
                            e.stopPropagation();
                            beginEditHabit(h.key);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="size-3.5" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          title="Delete habit"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!window.confirm(`Delete "${h.label}"?`)) return;
                            removeHabit.mutate(customById.get(h.key)!, {
                              onSuccess: () => toast.success("Habit removed"),
                              onError: (err) => toast.error(err.message),
                            });
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </span>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }): React.JSX.Element {
  return (
    <div className="glass flex flex-col justify-center rounded-2xl p-5">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}%</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="ember-bg h-full rounded-full transition-all duration-700" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
