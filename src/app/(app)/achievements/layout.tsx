import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by every other page
 * in (app)/.
 */

export const metadata: Metadata = {
  title: "Achievements — Forge",
  description: "Badges earned across streaks, milestones, weight goals and workout volume.",
  openGraph: {
    title: "Achievements — Forge",
    description: "Unlock badges as your 180-day transformation progresses.",
  },
};

export default function AchievementsLayout({ children }: { children: ReactNode }) {
  return children;
}