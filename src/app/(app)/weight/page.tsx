"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Download, Scale, Trash2 } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { SuccessModal } from "@/components/success-modal";
import { useIron } from "@/lib/use-iron";
import { useDeleteWeight, useDailyLogs, useSaveDailyLog } from "@/lib/data";
import { formatDateLabel, movingAverage, todayStr } from "@/lib/iron";
import {
  axisTick,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "@/lib/chart-style";
import { downloadCsv } from "@/lib/export";

type RangeKey = "daily" | "weekly" | "monthly" | "all";

export default function WeightPage() {
  const iron = useIron();
  const { data: dailyLogs = [] } = useDailyLogs();
  const save = useSaveDailyLog();
  const delWeight = useDeleteWeight();
  const [range, setRange] = useState<RangeKey>("daily");
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayStr());
  const [logged, setLogged] = useState<string | null>(null);

  const series = useMemo(() => {
    const pts = iron.stats.map((s) => s.weight);
    const ma = movingAverage(pts, 7);
    const daily = iron.stats.map((s, i) => ({ date: s.date, weight: s.weight, avg: ma[i] }));
    if (range === "daily") return daily.slice(-30);
    if (range === "all") return daily;
    const bucket = range === "weekly" ? 7 : 30;
    const out: typeof daily = [];
    for (let i = 0; i < daily.length; i += bucket) {
      const chunk = daily.slice(i, i + bucket).filter((d) => d.weight != null);
      if (!chunk.length) continue;
      out.push({
        date: chunk[0]!.date,
        weight: Math.round((chunk.reduce((a, b) => a + (b.weight ?? 0), 0) / chunk.length) * 10) / 10,
        avg: chunk[chunk.length - 1]!.avg,
      });
    }
    return out;
  }, [iron.stats, range]);

  const chartData = series.map((d) => ({ ...d, label: formatDateLabel(d.date) }));

  // Latest rows with an actual weight, paired with the same 7-day moving
  // average shown on the chart so the table matches the trend line.
  const loggedWeights = useMemo(() => {
    const sorted = [...dailyLogs]
      .filter((l) => l.weight != null)
      .sort((a, b) => b.log_date.localeCompare(a.log_date));
    const pts = iron.stats.map((s) => s.weight);
    const ma = movingAverage(pts, 7);
    const avgByDate = new Map(iron.stats.map((s, i) => [s.date, ma[i]]));
    return sorted.slice(0, 60).map((l) => ({
      id: l.id,
      date: l.log_date,
      weight: l.weight,
      avg: avgByDate.get(l.log_date) ?? null,
    }));
  }, [dailyLogs, iron.stats]);

  function logWeight(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    save.mutate(
      { log_date: date, weight: Number(weight) },
      {
        onSuccess: () => {
          toast.success("Weight logged");
          setLogged(`${weight} kg on ${date}`);
          setWeight("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weight tracker"
        description="Log daily, judge weekly. The moving average is the truth."
        action={
          <button
            onClick={() =>
              downloadCsv(
                "iron180-weight.csv",
                iron.stats
                  .filter((s) => s.weight != null)
                  .map((s) => ({ date: s.date, weight: s.weight })),
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Download className="size-4" /> CSV
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current"
          value={iron.currentWeight}
          decimals={1}
          suffix=" kg"
          icon={<Scale className="size-4" />}
        />
        <StatCard
          label="Weight lost"
          value={iron.lost}
          decimals={1}
          suffix=" kg"
          accent="success"
          hint={`${iron.lostPct}%`}
        />
        <StatCard
          label="Avg weekly loss"
          value={iron.weeklyAvgLoss}
          decimals={2}
          suffix=" kg"
          accent="warning"
        />
        <StatCard
          label="BMI"
          value={iron.bmi}
          decimals={1}
          accent="accent"
          hint={`Est. finish ${iron.finishWeight} kg`}
        />
      </div>

      <Panel
        title="Log weight"
        description={
          iron.etaDate
            ? `At this pace you hit your goal around ${iron.etaDate}`
            : "Log consistently to unlock a goal prediction"
        }
      >
        <form onSubmit={logWeight} className="flex flex-wrap items-end gap-3">
          <label className="flex-1">
            <span className="mb-1.5 block text-xs text-muted-foreground">Date</span>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="flex-1">
            <span className="mb-1.5 block text-xs text-muted-foreground">Weight (kg)</span>
            <input
              type="number"
              step="0.1"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="82.4"
              className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
            />
          </label>
          <button className="ember-bg rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Log
          </button>
        </form>
      </Panel>

      <Panel
        title="Trend"
        action={
          <div className="flex gap-1 rounded-xl bg-muted/40 p-1">
            {(["daily", "weekly", "monthly", "all"] as RangeKey[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs capitalize transition-colors ${
                  range === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {r === "all" ? "180 day" : r}
              </button>
            ))}
          </div>
        }
      >
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis domain={["auto", "auto"]} tick={axisTick} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
              />
              <ReferenceLine
                y={iron.goalWeight}
                stroke="var(--color-success)"
                strokeDasharray="6 4"
                label={{ value: "Goal", fill: "var(--color-success)", fontSize: 11 }}
              />
              <ReferenceLine
                y={iron.startWeight}
                stroke="var(--color-muted-foreground)"
                strokeDasharray="2 4"
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#wg)"
                connectNulls
                dot={false}
                name="Weight"
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={false}
                connectNulls
                name="7-day avg"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Logged weights" description="Every value, newest first. Removing a value only clears that day's weight — mood, sleep and notes stay.">
        {loggedWeights.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Weight (kg)</th>
                  <th className="py-2 pr-3">7-day avg</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loggedWeights.map((w) => (
                  <tr key={w.id} className="border-b border-border/50 transition-colors hover:bg-muted/20">
                    <td className="py-2.5 pr-3 font-medium">{w.date}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{w.weight}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{w.avg ?? "—"}</td>
                    <td className="py-2.5">
                      <button
                        onClick={() => delWeight.mutate(w.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Scale className="size-8" />}
            title="No weights logged yet"
            description="Log your first value above to see it here."
          />
        )}
      </Panel>

      <SuccessModal
        open={logged !== null}
        title="Weight logged"
        description={logged ?? undefined}
        onClose={() => setLogged(null)}
      />
    </div>
  );
}
