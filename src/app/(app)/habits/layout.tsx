import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by /onboarding, /checkin,
 * /weight.
 */

export const metadata: Metadata = {
  title: "Habit Tracker — Forge",
  description:
    "Toggle your daily habits and watch your discipline score climb.",
  openGraph: {
    title: "Habit Tracker — Forge",
    description:
      "Toggle daily habits across fitness, nutrition, health and mind.",
  },
};

export default function HabitsLayout({ children }: { children: ReactNode }) {
  return children;
}
