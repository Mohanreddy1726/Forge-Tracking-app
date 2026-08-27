"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Droplets, Moon, Save, Scale, Trash2, Zap } from "lucide-react";
import { PageHeader, Panel } from "@/components/panel";
import { SuccessModal } from "@/components/success-modal";
import { Slider } from "@/components/ui/slider";
import { useDeleteRow, useDailyLogs, useSaveDailyLog } from "@/lib/data";
import { MOODS, todayStr } from "@/lib/iron";
import { celebrate } from "@/lib/celebrate";

export default function CheckIn() {
  const [date, setDate] = useState(todayStr());
  const { data: logs } = useDailyLogs();
  const save = useSaveDailyLog();
  const del = useDeleteRow("daily_logs");
  const [saved, setSaved] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [form, setForm] = useState({
    weight: "",
    mood: "good",
    energy: 7,
    sleep_hours: "",
    sleep_quality: 7,
    water_ml: "",
    steps: "",
    notes: "",
  });

  // Seed the form from the existing log when the date or fetched logs change.
  // The seededRef gate keeps user edits intact across re-renders triggered
  // by stale query data — only re-seed when the user explicitly picks a
  // different date.
  const seededRef = useRef<string | null>(null);
  useEffect(() => {
    if (seededRef.current === date) return;
    seededRef.current = date;
    const existing = logs?.find((l) => l.log_date === date);
    setCurrentId(existing?.id ?? null);
    setForm({
      weight: existing?.weight != null ? String(existing.weight) : "",
      mood: existing?.mood ?? "good",
      energy: existing?.energy ?? 7,
      sleep_hours: existing?.sleep_hours != null ? String(existing.sleep_hours) : "",
      sleep_quality: existing?.sleep_quality ?? 7,
      water_ml: existing?.water_ml != null ? String(existing.water_ml) : "",
      steps: existing?.steps != null ? String(existing.steps) : "",
      notes: existing?.notes ?? "",
    });
  }, [logs, date]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    save.mutate(
      {
        log_date: date,
        weight: form.weight ? Number(form.weight) : null,
        mood: form.mood,
        energy: form.energy,
        sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
        sleep_quality: form.sleep_quality,
        water_ml: form.water_ml ? Number(form.water_ml) : null,
        steps: form.steps ? Number(form.steps) : null,
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Check-in saved");
          setSaved(true);
          celebrate();
          // Re-find the row to capture its id so the trash button stays
          // visible right after a save.
          const justSaved = logs?.find((l) => l.log_date === date);
          if (justSaved) setCurrentId(justSaved.id);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader
        title="Daily check-in"
        description="Two minutes a day keeps the transformation honest."
        action={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
            />
            {currentId ? (
              <button
                onClick={() => {
                  if (!window.confirm(`Delete the check-in for ${date}? This wipes every field for that day.`)) return;
                  del.mutate(currentId, {
                    onSuccess: () => {
                      setCurrentId(null);
                      seededRef.current = null; // re-seed effect after invalidation
                      toast.success("Check-in deleted");
                    },
                    onError: (e) => toast.error(e.message),
                  });
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Delete this check-in"
              >
                <Trash2 className="size-3.5" /> Delete day
              </button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Body">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Weight (kg)" icon={<Scale className="size-4" />}>
              <input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className={inputCls}
                placeholder="82.4"
              />
            </Field>
            <Field label="Steps">
              <input
                type="number"
                value={form.steps}
                onChange={(e) => setForm({ ...form, steps: e.target.value })}
                className={inputCls}
                placeholder="10000"
              />
            </Field>
            <Field label="Water (ml)" icon={<Droplets className="size-4" />}>
              <input
                type="number"
                step="50"
                value={form.water_ml}
                onChange={(e) => setForm({ ...form, water_ml: e.target.value })}
                className={inputCls}
                placeholder="3000"
              />
            </Field>
            <Field label="Sleep (hours)" icon={<Moon className="size-4" />}>
              <input
                type="number"
                step="0.25"
                value={form.sleep_hours}
                onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })}
                className={inputCls}
                placeholder="7.5"
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Mind">
          <p className="mb-2 text-xs text-muted-foreground">Mood</p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setForm({ ...form, mood: m.value })}
                className={`flex size-14 flex-col items-center justify-center rounded-2xl border text-2xl transition-all hover:scale-105 ${
                  form.mood === m.value
                    ? "border-primary bg-primary/15 shadow-[0_0_0_3px_var(--color-primary)]/15"
                    : "border-border bg-muted/20"
                }`}
                title={m.label}
              >
                {m.emoji}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-5">
            <SliderField
              label="Energy level"
              icon={<Zap className="size-4" />}
              value={form.energy}
              onChange={(v) => setForm({ ...form, energy: v })}
            />
            <SliderField
              label="Sleep quality"
              icon={<Moon className="size-4" />}
              value={form.sleep_quality}
              onChange={(v) => setForm({ ...form, sleep_quality: v })}
            />
          </div>
        </Panel>
      </div>

      <Panel title="Notes">
        <textarea
          rows={4}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="How did today actually go?"
          className={`${inputCls} resize-y`}
        />
      </Panel>

      <button
        type="submit"
        disabled={save.isPending}
        className="ember-bg inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        <Save className="size-4" /> Save check-in
      </button>

      <SuccessModal
        open={saved}
        title="Check-in saved"
        description={`Your log for ${date} is recorded.`}
        onClose={() => setSaved(false)}
      />
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function SliderField({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="font-mono text-sm text-primary">{value}/10</span>
      </div>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </div>
  );
}
