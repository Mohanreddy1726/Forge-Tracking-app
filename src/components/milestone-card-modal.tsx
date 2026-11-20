"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Flame, Share2, Sparkles, Trophy, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIron } from "@/lib/use-iron";
import { hapticSuccess, hapticTap } from "@/lib/haptic";

export function MilestoneCardModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const iron = useIron();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas size (Instagram Story / High-res portrait card)
    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;

    // 1. Dark industrial background with subtle radial glow
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#12141a");
    bgGrad.addColorStop(0.5, "#181b24");
    bgGrad.addColorStop(1, "#0d0e12");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Molten Ember Top Glow
    const glowGrad = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 0, 700);
    glowGrad.addColorStop(0, "rgba(232, 99, 40, 0.35)");
    glowGrad.addColorStop(0.5, "rgba(232, 99, 40, 0.08)");
    glowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    // 3. Card Outer Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // 4. Header: Logo & Branding
    ctx.font = "bold 44px sans-serif";
    ctx.fillStyle = "#e86328";
    ctx.textAlign = "center";
    ctx.fillText("FORGE", width / 2, 140);

    ctx.font = "600 20px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("TRANSFORMATION LEDGER", width / 2, 180);

    // 5. Day Count Pill
    ctx.fillStyle = "rgba(232, 99, 40, 0.15)";
    const pillWidth = 360;
    const pillHeight = 56;
    const pillX = (width - pillWidth) / 2;
    const pillY = 240;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(232, 99, 40, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`DAY ${iron.day} OF ${iron.programDays}`, width / 2, pillY + 37);

    // 6. Main Highlight: Streak Tile
    const tileWidth = 920;
    const tileHeight = 220;
    const tileX = (width - tileWidth) / 2;
    const tileY = 340;

    const streakGrad = ctx.createLinearGradient(tileX, tileY, tileX + tileWidth, tileY + tileHeight);
    streakGrad.addColorStop(0, "rgba(232, 99, 40, 0.18)");
    streakGrad.addColorStop(1, "rgba(232, 99, 40, 0.04)");
    ctx.fillStyle = streakGrad;
    ctx.beginPath();
    ctx.roundRect(tileX, tileY, tileWidth, tileHeight, 32);
    ctx.fill();
    ctx.strokeStyle = "rgba(232, 99, 40, 0.35)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#e86328";
    ctx.fillText("CURRENT STREAK", width / 2, tileY + 60);

    ctx.font = "bold 88px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`🔥 ${iron.currentStreak} DAYS`, width / 2, tileY + 160);

    // 7. Stat Grid (Weight Lost & Level)
    const colWidth = 440;
    const colHeight = 200;
    const col1X = tileX;
    const col2X = tileX + colWidth + 40;
    const gridY = 600;

    // Col 1: Weight Lost
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.beginPath();
    ctx.roundRect(col1X, gridY, colWidth, colHeight, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "600 20px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("WEIGHT LOST", col1X + colWidth / 2, gridY + 60);

    ctx.font = "bold 56px monospace";
    ctx.fillStyle = "#4ade80"; // Success green
    const lostText = iron.lost > 0 ? `-${iron.lost} KG` : `${iron.lost} KG`;
    ctx.fillText(lostText, col1X + colWidth / 2, gridY + 145);

    // Col 2: Level
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.beginPath();
    ctx.roundRect(col2X, gridY, colWidth, colHeight, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "600 20px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("FORGE LEVEL", col2X + colWidth / 2, gridY + 60);

    ctx.font = "bold 44px sans-serif";
    ctx.fillStyle = "#38bdf8"; // Cyan
    ctx.fillText(iron.forgeLevel.title.toUpperCase(), col2X + colWidth / 2, gridY + 140);

    // 8. Consistency Bar
    const consY = 850;
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.beginPath();
    ctx.roundRect(tileX, consY, tileWidth, 180, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "600 20px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("AVERAGE HABIT SCORE", width / 2, consY + 60);

    ctx.font = "bold 64px monospace";
    ctx.fillStyle = "#fbbf24"; // Amber
    ctx.fillText(`${iron.avgScore}%`, width / 2, consY + 140);

    // 9. Footer: Tagline & Verification
    ctx.font = "italic 26px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("“Build Yourself. Every Day.”", width / 2, 1160);

    ctx.font = "500 18px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillText("VERIFIED ON FORGE TRACKER", width / 2, 1220);

    setDataUrl(canvas.toDataURL("image/png"));
  }, [open, iron]);

  function downloadCard() {
    hapticTap(20);
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `forge-milestone-day-${iron.day}.png`;
    a.click();
    hapticSuccess();
    toast.success("Milestone card downloaded!");
  }

  async function shareCard() {
    hapticTap(20);
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `forge-milestone-day-${iron.day}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "My Forge Milestone",
          text: `Day ${iron.day} of Forge — ${iron.currentStreak} day streak!`,
          files: [file],
        });
        hapticSuccess();
        toast.success("Shared successfully!");
      } else {
        downloadCard();
      }
    } catch {
      downloadCard();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-4 text-primary" /> Share Milestone Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Card Preview */}
          <div className="relative mx-auto aspect-[4/5] max-h-[380px] w-full overflow-hidden rounded-2xl border border-border shadow-2xl">
            <canvas ref={canvasRef} className="size-full object-contain" />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadCard}
              className="ember-bg flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Download className="size-4" /> Download Card (PNG)
            </button>
            <button
              type="button"
              onClick={shareCard}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium hover:border-primary/50 hover:text-primary"
            >
              <Share2 className="size-4" /> Share
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
