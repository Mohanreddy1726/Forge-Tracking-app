import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by every other page
 * in (app)/.
 */

export const metadata: Metadata = {
  title: "Challenges — Forge",
  description: "Review every challenge you have run and launch your next one.",
  openGraph: {
    title: "Challenges — Forge",
    description: "Your challenge history and the launchpad for the next one.",
  },
};

export default function ChallengesLayout({ children }: { children: ReactNode }) {
  return children;
}