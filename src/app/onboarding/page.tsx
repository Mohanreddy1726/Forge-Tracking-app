"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Flame } from "lucide-react";
import { Panel } from "@/components/panel";
import { useProfile, useStartChallenge, useUpdateProfile } from "@/lib/data";
import { todayStr } from "@/lib/iron";

/*
 * Metadata lives in the sibling server-component layout.tsx — Next.js
 * disallows exporting metadata from a "use client" module.
 */

const PRESETS = [30, 60, 75, 90, 180, 365];

const inputCls =
  "w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

export default function Onboarding() {
  const { data: profile } = useProfile();
  const start = useStartChallenge();
  const update = useUpdateProfile();
  const router = useRouter();

  const [form, setForm] = useState({
    display_name: "",
    name: "My Transformation",
    start_date: todayStr(),
    days: "180",
    start_weight: "",
    goal_weight: "",
    height_cm: "170",
    age: "25",
    gender: "male",
    calorie_goal: "2000",
    protein_goal: "150",
    water_goal_ml: "3000",
    steps_goal: "10000",
    sleep_goal_hours: "7.5",
    workout_days: "5",
  });

  // Seed form from profile the first time it loads. Using a ref to gate the
  // update avoids the cascading-render lint rule (only re-sync if the user
  // is still on default values).
  const seededRef = useRef(false);
  useEffect(() => {
    if (!profile || seededRef.current) return;
    seededRef.current = true;
    setForm((f) => ({
      ...f,
      display_name: profile.display_name ?? "",
      start_weight: f.start_weight || String(profile.start_weight ?? ""),
      goal_weight: f.goal_weight || String(profile.goal_weight ?? ""),
      height_cm: String(profile.height_cm ?? 170),
      age: String(profile.age ?? 25),
      gender: profile.gender ?? "male",
    }));
  }, [profile]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const days = Number(form.days);
    if (!days || days < 7 || days > 365) {
      toast.error("Challenge length must be 7-365 days");
      return;
    }
    if (!form.start_weight || !form.goal_weight) {
      toast.error("Enter your start and goal weight");
      return;
    }

    update.mutate(
      {
        display_name: form.display_name || null,
        height_cm: Number(form.height_cm),
        age: Number(form.age),
        gender: form.gender,
        calorie_goal: Number(form.calorie_goal),
        protein_goal: Number(form.protein_goal),
        water_goal_ml: Number(form.water_goal_ml),
        steps_goal: Number(form.steps_goal),
        sleep_goal_hours: Number(form.sleep_goal_hours),
        workout_days: Number(form.workout_days),
      },
      {
        onSuccess: () =>
          start.mutate(
            {
              name: form.name || "My Transformation",
              start_date: form.start_date,
              days,
              start_weight: Number(form.start_weight),
              goal_weight: Number(form.goal_weight),
            },
            {
              onSuccess: () => {
                toast.success("Challenge started. Day 1 begins now.");
                router.replace("/dashboard");
              },
              onError: (err) => toast.error(err.message),
            },
          ),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  const pending = update.isPending || start.isPending;

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <span className="ember-bg mx-auto grid size-12 place-items-center rounded-2xl text-primary-foreground">
          <Flame className="size-6" />
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Set up your challenge</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A couple of details and the whole app tunes itself to your goals.
        </p>
      </div>

      <Panel title="You">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Display name" value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} placeholder="Your name" />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Gender</span>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputCls}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <Text label="Age" type="number" value={form.age} onChange={(v) => setForm({ ...form, age: v })} />
          <Text label="Height (cm)" type="number" step="0.1" value={form.height_cm} onChange={(v) => setForm({ ...form, height_cm: v })} />
        </div>
      </Panel>

      <Panel title="Challenge" description="How long are you committing for?">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Challenge name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Text label="Start date" type="date" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} />
          <Text label="Length (days)" type="number" value={form.days} onChange={(v) => setForm({ ...form, days: v })} />
          <div className="flex flex-wrap items-end gap-2">
            {PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm({ ...form, days: String(d) })}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  form.days === String(d) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
          <Text label="Start weight (kg)" type="number" step="0.1" value={form.start_weight} onChange={(v) => setForm({ ...form, start_weight: v })} placeholder="103.3" />
          <Text label="Goal weight (kg)" type="number" step="0.1" value={form.goal_weight} onChange={(v) => setForm({ ...form, goal_weight: v })} placeholder="85" />
        </div>
      </Panel>

      <Panel title="Daily targets" description="You can change these any time in Settings.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Text label="Calories" type="number" value={form.calorie_goal} onChange={(v) => setForm({ ...form, calorie_goal: v })} />
          <Text label="Protein (g)" type="number" value={form.protein_goal} onChange={(v) => setForm({ ...form, protein_goal: v })} />
          <Text label="Water (ml)" type="number" value={form.water_goal_ml} onChange={(v) => setForm({ ...form, water_goal_ml: v })} />
          <Text label="Steps" type="number" value={form.steps_goal} onChange={(v) => setForm({ ...form, steps_goal: v })} />
          <Text label="Sleep (h)" type="number" step="0.5" value={form.sleep_goal_hours} onChange={(v) => setForm({ ...form, sleep_goal_hours: v })} />
          <Text label="Workout days / week" type="number" value={form.workout_days} onChange={(v) => setForm({ ...form, workout_days: v })} />
        </div>
      </Panel>

      <button
        type="submit"
        disabled={pending}
        className="ember-bg inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {pending ? "Starting…" : "Start my challenge"} <ArrowRight className="size-4" />
      </button>
    </form>
  );
}

function Text({
  label,
  value,
  onChange,
  type = "text",
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </label>
  );
}
