import { DailyLog } from "@/server/models";

/** Latest non-null logged weight, used when closing out a challenge. */
export async function lastLoggedWeight(userId: string): Promise<number | null> {
  const last = await DailyLog.findOne(
    { userId, weight: { $ne: null } },
    { weight: 1 },
  ).sort({ log_date: -1 });
  return last?.weight ?? null;
}
