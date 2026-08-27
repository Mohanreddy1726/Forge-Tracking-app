import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by /cardio, /workouts,
 * /nutrition, /measurements, /weight, /habits, /fasting.
 */

export const metadata: Metadata = {
  title: "Calendar — Forge",
  description:
    "Browse your 180-day transformation on a full month calendar. Tap any day to see what was logged.",
  openGraph: {
    title: "Calendar — Forge",
    description:
      "Full month view of every day in your transformation, with daily scores and logged data.",
  },
};

export default function CalendarLayout({ children }: { children: ReactNode }) {
  return children;
}
