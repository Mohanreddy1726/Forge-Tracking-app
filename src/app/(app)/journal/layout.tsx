import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by every other page
 * in (app)/.
 */

export const metadata: Metadata = {
  title: "Journal — Forge",
  description: "Daily reflection: wins, mistakes, gratitude and tomorrow's one goal.",
  openGraph: {
    title: "Journal — Forge",
    description: "Reflect daily to keep the 180-day transformation honest.",
  },
};

export default function JournalLayout({ children }: { children: ReactNode }) {
  return children;
}