import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the page can keep "use client" while still
 * exporting metadata — Next.js forbids exporting metadata from a client
 * component, but a server-component layout can declare it and the page below
 * inherits it.
 */

export const metadata: Metadata = {
  title: "Set Up Your Challenge — Forge",
  description:
    "Tell Forge about your body, goals and challenge length before you start.",
  openGraph: {
    title: "Set Up Your Challenge — Forge",
    description:
      "First-time setup for your personal transformation challenge.",
  },
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return children;
}
