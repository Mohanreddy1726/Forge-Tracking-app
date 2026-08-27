import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by /workouts, /nutrition,
 * /measurements, /weight, /habits.
 */

export const metadata: Metadata = {
  title: "Cardio — Forge",
  description:
    "Log runs, rides, walks and HIIT sessions, and track duration, distance, pace and calories burned.",
  openGraph: {
    title: "Cardio — Forge",
    description:
      "Cardio session logging with pace, distance and calorie progression charts.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function CardioLayout({ children }: { children: ReactNode }) {
  return children;
}
