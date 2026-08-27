"use client";

import { useMemo } from "react";
import Link from "next/link";
import { parseDate, scoreColor, todayStr } from "@/lib/iron";
import type { DayStat } from "@/lib/data";

/**
 * 180-day heatmap — one column per week, cells auto-size to fill the
 * container width via CSS grid (1fr per column). Original Lovable version
 * used fixed 12px cells which left the grid pinned to the left and looked
 * small on wide viewports. The grid layout stretches every cell to span
 * the full panel width while preserving the aspect ratio.
 */
export function Heatmap({ stats, weeks = 26 }: { stats: DayStat[]; weeks?: number }) {
  const byDate = useMemo(() => new Map(stats.map((s) => [s.date, s])), [stats]);
  const cells = useMemo(() => {
    const days: string[] = [];
    const today = new Date();
    const total = weeks * 7;
    const start = new Date(today);
    start.setDate(start.getDate() - total + 1);
    start.setDate(start.getDate() - start.getDay());
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, "0");
      const dd = `${d.getDate()}`.padStart(2, "0");
      days.push(`${y}-${m}-${dd}`);
    }
    return days;
  }, [weeks]);

  const columns: string[][] = [];
  for (let i = 0; i < cells.length; i += 7) columns.push(cells.slice(i, i + 7));

  return (
    <div className="w-full">
      <div
        className="grid w-full gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((date) => {
              const stat = byDate.get(date);
              const score = stat?.score ?? 0;
              const future = date > todayStr();
              return (
                <Link
                  key={date}
                  href="/calendar"
                  title={`${parseDate(date).toLocaleDateString()} — ${stat ? `${score}% score` : "no data"}`}
                  className="block aspect-square w-full rounded-[3px] transition-transform hover:scale-110"
                  style={{
                    backgroundColor: future
                      ? "transparent"
                      : stat
                        ? scoreColor(score)
                        : "var(--color-muted)",
                    opacity: stat ? (score === 0 ? 0.45 : 1) : 0.35,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Less</span>
        {[10, 40, 60, 80, 100].map((s) => (
          <span key={s} className="size-3 rounded-[3px]" style={{ backgroundColor: scoreColor(s) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
