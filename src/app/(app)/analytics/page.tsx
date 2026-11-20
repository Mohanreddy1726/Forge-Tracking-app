"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { PageHeader, Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { useIron } from "@/lib/use-iron";
import { useNutritionLogs } from "@/lib/data";
import { HABITS, HABIT_CATEGORIES, MOODS, formatDateLabel } from "@/lib/iron";
import { Flame, Sparkles, Target, Zap } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AnalyticsPage() {
  const iron = useIron();
  const { data: nutritionLogs = [] } = useNutritionLogs();

  const adaptiveTdee = useMemo(() => {
    const weights = iron.stats.filter((s) => s.weight != null);
    if (weights.length < 2) return null;

    const first = weights[0]!;
    const latest = weights[weights.length - 1]!;
    const deltaDays = Math.max(1, (new Date(latest.date).getTime() - new Date(first.date).getTime()) / 86400000);
    const deltaWeightKg = Number(latest.weight) - Number(first.weight);

    const mealsInWindow = nutritionLogs.filter(
      (n) => Boolean(n.log_date && n.log_date >= first.date && n.log_date <= latest.date),
    );
    const uniqueDays = new Set(mealsInWindow.map((m) => m.log_date ?? "")).size || 1;
    const totalCalories = mealsInWindow.reduce((a, b) => a + Number(b.calories || 0), 0);
    const avgIntake = Math.round(totalCalories / uniqueDays);

    if (!avgIntake) return null;

    // 7700 kcal per 1kg body fat
    const dailySurplusOrDeficit = (deltaWeightKg * 7700) / deltaDays;
    const tdee = Math.round(avgIntake - dailySurplusOrDeficit);

    const remainingKg = Number(iron.remainingToGoal);
    const daysLeft = Math.max(1, iron.daysRemaining);
    const neededDailyDeficit = (remainingKg * 7700) / daysLeft;
    const suggestedDailyCal = Math.max(1200, Math.round(tdee - neededDailyDeficit));

    return {
      tdee,
      avgIntake,
      deltaWeightKg: Math.round(deltaWeightKg * 10) / 10,
      deltaDays: Math.round(deltaDays),
      suggestedDailyCal,
      deficit: Math.round(tdee - avgIntake),
    };
  }, [iron.stats, iron.remainingToGoal, iron.daysRemaining, nutritionLogs]);

  const habitRates = useMemo(() => {
    const days = iron.stats.length || 1;
    return HABITS.map((h) => ({
      name: h.label,
      category: h.category,
      rate: Math.round(
        (iron.stats.filter((s) => s.habits.includes(h.key)).length / days) * 100,
      ),
    })).sort((a, b) => b.rate - a.rate);
  }, [iron.stats]);

  const categoryRadar = useMemo(
    () =>
      HABIT_CATEGORIES.map((c) => {
        const hs = habitRates.filter((h) => h.category === c);
        return {
          category: c,
          rate: hs.length ? Math.round(hs.reduce((a, b) => a + b.rate, 0) / hs.length) : 0,
        };
      }),
    [habitRates],
  );

  const weekday = useMemo(() => {
    const buckets = WEEKDAYS.map((d) => ({ day: d, total: 0, count: 0 }));
    for (const s of iron.stats) {
      const idx = new Date(`${s.date}T00:00:00`).getDay();
      buckets[idx]!.total += s.score;
      buckets[idx]!.count += 1;
    }
    return buckets.map((b) => ({
      day: b.day,
      score: b.count ? Math.round(b.total / b.count) : 0,
    }));
  }, [iron.stats]);

  const scatter = useMemo(
    () =>
      iron.stats
        .filter((s) => s.log?.mood != null && s.weight != null)
        .map((s) => ({
          mood: MOODS.find((m) => m.value === s.log?.mood)?.score ?? 3,
          weight: s.weight as number,
          label: formatDateLabel(s.date),
        })),
    [iron.stats],
  );

  const best = habitRates[0];
  const worst = habitRates[habitRates.length - 1];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Patterns you can't feel, only measure."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="7-day consistency" value={iron.weekly} suffix="%" />
        <StatCard label="30-day consistency" value={iron.monthly} suffix="%" accent="accent" />
        <StatCard label="All-time" value={iron.allTime} suffix="%" accent="success" />
        <StatCard label="Longest streak" value={iron.longestStreak} suffix=" days" accent="warning" />
      </div>

      {adaptiveTdee && (
        <Panel
          title="Adaptive TDEE & Energy Metabolism"
          description={`Calculated dynamically from real weigh-ins (${adaptiveTdee.deltaWeightKg > 0 ? `+${adaptiveTdee.deltaWeightKg}` : `${adaptiveTdee.deltaWeightKg}`} kg over ${adaptiveTdee.deltaDays}d) and nutrition logs.`}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <span className="text-xs text-muted-foreground">True Maintenance (TDEE)</span>
              <p className="mt-1 font-mono text-2xl font-bold text-foreground">
                {adaptiveTdee.tdee.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kcal/day</span>
              </p>
              <span className="text-[11px] text-muted-foreground">Real measured expenditure</span>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <span className="text-xs text-muted-foreground">Average Daily Intake</span>
              <p className="mt-1 font-mono text-2xl font-bold text-accent">
                {adaptiveTdee.avgIntake.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kcal/day</span>
              </p>
              <span className="text-[11px] text-muted-foreground">
                {adaptiveTdee.deficit >= 0 ? `${adaptiveTdee.deficit} kcal deficit` : `${Math.abs(adaptiveTdee.deficit)} kcal surplus`}
              </span>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <span className="text-xs font-semibold text-primary">Suggested Target for Goal</span>
              <p className="mt-1 font-mono text-2xl font-bold text-primary">
                {adaptiveTdee.suggestedDailyCal.toLocaleString()} <span className="text-xs font-normal text-primary/80">kcal/day</span>
              </p>
              <span className="text-[11px] text-primary/80">To hit goal weight on schedule</span>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <span className="text-xs text-muted-foreground">Rate of Change</span>
              <p className="mt-1 font-mono text-2xl font-bold text-success">
                {adaptiveTdee.deltaWeightKg > 0 ? `+${adaptiveTdee.deltaWeightKg}` : `${adaptiveTdee.deltaWeightKg}`} kg
              </p>
              <span className="text-[11px] text-muted-foreground">Over last {adaptiveTdee.deltaDays} days</span>
            </div>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Category balance" description="Average success rate by habit category">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={categoryRadar}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                />
                <Radar
                  dataKey="rate"
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                  fillOpacity={0.35}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-foreground)",
                  }}
                  itemStyle={{ color: "var(--color-foreground)" }}
                  labelStyle={{ color: "var(--color-muted-foreground)" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Best day of week" description="Average daily score by weekday">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekday}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={34}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-foreground)",
                  }}
                  itemStyle={{ color: "var(--color-foreground)" }}
                  labelStyle={{ color: "var(--color-muted-foreground)" }}
                  cursor={{ fill: "var(--color-muted)", opacity: 0.2 }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {weekday.map((w) => (
                    <Cell
                      key={w.day}
                      fill={
                        w.score >= 70
                          ? "var(--color-success)"
                          : "var(--color-primary)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel
        title="Habit success rates"
        description={
          best && worst
            ? `Strongest: ${best.name} (${best.rate}%) · Weakest: ${worst.name} (${worst.rate}%)`
            : ""
        }
      >
        <div className="space-y-2.5">
          {habitRates.map((h) => (
            <div key={h.name} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-sm">{h.name}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${h.rate}%`,
                    background:
                      h.rate >= 70
                        ? "var(--color-success)"
                        : h.rate >= 40
                          ? "var(--color-warning)"
                          : "var(--color-destructive)",
                  }}
                />
              </div>
              <span className="w-10 text-right text-xs text-muted-foreground">{h.rate}%</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Mood vs weight" description="Each dot is a logged day">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                type="number"
                dataKey="mood"
                name="Mood"
                domain={[1, 5]}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <YAxis
                type="number"
                dataKey="weight"
                name="Weight"
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                width={44}
              />
              <ZAxis range={[60, 60]} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  color: "var(--color-foreground)",
                }}
                itemStyle={{ color: "var(--color-foreground)" }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Scatter name="Days" data={scatter} fill="var(--color-accent)" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
