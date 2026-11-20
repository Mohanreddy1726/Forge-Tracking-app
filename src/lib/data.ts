import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, patch, post, put } from "@/lib/api";
import type {
  AchievementRow,
  ActivityLog,
  CardioLog,
  Challenge,
  CustomHabit,
  DailyLog,
  FastingLog,
  HabitLog,
  JournalEntry,
  Measurement,
  NutritionLog,
  PhotoRow,
  Profile,
  WorkoutLog,
} from "@/lib/types";
import { PROGRAM_DAYS, addDays, scoreForKeys, todayStr, type DayType, type HabitDef } from "@/lib/iron";

/*
 * Data layer — same hooks and shapes as the original app, but talking to the
 * Next.js /api routes (MongoDB) instead of Supabase. The user is resolved
 * server-side from the session cookie.
 */

async function list<T>(url: string): Promise<T[]> {
  const data = await api<unknown>(url);
  return Array.isArray(data) ? (data as T[]) : [];
}

export function customHabitToDef(h: CustomHabit): HabitDef {
  return {
    key: h.habit_key,
    label: h.label,
    category: h.category as HabitDef["category"],
    points: h.points,
    icon: "Sparkles",
  };
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile> => api<Profile>("/api/profile"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patchValues: Partial<Profile>) => put("/api/profile", patchValues),
    onSuccess: () => void qc.invalidateQueries(),
  });
}

export function useDailyLogs() {
  return useQuery({
    queryKey: ["daily_logs"],
    queryFn: async (): Promise<DailyLog[]> => list("/api/daily-logs"),
  });
}

export function useHabitLogs() {
  return useQuery({
    queryKey: ["habit_logs"],
    queryFn: async (): Promise<HabitLog[]> => list("/api/habit-logs"),
  });
}

export function useNutritionLogs() {
  return useQuery({
    queryKey: ["nutrition_logs"],
    queryFn: async (): Promise<NutritionLog[]> => list("/api/logs/nutrition-logs"),
  });
}

export function useWorkoutLogs() {
  return useQuery({
    queryKey: ["workout_logs"],
    queryFn: async (): Promise<WorkoutLog[]> => list("/api/logs/workout-logs"),
  });
}

export function useCardioLogs() {
  return useQuery({
    queryKey: ["cardio_logs"],
    queryFn: async (): Promise<CardioLog[]> => list("/api/logs/cardio-logs"),
  });
}

export function useActivityLogs() {
  return useQuery({
    queryKey: ["activity_logs"],
    queryFn: async (): Promise<ActivityLog[]> => list("/api/logs/activity-logs"),
  });
}

export function useMeasurements() {
  return useQuery({
    queryKey: ["measurements"],
    queryFn: async (): Promise<Measurement[]> => list("/api/measurements"),
  });
}

export function useJournal() {
  return useQuery({
    queryKey: ["journal"],
    queryFn: async (): Promise<JournalEntry[]> => list("/api/journal"),
  });
}

export function usePhotos() {
  return useQuery({
    queryKey: ["photos_v2"],
    queryFn: async (): Promise<PhotoRow[]> => list("/api/photos"),
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async (): Promise<AchievementRow[]> => list("/api/achievements"),
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: async (): Promise<Challenge[]> => list("/api/challenges"),
  });
}

export function useCustomHabits() {
  return useQuery({
    queryKey: ["custom_habits"],
    queryFn: async (): Promise<CustomHabit[]> => list("/api/custom-habits"),
  });
}

export function useAddCustomHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { label: string; category: string; points: number }) =>
      post("/api/custom-habits", v),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["custom_habits"] }),
  });
}

export function useDeleteCustomHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api(`/api/custom-habits?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["custom_habits"] }),
  });
}

export function useUpdateCustomHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; label: string; category: string; points: number }) =>
      patch("/api/custom-habits", v),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["custom_habits"] }),
  });
}

export function useUpdateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      id: string;
      name: string;
      start_date: string;
      days: number;
      start_weight: number;
      goal_weight: number;
    }) => {
      const { id, ...values } = v;
      return patch(`/api/challenges/${id}`, values);
    },
    onSuccess: () => void qc.invalidateQueries(),
  });
}

export function useDeleteChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      api(`/api/challenges?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries(),
  });
}

export type NewChallenge = {
  name: string;
  start_date: string;
  days: number;
  start_weight: number;
  goal_weight: number;
};

/** Ends any active challenge and starts a fresh one, syncing the profile. */
export function useStartChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: NewChallenge & { finishStatus?: "completed" | "abandoned" }) =>
      post("/api/challenges/start", v),
    onSuccess: () => void qc.invalidateQueries(),
  });
}

export function useFinishChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; status: "completed" | "abandoned" }) =>
      post(`/api/challenges/${v.id}/finish`, { status: v.status }),
    onSuccess: () => void qc.invalidateQueries(),
  });
}

/* ---------------- mutations ---------------- */

export function useSaveDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<DailyLog> & { log_date: string }) =>
      post("/api/daily-logs", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily_logs"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["habit_logs"] });
    },
  });
}

