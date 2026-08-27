import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by every other page
 * in (app)/.
 */

export const metadata: Metadata = {
  title: "Reports — Forge",
  description: "Weekly and monthly transformation summaries with export to CSV or print.",
  openGraph: {
    title: "Reports — Forge",
    description: "Summarised weekly and monthly progress reports.",
  },
};

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return children;
}