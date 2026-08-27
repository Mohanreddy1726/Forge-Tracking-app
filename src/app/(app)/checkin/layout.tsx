import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by /onboarding.
 */

export const metadata: Metadata = {
  title: "Daily Check-In — Forge",
  description:
    "Log weight, mood, energy, sleep and water for today.",
  openGraph: {
    title: "Daily Check-In — Forge",
    description: "Log weight, mood, energy, sleep and water for today.",
  },
};

export default function CheckInLayout({ children }: { children: ReactNode }) {
  return children;
}
