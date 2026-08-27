import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by /cardio, /workouts,
 * /nutrition, /measurements, /weight, /habits.
 */

export const metadata: Metadata = {
  title: "Fasting — Forge",
  description:
    "Track intermittent fasting, full-day fasts and custom protocols with a live timer and streak history.",
  openGraph: {
    title: "Fasting — Forge",
    description:
      "Live fasting timer, protocol presets and a complete fasting history.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function FastingLayout({ children }: { children: ReactNode }) {
  return children;
}
