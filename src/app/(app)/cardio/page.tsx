"use client";

import { useMemo, useState } from "react";
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
import { HeartPulse, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { SuccessModal } from "@/components/success-modal";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCardioLogs, useDeleteRow, useInsertRow, useUpdateRow } from "@/lib/data";
import { formatDateLabel, todayStr } from "@/lib/iron";
import {
  axisTick,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "@/lib/chart-style";
import { ACTIVITIES, ACTIVITY_CATEGORIES, INTENSITIES, NOT_LISTED } from "@/lib/activities";

type CardioRow = {
  id: string;
  log_date: string;
  activity: string;
  duration_min: number;
  distance_km: number;
  calories: number;
  avg_hr?: number | null;
  intensity: string;
  notes?: string | null;
};

const EMPTY = {
  activity: "",
  duration_min: "30",
  distance_km: "",
  calories: "",
  avg_hr: "",
  intensity: "moderate",
  notes: "",
};

export default function CardioPage() {
  const { data: rowsRaw = [] } = useCardioLogs();
  const rows = (rowsRaw ?? []) as unknown as CardioRow[];
  const insert = useInsertRow("cardio_logs");
  const updateRow = useUpdateRow("cardio_logs");
  const del = useDeleteRow("cardio_logs");
  const [date, setDate] = useState(todayStr());
  const [form, setForm] = useState({ ...EMPTY });
  const [query, setQuery] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("");

  // Activity — Radix Select + sentinel for "Not listed" inline input.
  const [activityPreset, setActivityPreset] = useState<string>("");
  const [activityCustom, setActivityCustom] = useState("");
  const activity = activityPreset === NOT_LISTED ? activityCustom : activityPreset;

  // Inline-edit state — mirrors the "Log a session" form for the row being edited.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editActivityPreset, setEditActivityPreset] = useState<string>("");
  const [editActivityCustom, setEditActivityCustom] = useState("");
  const editActivity = editActivityPreset === NOT_LISTED ? editActivityCustom : editActivityPreset;
  const [editForm, setEditForm] = useState({ ...EMPTY });

  const activities = useMemo(
    () => Array.from(new Set(rows.map((r) => r.activity))).sort(),
    [rows],
  );
  const activeActivity = selected || activities[0] || "";

  const progression = useMemo(
    () =>
      rows
        .filter((r) => r.activity === activeActivity)
        .slice()
        .sort((a, b) => a.log_date.localeCompare(b.log_date))
        .map((r) => {
          const dist = Number(r.distance_km);
          const dur = Number(r.duration_min);
          return {
            label: formatDateLabel(r.log_date),
            distance: dist,
            pace: dist > 0 ? Math.round((dur / dist) * 100) / 100 : 0,
            calories: Number(r.calories),
          };
        }),
    [rows, activeActivity],
  );

  const filtered = rows.filter(
    (r) =>
      !query ||
      r.activity.toLowerCase().includes(query.toLowerCase()) ||
      (r.notes ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const sessions = rows.length;
  const totalMinutes = rows.reduce((a, r) => a + Number(r.duration_min), 0);
  const totalDistance =
    Math.round(rows.reduce((a, r) => a + Number(r.distance_km), 0) * 10) / 10;
  const totalCalories = Math.round(rows.reduce((a, r) => a + Number(r.calories), 0));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!activity.trim()) {
      toast.error("Pick or add an activity");
      return;
    }
    insert.mutate(
      {
        log_date: date,
        activity,
        duration_min: Number(form.duration_min || 0),
        distance_km: Number(form.distance_km || 0),
        calories: Number(form.calories || 0),
        avg_hr: form.avg_hr ? Number(form.avg_hr) : null,
        intensity: form.intensity,
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Cardio session logged");
          setSuccess(
            `${activity} · ${form.duration_min || 0} min${
              form.distance_km ? ` · ${form.distance_km} km` : ""
            }`,
          );
          setForm({
            ...EMPTY,
            intensity: form.intensity,
            activity: activityPreset,
          });
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  function beginEdit(r: CardioRow) {
    setEditingId(r.id);
    setEditForm({
      activity: r.activity,
      duration_min: String(r.duration_min ?? ""),
      distance_km: String(r.distance_km ?? ""),
      calories: String(r.calories ?? ""),
      avg_hr: r.avg_hr != null ? String(r.avg_hr) : "",
      intensity: r.intensity ?? "moderate",
      notes: r.notes ?? "",
    });
    // If the row's activity is in the preset list, select it; otherwise
    // route through the "Not listed" custom path so the edit form reflects
    // the same value the row was originally saved with.
    const allPresets = Object.values(ACTIVITIES).flat();
    if (r.activity && allPresets.includes(r.activity)) {
      setEditActivityPreset(r.activity);
      setEditActivityCustom("");
    } else if (r.activity) {
      setEditActivityPreset(NOT_LISTED);
      setEditActivityCustom(r.activity);
    } else {
      setEditActivityPreset("");
      setEditActivityCustom("");
    }
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit() {
    if (!editingId) return;
    if (!editActivity.trim()) {
      toast.error("Pick or add an activity");
      return;
    }
    updateRow.mutate(
      {
        id: editingId,
        values: {
          log_date: date,
          activity: editActivity.trim(),
          duration_min: Number(editForm.duration_min || 0),
          distance_km: Number(editForm.distance_km || 0),
          calories: Number(editForm.calories || 0),
          avg_hr: editForm.avg_hr ? Number(editForm.avg_hr) : null,
          intensity: editForm.intensity,
          notes: editForm.notes || null,
        },
      },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Session updated");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cardio tracker"
        description="Every kilometre counts. Endurance is earned."
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sessions" value={sessions} icon={<HeartPulse className="size-4" />} />
        <StatCard label="Total time" value={Math.round(totalMinutes)} suffix=" min" accent="accent" />
        <StatCard label="Distance" value={totalDistance} suffix=" km" accent="success" />
        <StatCard label="Calories burned" value={totalCalories} suffix=" kcal" />
      </div>

      <Panel title="Log a session">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Activity — styled Radix Select with categories */}
          <div>
            <span className="mb-1.5 block text-xs text-muted-foreground">Activity</span>
            <Select
              value={activityPreset}
              onValueChange={(v) => {
                setActivityPreset(v);
                if (v !== NOT_LISTED) setActivityCustom("");
              }}
            >
              <SelectTrigger className="rounded-xl px-3 py-2.5">
                <SelectValue placeholder="Pick an activity…" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <SelectGroup key={cat}>
                    <SelectLabel>{cat}</SelectLabel>
                    {(ACTIVITIES[cat] ?? []).map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                <SelectItem value={NOT_LISTED}>Not listed — enter here</SelectItem>
              </SelectContent>
            </Select>
            {activityPreset === NOT_LISTED ? (
              <input
                value={activityCustom}
                onChange={(e) => setActivityCustom(e.target.value)}
                placeholder="Custom activity"
                className="mt-2 w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
              />
            ) : null}
          </div>

          <Input label="Duration (min)" type="number" value={form.duration_min} onChange={(v) => setForm({ ...form, duration_min: v })} />
          <Input label="Distance (km)" type="number" value={form.distance_km} onChange={(v) => setForm({ ...form, distance_km: v })} />
          <Input label="Calories" type="number" value={form.calories} onChange={(v) => setForm({ ...form, calories: v })} />
          <Input label="Avg HR" type="number" value={form.avg_hr} onChange={(v) => setForm({ ...form, avg_hr: v })} />

          {/* Intensity — styled Radix Select */}
          <div>
            <span className="mb-1.5 block text-xs text-muted-foreground">Intensity</span>
            <Select
              value={form.intensity}
              onValueChange={(v) => setForm({ ...form, intensity: v })}
            >
              <SelectTrigger className="rounded-xl px-3 py-2.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTENSITIES.map((i) => (
                  <SelectItem key={i} value={i} className="capitalize">
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-5">
            <Input label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          </div>
          <div className="lg:col-span-6">
            <button className="ember-bg inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              <Plus className="size-4" /> Add session
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Progression"
        description={
          activeActivity
            ? `Distance, pace and calories for ${activeActivity}`
            : "Log a session to see progression"
        }
        action={
          activities.length ? (
            <select
              value={activeActivity}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
            >
              {activities.map((a) => (
                <option key={a} value={a}>
                  {a}
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
                <Line yAxisId="l" type="monotone" dataKey="distance" name="Distance (km)" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line yAxisId="l" type="monotone" dataKey="pace" name="Pace (min/km)" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                <Line yAxisId="r" type="monotone" dataKey="calories" name="Calories" stroke="var(--color-muted-foreground)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={<HeartPulse className="size-8" />}
            title="No cardio logged"
            description="Add your first session to unlock progression charts."
          />
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
              placeholder="Search activities"
              className="rounded-xl border border-input bg-card py-2 pr-3 pl-9 text-sm"
            />
          </div>
        }
      >
        {filtered.length ? (
          <div className="space-y-2">
            {filtered.slice(0, 60).map((r) =>
              editingId === r.id ? (
                <div
                  key={r.id}
                  className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <div>
                      <span className="mb-1.5 block text-xs text-muted-foreground">Activity</span>
                      <Select
                        value={editActivityPreset}
                        onValueChange={(v) => {
                          setEditActivityPreset(v);
                          if (v !== NOT_LISTED) setEditActivityCustom("");
                        }}
                      >
                        <SelectTrigger className="rounded-xl px-3 py-2.5">
                          <SelectValue placeholder="Pick an activity…" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_CATEGORIES.map((cat) => (
                            <SelectGroup key={cat}>
                              <SelectLabel>{cat}</SelectLabel>
                              {(ACTIVITIES[cat] ?? []).map((a) => (
                                <SelectItem key={a} value={a}>
                                  {a}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                          <SelectItem value={NOT_LISTED}>Not listed — enter here</SelectItem>
                        </SelectContent>
                      </Select>
                      {editActivityPreset === NOT_LISTED ? (
                        <input
                          value={editActivityCustom}
                          onChange={(e) => setEditActivityCustom(e.target.value)}
                          placeholder="Custom activity"
                          className="mt-2 w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
                        />
                      ) : null}
                    </div>
                    <Input label="Duration (min)" type="number" value={editForm.duration_min} onChange={(v) => setEditForm({ ...editForm, duration_min: v })} />
                    <Input label="Distance (km)" type="number" value={editForm.distance_km} onChange={(v) => setEditForm({ ...editForm, distance_km: v })} />
                    <Input label="Calories" type="number" value={editForm.calories} onChange={(v) => setEditForm({ ...editForm, calories: v })} />
                    <Input label="Avg HR" type="number" value={editForm.avg_hr} onChange={(v) => setEditForm({ ...editForm, avg_hr: v })} />
                    <div>
                      <span className="mb-1.5 block text-xs text-muted-foreground">Intensity</span>
                      <Select
                        value={editForm.intensity}
                        onValueChange={(v) => setEditForm({ ...editForm, intensity: v })}
                      >
                        <SelectTrigger className="rounded-xl px-3 py-2.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INTENSITIES.map((i) => (
                            <SelectItem key={i} value={i} className="capitalize">
                              {i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="lg:col-span-5">
                      <Input label="Notes" value={editForm.notes} onChange={(v) => setEditForm({ ...editForm, notes: v })} />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <X className="size-3.5" /> Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={updateRow.isPending}
                      className="ember-bg inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {r.activity} <span className="text-muted-foreground capitalize">· {r.intensity}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.log_date} · {Number(r.duration_min)} min
                      {Number(r.distance_km) ? ` · ${Number(r.distance_km)} km` : ""}
                      {Number(r.calories) ? ` · ${Number(r.calories)} kcal` : ""}
                      {r.avg_hr ? ` · ${r.avg_hr} bpm` : ""}
                      {r.notes ? ` · ${r.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => beginEdit(r)}
                      className="text-muted-foreground hover:text-primary"
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => del.mutate(r.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <EmptyState title="No matching sessions" />
        )}
      </Panel>

      <SuccessModal
        open={success !== null}
        title="Cardio session logged"
        description={success ?? undefined}
        onClose={() => setSuccess(null)}
      />
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
