import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by /onboarding + /checkin.
 */

export const metadata: Metadata = {
  title: "Weight Tracker — Forge",
  description: "Daily weight logging with moving average, goal line and finish prediction.",
  openGraph: {
    title: "Weight Tracker — Forge",
    description: "Weight trends, moving average, BMI and goal prediction.",
  },
};

export default function WeightLayout({ children }: { children: ReactNode }) {
  return children;
}
