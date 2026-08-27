import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by /habits, /weight,
 * /measurements, /nutrition.
 */

export const metadata: Metadata = {
  title: "Workouts — Forge",
  description:
    "Log workouts, sets, reps and weight, and watch strength progression over time.",
  openGraph: {
    title: "Workouts — Forge",
    description: "Workout logging with automatic strength progression charts.",
  },
};

export default function WorkoutsLayout({ children }: { children: ReactNode }) {
  return children;
}
