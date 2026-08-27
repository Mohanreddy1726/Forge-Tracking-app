"use client";

import { useEffect } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  Check,
  Flame,
  Quote,
  Scale,
  Target,
  TrendingDown,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { RingProgress } from "@/components/ring-progress";
import { Heatmap } from "@/components/heatmap";
import { Skeleton } from "@/components/ui/skeleton";
import { useChallenges, useToggleHabit } from "@/lib/data";
import { useIron } from "@/lib/use-iron";
import {
  HABITS,
  formatDateLabel,
  movingAverage,
  quoteForDate,
  scoreColor,
  todayStr,
} from "@/lib/iron";
import {
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "@/lib/chart-style";

export default function Dashboard() {
  const iron = useIron();
  const { data: challenges = [] } = useChallenges();
  const activeChallenge = challenges.find((c) => c.status === "active");
  const pastChallenges = challenges.filter((c) => c.status !== "active");
  const toggle = useToggleHabit();
  const router = useRouter();
  const today = todayStr();

  // Bounce unboarded users to /onboarding. Guarded by a profile-loaded check
  // so we never redirect signed-in users on a slow network.
  useEffect(() => {
    if (iron.isLoading) return;
    if (!iron.profile) return;
    if (iron.profile.onboarding_completed !== true) {
      router.replace("/onboarding");
    }
  }, [iron.isLoading, iron.profile, router]);

  const weightSeries = useMemo(() => {
    const pts = iron.stats.map((s) => s.weight);
    const ma = movingAverage(pts, 7);
    return iron.stats.map((s, i) => ({
      date: formatDateLabel(s.date),
      weight: s.weight,
      avg: ma[i],
    }));
  }, [iron.stats]);

  const scoreSeries = useMemo(
    () =>
      iron.stats.slice(-14).map((s) => ({
        date: formatDateLabel(s.date),
        score: s.score,
      })),
    [iron.stats],
  );

  if (iron.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          iron.notStarted
            ? `Starts in ${iron.daysUntilStart} day${iron.daysUntilStart === 1 ? "" : "s"}`
            : `Day ${iron.day} of ${iron.programDays}`
        }
        description={
          iron.notStarted
            ? `Day 1 is ${iron.startDate} · ${iron.programDays}-day challenge ends ${iron.endDate}`
            : `${iron.daysRemaining} days remaining · ends ${iron.endDate}`
        }
        action={
          <Link
            href="/checkin"
            className="ember-bg rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Daily check-in
          </Link>
        }
      />

      {!activeChallenge ? (
        <Panel
          title="No active challenge"
          description="Your last challenge is done — pick your next target."
        >
          <Link
            href="/challenges"
            className="ember-bg inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Start a new challenge
          </Link>
        </Panel>
      ) : null}

      {pastChallenges.length ? (
        <Panel
          title="Past challenges"
          description="What you have already put behind you"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pastChallenges.slice(0, 3).map((c) => {
              const change =
                c.end_weight != null
                  ? Math.round((Number(c.start_weight) - Number(c.end_weight)) * 10) / 10
                  : null;
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{c.name}</p>
                    <span className="text-[11px] text-muted-foreground">{c.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.start_date} → {c.ended_at ?? "—"} · {c.days} days
                  </p>
                  <p className="mt-3 text-lg font-semibold">
                    {change != null
                      ? `${change >= 0 ? "-" : "+"}${Math.abs(change)} kg`
                      : "—"}
                  </p>
                </div>
              );
            })}
          </div>
          <Link
            href="/challenges"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            View all challenges →
          </Link>
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current weight"
          value={iron.currentWeight}
          decimals={1}
          suffix=" kg"
          icon={<Scale className="size-4" />}
          hint={`Start ${iron.startWeight} kg`}
        />
        <StatCard
          label="Total lost"
          value={iron.lost}
          decimals={1}
          suffix=" kg"
          accent="success"
          icon={<TrendingDown className="size-4" />}
          hint={`${iron.lostPct}% of body weight`}
        />
        <StatCard
          label="Target weight"
          value={iron.goalWeight}
          decimals={1}
          suffix=" kg"
          accent="accent"
          icon={<Target className="size-4" />}
          hint={`${iron.remainingToGoal} kg to go`}
        />
        <StatCard
          label="Weekly average"
          value={iron.weeklyAvgLoss}
          decimals={2}
          suffix=" kg/wk"
          accent="warning"
          icon={<Zap className="size-4" />}
          hint={`Est. finish ${iron.finishWeight} kg`}
        />
        <StatCard
          label="Current streak"
          value={iron.currentStreak}
          suffix=" days"
          icon={<Flame className="size-4" />}
          hint={`Longest ${iron.longestStreak} days`}
        />
        <StatCard
          label="Longest streak"
          value={iron.longestStreak}
          suffix=" days"
          accent="warning"
          icon={<Trophy className="size-4" />}
        />
        <StatCard
          label="Habit score"
          value={iron.avgScore}
          suffix="%"
          accent="success"
          icon={<Check className="size-4" />}
          hint="Overall average"
        />
        <StatCard
          label="Program complete"
          value={iron.completionPct}
          suffix="%"
          accent="accent"
          icon={<CalendarDays className="size-4" />}
          hint={`${iron.daysRemaining} days left`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Program progress"
          className="flex flex-col items-center justify-center gap-4 lg:col-span-1"
        >
          <RingProgress value={iron.completionPct}>
            <div>
              <p className="text-4xl font-semibold">{iron.day}</p>
              <p className="text-xs text-muted-foreground">of {iron.programDays} days</p>
            </div>
          </RingProgress>
          <div className="grid w-full grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-lg font-semibold">{iron.todayScore}%</p>
              <p className="text-[11px] text-muted-foreground">Today&apos;s score</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-lg font-semibold">{iron.bmi || "—"}</p>
              <p className="text-[11px] text-muted-foreground">BMI</p>
            </div>
          </div>
        </Panel>

        <Panel
          title="Weight trend"
          description="Daily weight with 7-day moving average"
          className="lg:col-span-2"
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightSeries}>
                <defs>
                  <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                />
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
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#wGrad)"
                  connectNulls
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Last 14 days"
          description="Daily habit score"
          className="lg:col-span-2"
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreSeries}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  cursor={{ fill: "var(--color-muted)", opacity: 0.25 }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {scoreSeries.map((d, i) => (
                    <Cell key={i} fill={scoreColor(d.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Today's motivation">
          <div className="flex h-full flex-col justify-center gap-4">
            <Quote className="size-6 text-primary" />
            <p className="text-lg leading-relaxed font-medium">
              {quoteForDate(new Date())}
            </p>
            <p className="text-xs text-muted-foreground">
              Day {iron.day} · keep the chain alive
            </p>
          </div>
        </Panel>
      </div>

      <Panel
        title="180-day heatmap"
        description="Every day colored by completion score"
      >
        <Heatmap stats={iron.stats} />
      </Panel>

      <Panel
        title="Today's checklist"
        description={`${iron.todayHabits.length} of ${HABITS.length} habits · ${iron.todayScore}% score`}
        action={
          <Link href="/habits" className="text-xs text-primary hover:underline">
            Open habit tracker
          </Link>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {HABITS.map((h) => {
            const done = iron.todayHabits.includes(h.key);
            return (
              <button
                key={h.key}
                onClick={() =>
                  toggle.mutate(
                    { log_date: today, habit_key: h.key, completed: !done },
                    {
                      onSuccess: () =>
                        toast.success(
                          done ? `Unchecked ${h.label}` : `${h.label} done`,
                        ),
                      onError: (e) => toast.error(e.message),
                    },
                  )
                }
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                  done
                    ? "border-success/40 bg-success/10 text-foreground"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <span className="truncate">{h.label}</span>
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                    done
                      ? "border-success bg-success text-success-foreground"
                      : "border-border"
                  }`}
                >
                  {done ? <Check className="size-3.5" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
