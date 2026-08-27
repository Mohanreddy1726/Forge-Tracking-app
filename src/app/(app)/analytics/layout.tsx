import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by /calendar, /cardio,
 * /workouts, /nutrition, /measurements, /weight, /habits, /fasting.
 */

export const metadata: Metadata = {
  title: "Analytics — Forge",
  description:
    "Consistency scores, habit success rates, weekday patterns and mood/weight correlation.",
  openGraph: {
    title: "Analytics — Forge",
    description: "Deep analytics on your 180-day transformation data.",
  },
};

export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  return children;
}
