import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Server-only sibling layout so the client page can keep "use client" while
 * still exporting metadata. Matches the pattern used by every other page
 * in (app)/.
 */

export const metadata: Metadata = {
  title: "Photos — Forge",
  description:
    "Track visible progress with front, side and back photos stored securely via ImageKit.",
  openGraph: {
    title: "Photos — Forge",
    description:
      "Visual proof of your transformation. Pose-tagged progress photos, stored privately.",
  },
};

export default function PhotosLayout({ children }: { children: ReactNode }) {
  return children;
}
