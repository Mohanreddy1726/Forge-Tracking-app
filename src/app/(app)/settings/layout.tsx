import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by every other page
 * in (app)/.
 */

export const metadata: Metadata = {
  title: "Settings — Forge",
  description: "Manage your profile, program start date, weight goals and daily targets.",
  openGraph: {
    title: "Settings — Forge",
    description: "Configure your Forge goals and daily targets.",
  },
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}