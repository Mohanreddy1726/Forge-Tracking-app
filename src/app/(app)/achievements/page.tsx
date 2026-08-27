"use client";

import { useEffect, useMemo } from "react";
import {
  Calendar,
  Droplets,
  Dumbbell,
  Flame,
  Salad,
  Star,
  Target,
  TrendingDown,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/panel";
import { useAchievements, useGrantAchievements, useWorkoutLogs } from "@/lib/data";
import { useIron } from "@/lib/use-iron";
import { ACHIEVEMENTS } from "@/lib/iron";
import { celebrate } from "@/lib/celebrate";

/*
 * Achievements — earns badges for streaks, milestones, weight goals and
 * workout volume. On every render we recompute which keys the user now
 * qualifies for; missing keys are POSTed to /api/achievements which grants
 * them server-side (unique index on userId + achievement_key).
 */

const ICONS: Record<string, LucideIcon> = {
  Flame,
  Calendar,
  Trophy,
  TrendingDown,
  Target,
  Dumbbell,
  Salad,
  Droplets,
  Star,
};

const TIER_STYLE: Record<string, string> = {
  bronze: "from-[oklch(0.62_0.12_60)] to-[oklch(0.45_0.10_40)]",
  silver: "from-[oklch(0.80_0.02_250)] to-[oklch(0.58_0.02_250)]",
  gold: "from-[oklch(0.85_0.16_85)] to-[oklch(0.62_0.16_60)]",
};

export default function AchievementsPage() {
  const iron = useIron();
  const { data: earnedRows = [] } = useAchievements();
  const { data: workouts = [] } = useWorkoutLogs();
  const grant = useGrantAchievements();

  const qualified = useMemo(() => {
    const keys: string[] = [];
    if (iron.longestStreak >= 7) keys.push("streak_7");
    if (iron.longestStreak >= 30) keys.push("streak_30");
    if (iron.day >= 50) keys.push("day_50");
    if (iron.day >= 100) keys.push("day_100");
    if (iron.day >= 180) keys.push("day_180");
    if (iron.lost >= 5) keys.push("lose_5");
    if (iron.lost >= 10) keys.push("lose_10");
    if (iron.goalWeight && iron.currentWeight <= iron.goalWeight) keys.push("goal_weight");
    if (new Set(workouts.map((w) => w.log_date)).size >= 100) keys.push("workouts_100");
    if (iron.stats.filter((s) => s.habits.includes("no_junk")).length >= 30) keys.push("no_junk_30");
    if (iron.stats.filter((s) => s.habits.includes("water")).length >= 30) keys.push("water_30");
    if (iron.stats.some((s) => s.score >= 100)) keys.push("perfect_day");
    return keys;
  }, [iron, workouts]);

  const earned = new Set(earnedRows.map((r) => r.achievement_key));
  const missing = qualified.filter((k) => !earned.has(k));

  useEffect(() => {
    if (missing.length && !grant.isPending) {
      grant.mutate(missing, { onSuccess: () => celebrate() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missing.join(",")]);

  const unlockedCount = ACHIEVEMENTS.filter((a) => earned.has(a.key) || qualified.includes(a.key)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Achievements"
        description={`${unlockedCount} of ${ACHIEVEMENTS.length} badges unlocked`}
      />

      <Panel title="Badge case">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const Icon = ICONS[a.icon] ?? Trophy;
            const unlocked = earned.has(a.key) || qualified.includes(a.key);
            return (
              <div
                key={a.key}
                className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
                  unlocked ? "border-primary/40 bg-card shadow-lg" : "border-border bg-muted/20 opacity-60"
                }`}
              >
                <div
                  className={`grid size-12 place-items-center rounded-xl bg-gradient-to-br ${
                    unlocked ? TIER_STYLE[a.tier] : "from-muted to-muted"
                  }`}
                >
                  <Icon className={`size-6 ${unlocked ? "text-background" : "text-muted-foreground"}`} />
                </div>
                <p className="mt-3 font-semibold">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.description}</p>
                <span className="mt-3 inline-block rounded-full border border-border px-2.5 py-0.5 text-[11px] tracking-wide uppercase">
                  {unlocked ? a.tier : "locked"}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}