import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Camera,
  Dumbbell,
  Flame,
  LineChart,
} from "lucide-react";

const STEPS = [
  { title: "Set the challenge", text: "Pick your length — 30 days, 90, 180, whatever fits — and the habits that matter." },
  { title: "Log the grind", text: "Daily habits, weight, workouts, mood, water and protein, in under a minute." },
  { title: "Score the day", text: "16 habits weighted into one score out of 100. No guessing how you're doing." },
  { title: "Watch it compound", text: "Trends, streaks and a heatmap of every single day you showed up." },
];

const LEDGER = [
  { icon: Flame, title: "Habit scoring", text: "16 habits weighted into a daily score out of 100.", tag: "/16 habits" },
  { icon: LineChart, title: "Weight trends", text: "Moving averages, goal line and finish predictions.", tag: "trend + goal" },
  { icon: CalendarDays, title: "Streak heatmap", text: "Every day colored by completion, for any challenge length.", tag: "any length" },
  { icon: Dumbbell, title: "Workout logs", text: "Track lifts and watch progression over time.", tag: "sets & reps" },
  { icon: Camera, title: "Progress photos", text: "Front, side and back, with a comparison slider.", tag: "3 angles" },
  { icon: BarChart3, title: "Deep analytics", text: "Sleep, mood, water, protein and consistency.", tag: "5 metrics" },
];

const CELLS = Array.from({ length: 26 }, (_, i) => i);

const LOGO_URL =
  "https://ik.imagekit.io/petdz32jy/forge-progress/image_2026-08-27_150101975.png?updatedAt=1787823065685";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <style>{`
        @keyframes emberFill {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .ember-fill {
          transform-origin: bottom;
          animation: emberFill 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .ember-fill { animation: none; }
        }
      `}</style>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center overflow-hidden rounded-xl ring-1 ring-primary/25">
            <img src={LOGO_URL} alt="Forge" className="size-full object-cover" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Forge</span>
        </div>
        <Link
          href="/auth"
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-24 text-center sm:pt-16">
        <span className="animate-rise inline-block rounded-sm border border-primary/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Any challenge. Any length.
        </span>

        <h1 className="animate-rise mt-6 text-4xl font-semibold tracking-tight sm:text-6xl" style={{ animationDelay: "60ms" }}>
          Set the heat. <span className="ember-text">Forge yourself.</span>
        </h1>

        <p
          className="animate-rise mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
          style={{ animationDelay: "120ms" }}
        >
          A single-user command center for whatever challenge you&apos;re running. Weight, habits,
          nutrition, workouts, mood and photos — all scored, charted and streaked.
        </p>

        <div className="animate-rise mt-8 flex flex-col items-center gap-3" style={{ animationDelay: "180ms" }}>
          <Link
            href="/auth"
            className="ember-bg inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Start forging <ArrowRight className="size-4" />
          </Link>
          <span className="text-xs text-muted-foreground">Pick your own length. No fixed countdown.</span>
        </div>

        {/* signature element: the streak bar itself */}
        <div className="animate-rise mx-auto mt-14 max-w-2xl" style={{ animationDelay: "240ms" }}>
          <div className="flex items-end gap-[3px]">
            {CELLS.map((i) => {
              const t = i / (CELLS.length - 1);
              const heat = 0.12 + t * 0.88;
              return (
                <span
                  key={i}
                  className="h-7 flex-1 overflow-hidden rounded-[2px] sm:h-9"
                  style={{ opacity: heat }}
                >
                  <span
                    className="ember-fill block h-full w-full rounded-[2px] bg-primary"
                    style={{ animationDelay: `${260 + i * 18}ms` }}
                  />
                </span>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Day 1</span>
            <span className="flex items-center gap-1 text-primary">
              <Flame className="size-3" /> your streak, your length
            </span>
            <span>Day N</span>
          </div>
        </div>

        {/* process */}
        <div className="mt-24 text-left">
          <span className="inline-block rounded-sm border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            The process
          </span>
          <div className="relative mt-10">
            <div className="absolute left-0 right-0 top-4 hidden h-px bg-border sm:block" />
            <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-4">
              {STEPS.map((step, i) => (
                <div key={step.title}>
                  <span className="ember-bg relative z-10 grid size-8 place-items-center rounded-full text-xs font-bold text-primary-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ledger */}
        <div className="mt-24 text-left">
          <span className="inline-block rounded-sm border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            What&apos;s tracked
          </span>
          <div className="glass mt-6 rounded-2xl">
            {LEDGER.map(({ icon: Icon, title, text, tag }, i) => (
              <div
                key={title}
                className={`hover-lift flex items-center justify-between gap-4 p-5 ${
                  i !== LEDGER.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-4.5" />
                  </span>
                  <div>
                    <h2 className="font-semibold">{title}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
                  </div>
                </div>
                <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block">
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* closing cta */}
        <div className="ember-bg mt-24 rounded-2xl px-8 py-12 text-primary-foreground">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            The version of you in 90 days is built today.
          </h2>
          <Link
            href="/auth"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:scale-[1.03]"
          >
            Start your challenge <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Forge — built for one disciplined human, on their own timeline.
      </footer>
    </div>
  );
}