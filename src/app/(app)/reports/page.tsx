"use client";

import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { PageHeader, Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { useIron } from "@/lib/use-iron";
import { useNutritionLogs, useWorkoutLogs } from "@/lib/data";
import { addDays, todayStr } from "@/lib/iron";
import { downloadCsv, printReport } from "@/lib/export";

/*
 * Reports — weekly (7d) or monthly (30d) summary tile row + per-day table.
 * CSV export via downloadCsv, browser print via printReport.
 */

export default function ReportsPage() {
  const iron = useIron();
  const { data: workouts = [] } = useWorkoutLogs();
  const { data: nutrition = [] } = useNutritionLogs();
  const [period, setPeriod] = useState<7 | 30>(7);

  const from = addDays(todayStr(), -(period - 1));
  const range = useMemo(() => iron.stats.filter((s) => s.date >= from), [iron.stats, from]);

  const avgScore = range.length ? Math.round(range.reduce((a, b) => a + b.score, 0) / range.length) : 0;
  const weights = range.filter((s) => s.weight != null);
  const weightChange =
    weights.length > 1
      ? Math.round((Number(weights[weights.length - 1]!.weight) - Number(weights[0]!.weight)) * 10) / 10
      : 0;
  const sessions = new Set(workouts.filter((w) => w.log_date >= from).map((w) => w.log_date)).size;
  const meals = nutrition.filter((n) => n.log_date >= from);
  const avgCalories = meals.length
    ? Math.round(
        meals.reduce((a, b) => a + Number(b.calories), 0) / new Set(meals.map((m) => m.log_date)).size,
      )
    : 0;
  const perfectDays = range.filter((s) => s.score >= 90).length;
  const missedDays = range.filter((s) => s.score === 0).length;

  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader
        title="Reports"
        description="A clean summary you can print, save or send to your coach."
        action={
          <div className="flex gap-2 print:hidden">
            <div className="flex gap-1 rounded-xl bg-muted/40 p-1">
              {([7, 30] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                    period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {p} days
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                downloadCsv(
                  `iron180-report-${period}d.csv`,
                  range.map((s) => ({
                    date: s.date,
                    score: s.score,
                    weight: s.weight ?? "",
                    habits: s.habits.length,
                    mood: s.log?.mood ?? "",
                    sleep: s.log?.sleep_hours ?? "",
                  })),
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:border-primary/50 hover:text-primary"
            >
              <Download className="size-4" /> CSV
            </button>
            <button
              onClick={printReport}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:border-primary/50 hover:text-primary"
            >
              <Printer className="size-4" /> Print
            </button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Avg score" value={avgScore} suffix="%" />
        <StatCard label="Weight change" value={weightChange} decimals={1} suffix=" kg" accent={weightChange <= 0 ? "success" : "warning"} />
        <StatCard label="Workout days" value={sessions} accent="accent" />
        <StatCard label="Avg calories" value={avgCalories} accent="warning" />
      </div>

      <Panel title={`Last ${period} days`} description={`Day ${iron.day} of 180 · ${perfectDays} strong days · ${missedDays} missed days`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Weight</th>
                <th className="py-2 pr-3">Habits</th>
                <th className="py-2 pr-3">Sleep</th>
                <th className="py-2 pr-3">Mood</th>
              </tr>
            </thead>
            <tbody>
              {[...range].reverse().map((s) => (
                <tr key={s.date} className="border-b border-border/50">
                  <td className="py-2.5 pr-3 font-medium">{s.date}</td>
                  <td className="py-2.5 pr-3">{s.score}%</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{s.weight ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{s.habits.length}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{s.log?.sleep_hours ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{s.log?.mood ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}