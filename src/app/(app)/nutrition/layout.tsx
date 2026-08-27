import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by /habits, /weight, /measurements.
 */

export const metadata: Metadata = {
  title: "Nutrition — Forge",
  description: "Log meals and track calories, protein, carbs, fat, fiber and sugar.",
  openGraph: {
    title: "Nutrition — Forge",
    description: "Meal logging with macro charts and daily goals.",
  },
};

export default function NutritionLayout({ children }: { children: ReactNode }) {
  return children;
}
