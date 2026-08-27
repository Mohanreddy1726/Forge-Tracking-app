"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisTick, tooltipItemStyle, tooltipLabelStyle, tooltipStyle } from "@/lib/chart-style";
import { formatDateLabel } from "@/lib/iron";

export type WeightPoint = { date: string; weight: number };

/*
 * Weight trend area chart — matches the original Lovable dashboard visual:
 * ember-tinted gradient fill under the line, muted gridlines, themed tooltip.
 */
export function WeightChart({ points }: { points: WeightPoint[] }) {
  if (!points.length) {
    return (
      <div className="grid h-[260px] place-items-center rounded-2xl border border-dashed border-border/70 text-sm text-muted-foreground">
        No weight entries yet — log one on the Check-in page.
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={42}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
            labelFormatter={(value) => (typeof value === "string" ? formatDateLabel(value) : String(value))}
            formatter={(value) => [`${Number(value ?? 0)} kg`, "Weight"]}
            cursor={{ stroke: "var(--color-primary)", strokeOpacity: 0.4 }}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill="url(#weightFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
