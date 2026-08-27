"use client";

import confetti from "canvas-confetti";

export function celebrate() {
  const colors = ["#ff8a3d", "#ffd166", "#4cc9f0"];
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors });
  setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 }, colors }), 220);
}
