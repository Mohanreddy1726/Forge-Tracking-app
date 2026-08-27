import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/animated-counter";

export function StatCard({
  label,
  value,
  decimals = 0,
  suffix = "",
  hint,
  icon,
  accent = "primary",
  className,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  hint?: string;
  icon?: ReactNode;
  accent?: "primary" | "accent" | "success" | "warning" | "destructive";
  className?: string;
}) {
  const accents: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    accent: "text-accent bg-accent/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  };
  return (
    <div className={cn("glass hover-lift animate-rise rounded-2xl p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        {icon ? (
          <span className={cn("grid size-8 place-items-center rounded-xl", accents[accent])}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold sm:text-3xl">
        <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
