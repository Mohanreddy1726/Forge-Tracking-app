"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Target, X } from "lucide-react";
import Link from "next/link";
import {
  addDays,
  parseDate,
  scoreColor,
  todayStr,
  toDateStr,
  type DayType,
  HABITS,
} from "@/lib/iron";
import type { DayStat } from "@/lib/data";

/**
 * Fully custom month-view calendar — built from scratch (no external calendar
 * libs). Renders a 6-row × 7-col grid with day cells colored by completion
 * score, prev/next/today navigation, and a modal that opens on day click
 * summarising the registered data for that date.
 */

type HabitLog = { log_date: string; habit_key: string; completed: boolean };

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function fmtMonth(d: Date): string {
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const HABIT_LABEL: Record<string, string> = Object.fromEntries(
  HABITS.map((h) => [h.key, h.label]),
);

export function MonthCalendar({
  stats,
  habitLogs = [],
  initialDate,
}: {
  stats: DayStat[];
  habitLogs?: HabitLog[];
  initialDate?: Date;
}) {
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(initialDate ?? new Date()));
  const [selected, setSelected] = useState<string | null>(null);

  const statsByDate = useMemo(() => new Map(stats.map((s) => [s.date, s])), [stats]);
  const habitsByDate = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const h of habitLogs) {
      if (!h.completed) continue;
      const list = m.get(h.log_date) ?? [];
      list.push(h.habit_key);
      m.set(h.log_date, list);
    }
    return m;
  }, [habitLogs]);

  const today = new Date();
  const todayIso = todayStr();

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const startWeekday = first.getDay();
    const totalDays = last.getDate();
    const out: { date: Date; iso: string; inMonth: boolean }[] = [];

    // Leading padding days from previous month
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(first);
      d.setDate(d.getDate() - (i + 1));
      out.push({ date: d, iso: toDateStr(d), inMonth: false });
    }
    // In-month days
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      out.push({ date: d, iso: toDateStr(d), inMonth: true });
    }
    // Trailing padding to complete the 6-row grid (always 42 cells)
    while (out.length < 42) {
      const d = new Date(out[out.length - 1]!.date);
      d.setDate(d.getDate() + 1);
      out.push({ date: d, iso: toDateStr(d), inMonth: false });
    }
    return out;
  }, [cursor]);

  function goPrev() {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  }
  function goNext() {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  }
  function goToday() {
    setCursor(startOfMonth(new Date()));
  }

  const selectedStat = selected ? statsByDate.get(selected) : undefined;
  const selectedHabits = selected ? (habitsByDate.get(selected) ?? []) : [];
  const selectedDayType: DayType = (selectedStat?.dayType ?? "normal") as DayType;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Header / nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="grid size-9 place-items-center rounded-xl border border-border bg-card transition-colors hover:border-primary/50 hover:text-primary"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/50 hover:text-primary"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goNext}
            className="grid size-9 place-items-center rounded-xl border border-border bg-card transition-colors hover:border-primary/50 hover:text-primary"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{fmtMonth(cursor)}</h2>
        <div className="hidden w-[120px] sm:block" />
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* 6-row grid — fills remaining height */}
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-2">
        {cells.map((c) => {
          const stat = statsByDate.get(c.iso);
          const score = stat?.score ?? 0;
          const isToday = c.iso === todayIso;
          const isFuture = c.iso > todayIso;
          const dayHabits = habitsByDate.get(c.iso) ?? [];
          const dayType: DayType = (stat?.dayType ?? "normal") as DayType;
          const dayTypeLabel =
            dayType === "rest" ? "Rest" : dayType === "cheat" ? "Cheat" : null;

          return (
            <button
              key={c.iso}
              type="button"
              disabled={isFuture}
              onClick={() => setSelected(c.iso)}
              className={`group relative flex h-full min-h-0 flex-col items-stretch overflow-hidden rounded-xl border p-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                c.inMonth ? "border-border" : "border-border/40"
              } ${
                isToday
                  ? "ring-2 ring-primary"
                  : "hover:border-primary/50 hover:shadow-[0_0_0_3px_var(--color-primary)]/10"
              }`}
              style={{
                backgroundColor: isFuture
                  ? undefined
                  : stat
                    ? `${scoreColor(score)}22`
                    : undefined,
              }}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`text-sm font-semibold ${
                    isToday
                      ? "text-primary"
                      : c.inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/60"
                  }`}
                >
                  {c.date.getDate()}
                </span>
                {dayTypeLabel ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                      dayType === "rest"
                        ? "bg-accent/20 text-accent"
                        : "bg-warning/20 text-warning"
                    }`}
                  >
                    {dayTypeLabel}
                  </span>
                ) : null}
              </div>

              {stat ? (
                <>
                  <div className="mt-auto flex items-end justify-between">
                    <span
                      className="text-base font-bold sm:text-lg"
                      style={{ color: scoreColor(score) }}
                    >
                      {score}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {dayHabits.length}/{HABITS.length}
                    </span>
                  </div>
                </>
              ) : (
                <span className="mt-auto text-[10px] text-muted-foreground/60">
                  {isFuture ? "" : "—"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span>Score:</span>
        {[20, 50, 70, 90, 100].map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span
              className="size-3 rounded"
              style={{ backgroundColor: scoreColor(s), opacity: 0.4 }}
            />
            <span>{s}%</span>
          </span>
        ))}
      </div>

      {/* Day-detail modal */}
      {selected ? (
        <DayModal
          iso={selected}
          stat={selectedStat}
          habits={selectedHabits}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function DayModal({
  iso,
  stat,
  habits,
  onClose,
}: {
  iso: string;
  stat: DayStat | undefined;
  habits: string[];
  onClose: () => void;
}) {
  const date = parseDate(iso);
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const score = stat?.score ?? 0;
  const weight = stat?.weight;
  const dayType: DayType = (stat?.dayType ?? "normal") as DayType;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 px-5 pt-5 pb-4"
          style={{
            background: stat
              ? `linear-gradient(135deg, ${scoreColor(score)}33, transparent)`
              : undefined,
          }}
        >
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {dateLabel}
            </p>
            <h3 className="mt-1 text-xl font-semibold">
              {stat ? `${score}% day` : "No data"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 pt-2 pb-5">
          {/* Score ring + key stats */}
          <div className="flex items-center gap-4">
            <div
              className="grid size-16 shrink-0 place-items-center rounded-full border-2 text-lg font-bold"
              style={{
                borderColor: scoreColor(score),
                color: scoreColor(score),
              }}
            >
              {score}
            </div>
            <div className="flex-1 space-y-1 text-sm">
              <Row label="Day type" value={capitalize(dayType)} />
              <Row label="Habits done" value={`${habits.length} of ${HABITS.length}`} />
              <Row
                label="Weight"
                value={weight != null ? `${weight} kg` : "—"}
              />
            </div>
          </div>

          {/* Habit list */}
          {habits.length ? (
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Completed habits
              </p>
              <div className="flex flex-wrap gap-1.5">
                {habits.map((key) => (
                  <span
                    key={key}
                    className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs text-success"
                  >
                    {HABIT_LABEL[key] ?? key}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Missed habits */}
          {stat && habits.length < HABITS.length ? (
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Missed
              </p>
              <div className="flex flex-wrap gap-1.5">
                {HABITS.filter((h) => !habits.includes(h.key)).map((h) => (
                  <span
                    key={h.key}
                    className="rounded-full bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {h.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {!stat ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/10 p-4 text-center text-sm text-muted-foreground">
              No check-in recorded for this day.
            </p>
          ) : null}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Link
              href={`/checkin?date=${iso}`}
              className="ember-bg inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Target className="size-4" /> Edit check-in
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function capitalize(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

// Suppress unused warning on addDays — kept for future use inside this file.
void addDays;