export function useToggleHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { log_date: string; habit_key: string; completed: boolean }) =>
      post("/api/habit-logs", v),
    onMutate: async (newHabit) => {
      await qc.cancelQueries({ queryKey: ["habit_logs"] });
      const previousLogs = qc.getQueryData<HabitLog[]>(["habit_logs"]) ?? [];

      qc.setQueryData<HabitLog[]>(["habit_logs"], (old = []) => {
        const idx = old.findIndex(
          (h) => h.log_date === newHabit.log_date && h.habit_key === newHabit.habit_key,
        );
        if (idx >= 0) {
          const next = [...old];
          next[idx] = { ...next[idx]!, completed: newHabit.completed };
          return next;
        }
        return [
          ...old,
          {
            id: `temp-${Date.now()}`,
            log_date: newHabit.log_date,
            habit_key: newHabit.habit_key,
            completed: newHabit.completed,
          },
        ];
      });

      return { previousLogs };
    },
    onError: (_err, _newHabit, context) => {
      if (context?.previousLogs) {
        qc.setQueryData(["habit_logs"], context.previousLogs);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["habit_logs"] });
      qc.invalidateQueries({ queryKey: ["daily_logs"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

const GENERIC_TABLES = [
  "nutrition_logs",
  "workout_logs",
  "cardio_logs",
  "activity_logs",
  "photos",
] as const;

type GenericTable = (typeof GENERIC_TABLES)[number];

function tableSlug(table: GenericTable): string {
  return table.replace(/_/g, "-");
}

export function useInsertRow<T extends GenericTable>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => post(`/api/logs/${tableSlug(table)}`, values),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [table] }),
  });
}

export function useUpdateRow(table: GenericTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) =>
      patch(`/api/logs/${tableSlug(table)}`, { id, values }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [table] }),
  });
}

export function useDeleteRow(
  table:
    | GenericTable
    | "measurements"
    | "journal"
    | "fasting_logs"
    | "daily_logs"
    | "custom_habits"
    | "challenges",
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const q = `?id=${encodeURIComponent(id)}`;
      if (table === "measurements") return api(`/api/measurements${q}`, { method: "DELETE" });
      if (table === "daily_logs") return api(`/api/daily-logs${q}`, { method: "DELETE" });
      if (table === "custom_habits") return api(`/api/custom-habits${q}`, { method: "DELETE" });
      if (table === "challenges") return api(`/api/challenges${q}`, { method: "DELETE" });
      return api(`/api/logs/${tableSlug(table as GenericTable)}${q}`, { method: "DELETE" });
    },
    onSuccess: () => void qc.invalidateQueries(),
  });
}

export function useSaveMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<Measurement> & { log_date: string }) =>
      post("/api/measurements", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["measurements"] });
      qc.invalidateQueries({ queryKey: ["daily_logs"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useSaveJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<JournalEntry> & { log_date: string }) =>
      post("/api/journal", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      qc.invalidateQueries({ queryKey: ["daily_logs"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useGrantAchievements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (keys: string[]) => post("/api/achievements", { keys }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["achievements"] }),
  });
}

/* ---------------- derived stats ---------------- */

export type DayStat = {
  date: string;
  score: number;
  habits: string[];
  weight: number | null;
  dayType: DayType;
  log: DailyLog | undefined;
};

export function buildDayStats(
  profile: Profile | undefined,
  logs: DailyLog[],
  habits: HabitLog[],
  programDays = PROGRAM_DAYS,
  customHabits: HabitDef[] = [],
): DayStat[] {
  if (!profile) return [];
  const byDateHabits = new Map<string, string[]>();
  for (const h of habits) {
    if (!h.completed) continue;
    const list = byDateHabits.get(h.log_date) ?? [];
    list.push(h.habit_key);
    byDateHabits.set(h.log_date, list);
  }
  const byDateLog = new Map(logs.map((l) => [l.log_date, l]));
  const out: DayStat[] = [];
  const today = todayStr();
  for (let i = 0; i < programDays; i++) {
    const date = addDays(profile.start_date ?? today, i);
    if (date > today) break;
    const keys = byDateHabits.get(date) ?? [];
    const log = byDateLog.get(date);
    const dayType = ((log as { day_type?: string } | undefined)?.day_type ?? "normal") as DayType;
    out.push({
      date,
      score: scoreForKeys(keys, dayType, customHabits),
      habits: keys,
      dayType,
      weight: log?.weight != null ? Number(log.weight) : null,
      log,
    });
  }
  return out;
}

export function streaks(stats: DayStat[], threshold = 60) {
  let longest = 0;
  let run = 0;
  let totalStrongDays = 0;

  for (const s of stats) {
    if (s.score >= threshold) {
      run++;
      totalStrongDays++;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  const totalShieldsEarned = Math.floor(totalStrongDays / 14);
  let shieldsAvailable = Math.min(2, totalShieldsEarned);

  let current = 0;
  for (let i = stats.length - 1; i >= 0; i--) {
    if (stats[i]!.score >= threshold) {
      current++;
    } else if (shieldsAvailable > 0 && current > 0) {
      shieldsAvailable--;
      current++;
    } else {
      break;
    }
  }

  return {
    current,
    longest,
    shieldsTotal: totalShieldsEarned,
    shieldsAvailable: Math.min(2, totalShieldsEarned),
  };
}

export function useFastingLogs() {
  return useQuery({
    queryKey: ["fasting_logs"],
    queryFn: async (): Promise<FastingLog[]> => list("/api/logs/fasting-logs"),
  });
}

export function useStartFast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { plan: string; target_hours: number; started_at: string; notes?: string | null }) =>
      post("/api/logs/fasting-logs", v),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["fasting_logs"] }),
  });
}

export function useUpdateFast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<FastingLog> }) =>
      patch("/api/logs/fasting-logs", { id, values }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["fasting_logs"] }),
  });
}

export function useDeleteFast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      api(`/api/logs/fasting-logs?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["fasting_logs"] }),
  });
}

/** $unset the `weight` field on a single DailyLog row. */
export function useDeleteWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      api(`/api/weight?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["daily_logs"] }),
  });
}
