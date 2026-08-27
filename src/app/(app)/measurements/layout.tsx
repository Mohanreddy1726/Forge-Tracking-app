import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by /habits and /weight.
 */

export const metadata: Metadata = {
  title: "Body Measurements — Forge",
  description:
    "Weekly chest, waist, hip, neck, arm and leg measurements with comparison charts.",
  openGraph: {
    title: "Body Measurements — Forge",
    description: "Track and compare body measurements week by week.",
  },
};

export default function MeasurementsLayout({ children }: { children: ReactNode }) {
  return children;
}
