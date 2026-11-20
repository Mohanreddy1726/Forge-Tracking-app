import { useMemo } from "react";
import {
  buildDayStats,
  customHabitToDef,
  useCustomHabits,
  streaks,
  useDailyLogs,
  useHabitLogs,
  useProfile,
  type DayStat,
} from "@/lib/data";
import { PROGRAM_DAYS, addDays, bmi, daysBetween, getForgeLevel, todayStr } from "@/lib/iron";

export function useIron() {
  const profileQ = useProfile();
  const logsQ = useDailyLogs();
  const habitsQ = useHabitLogs();
  const customQ = useCustomHabits();

  const profile = profileQ.data;
  const logs = useMemo(() => logsQ.data ?? [], [logsQ.data]);
  const habits = useMemo(() => habitsQ.data ?? [], [habitsQ.data]);
  const customHabits = useMemo(() => (customQ.data ?? []).map(customHabitToDef), [customQ.data]);

  const programDays = Number(profile?.program_days ?? PROGRAM_DAYS) || PROGRAM_DAYS;

  const stats: DayStat[] = useMemo(
    () => buildDayStats(profile, logs, habits, programDays, customHabits),
    [profile, logs, habits, programDays, customHabits],
  );

  const derived = useMemo(() => {
    const today = todayStr();
    const start = profile?.start_date ?? today;
    const rawDay = daysBetween(start, today) + 1;
    const notStarted = rawDay < 1;
    const daysUntilStart = notStarted ? 1 - rawDay : 0;
    const day = Math.min(programDays, Math.max(notStarted ? 0 : 1, rawDay));
    const endDate = addDays(start, programDays - 1);
    const weights = stats.filter((s) => s.weight != null) as (DayStat & { weight: number })[];
    const currentWeight = weights.length ? weights[weights.length - 1]!.weight : (profile?.start_weight ?? 0);
    const startWeight = Number(profile?.start_weight ?? 0);
    const goalWeight = Number(profile?.goal_weight ?? 0);
    const lost = Math.round((startWeight - currentWeight) * 10) / 10;
    const lostPct = startWeight ? Math.round((lost / startWeight) * 1000) / 10 : 0;
    const weeks = Math.max(1, day / 7);
    const weeklyAvgLoss = Math.round((lost / weeks) * 100) / 100;
    const remainingToGoal = Math.round((currentWeight - goalWeight) * 10) / 10;
    const weeksToGoal = weeklyAvgLoss > 0 ? remainingToGoal / weeklyAvgLoss : null;
    const finishWeight =
      weeklyAvgLoss > 0
        ? Math.round((currentWeight - weeklyAvgLoss * ((programDays - day) / 7)) * 10) / 10
        : currentWeight;
    const etaDate =
      weeksToGoal != null && weeksToGoal > 0
        ? addDays(today, Math.round(weeksToGoal * 7))
        : null;

    const { current: currentStreak, longest: longestStreak, shieldsAvailable, shieldsTotal } = streaks(stats);
    const totalScore = stats.reduce((s, d) => s + d.score, 0);
    const forgeLevel = getForgeLevel(totalScore);
    const avgScore = stats.length
      ? Math.round(totalScore / stats.length)
      : 0;
    const todayStat = stats.find((s) => s.date === today);

    const range = (n: number) => {
      const from = addDays(today, -(n - 1));
      const sub = stats.filter((s) => s.date >= from);
      return sub.length ? Math.round(sub.reduce((a, b) => a + b.score, 0) / sub.length) : 0;
    };

    return {
      day,
      notStarted,
      daysUntilStart,
      startDate: start,
      programDays,
      daysRemaining: Math.max(0, programDays - day),
      completionPct: Math.round((day / programDays) * 100),
      endDate,
      startWeight,
      goalWeight,
      currentWeight,
      lost,
      lostPct,
      weeklyAvgLoss,
      finishWeight,
      etaDate,
      remainingToGoal,
      bmi: bmi(currentWeight, Number(profile?.height_cm ?? 0)),
      currentStreak,
      longestStreak,
      shieldsAvailable,
      shieldsTotal,
      forgeLevel,
      totalScore,
      avgScore,
      todayScore: todayStat?.score ?? 0,
      todayHabits: todayStat?.habits ?? [],
      weekly: range(7),
      monthly: range(30),
      allTime: avgScore,
      elapsedDays: Math.max(0, daysBetween(start, today) + 1),
    };
  }, [profile, stats, programDays]);

  const weights = useMemo(
    () =>
      stats
        .filter((s): s is DayStat & { weight: number } => s.weight != null)
        .map((s) => ({ date: s.date, weight: s.weight })),
    [stats],
  );

  return {
    profile,
    logs,
    habits,
    stats,
    customHabits,
    weights,
    ...derived,
    isLoading: profileQ.isLoading || logsQ.isLoading || habitsQ.isLoading || customQ.isLoading,
  };
}
