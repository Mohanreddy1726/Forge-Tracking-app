"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Droplets, Plus, Scale, X, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDailyLogs, useSaveDailyLog, useToggleHabit } from "@/lib/data";
import { useIron } from "@/lib/use-iron";
import { HABITS, todayStr } from "@/lib/iron";
import { hapticTap, hapticSuccess } from "@/lib/haptic";

export function QuickLogModal() {
  const [open, setOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const today = todayStr();

  const iron = useIron();
  const { data: logs = [] } = useDailyLogs();
  const saveDaily = useSaveDailyLog();
  const toggleHabit = useToggleHabit();

  const todayLog = useMemo(() => logs.find((l) => l.log_date === today), [logs, today]);
  const currentWater = Number(todayLog?.water_ml ?? 0);
  const currentWeight = todayLog?.weight ?? iron.currentWeight ?? "";

  function addWater(amountMl: number) {
    hapticTap(20);
    const newTotal = currentWater + amountMl;
    saveDaily.mutate(
      { log_date: today, water_ml: newTotal },
      {
        onSuccess: () => {
          hapticSuccess();
          toast.success(`Logged +${amountMl}ml water (${newTotal}ml today)`);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function saveWeight(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    hapticTap(20);
    saveDaily.mutate(
      { log_date: today, weight: w },
      {
        onSuccess: () => {
          hapticSuccess();
          toast.success(`Logged weight: ${w} kg`);
          setWeightInput("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  const uncompletedHabits = useMemo(() => {
    return HABITS.filter((h) => !iron.todayHabits.includes(h.key));
  }, [iron.todayHabits]);

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => {
          hapticTap(15);
          setOpen(true);
        }}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-primary/40 bg-card/90 px-4 py-2.5 text-xs font-semibold text-primary shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-primary hover:bg-card md:bottom-6 md:right-6 md:text-sm"
        aria-label="Quick Log"
      >
        <span className="grid size-6 place-items-center rounded-full bg-primary/20 text-primary">
          <Zap className="size-3.5 fill-primary" />
        </span>
        <span className="font-semibold tracking-tight">Quick Log</span>
      </button>

      {/* Quick Log Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Zap className="size-4 text-primary" /> Quick Log — Today
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Quick Water */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Droplets className="size-3.5 text-accent" /> Water logged
                </span>
                <span>{currentWater} ml logged</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => addWater(250)}
                  disabled={saveDaily.isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 py-2.5 text-xs font-medium text-accent hover:bg-accent/20"
                >
                  <Plus className="size-3.5" /> +250 ml (Glass)
                </button>
                <button
                  type="button"
                  onClick={() => addWater(500)}
                  disabled={saveDaily.isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 py-2.5 text-xs font-medium text-accent hover:bg-accent/20"
                >
                  <Plus className="size-3.5" /> +500 ml (Bottle)
                </button>
              </div>
            </div>

            {/* Quick Weight */}
            <div className="space-y-2">
              <span className="flex items-center gap-1 text-xs font-medium text-foreground">
                <Scale className="size-3.5 text-primary" /> Log today&apos;s weight
              </span>
              <form onSubmit={saveWeight} className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder={`Current: ${currentWeight ? `${currentWeight} kg` : "e.g. 75.5"}`}
                  className="flex-1 rounded-xl border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={saveDaily.isPending || !weightInput}
                  className="ember-bg rounded-xl px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Save
                </button>
              </form>
            </div>

            {/* Quick Habits */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-foreground">
                Uncompleted habits ({uncompletedHabits.length} left)
              </span>
              {uncompletedHabits.length === 0 ? (
                <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-center text-xs text-success font-medium">
                  🎉 All default habits completed for today!
                </div>
              ) : (
                <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                  {uncompletedHabits.map((h) => (
                    <button
                      key={h.key}
                      type="button"
                      onClick={() => {
                        hapticTap(15);
                        toggleHabit.mutate(
                          { log_date: today, habit_key: h.key, completed: true },
                          {
                            onSuccess: () => {
                              hapticSuccess();
                              toast.success(`Completed ${h.label}`);
                            },
                          },
                        );
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-left text-xs hover:border-primary/50"
                    >
                      <span className="truncate">{h.label}</span>
                      <span className="text-[10px] text-muted-foreground">+{h.points} pts</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
