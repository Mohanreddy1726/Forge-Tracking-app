import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Camera,
  Dumbbell,
  Flame,
  LineChart,
  Trophy,
} from "lucide-react";

const FEATURES = [
  { icon: Flame, title: "Habit scoring", text: "16 habits weighted into a daily score out of 100." },
  { icon: LineChart, title: "Weight trends", text: "Moving averages, goal line and finish predictions." },
  { icon: CalendarDays, title: "180-day heatmap", text: "Every day colored by completion, GitHub style." },
  { icon: Dumbbell, title: "Workout logs", text: "Track lifts and watch progression over time." },
  { icon: Camera, title: "Progress photos", text: "Front, side and back with a comparison slider." },
  { icon: BarChart3, title: "Deep analytics", text: "Sleep, mood, water, protein and consistency." },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="ember-bg grid size-9 place-items-center rounded-xl font-bold text-primary-foreground">
            F
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

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20 text-center sm:pt-20">
        <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground">
          <Trophy className="size-3.5 text-primary" /> 180 days. One version of you.
        </p>
        <h1 className="animate-rise mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
          Build Yourself. <span className="ember-text">Every Day.</span>
        </h1>
        <p className="animate-rise mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          A single-user transformation command center. Weight, habits, nutrition, workouts, mood and
          photos — all scored, charted and streaked.
        </p>
        <div className="animate-rise mt-8 flex justify-center gap-3">
          <Link
            href="/auth"
            className="ember-bg inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Start your 180 <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="glass hover-lift rounded-2xl p-5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-4.5" />
              </span>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Forge — built for one disciplined human.
      </footer>
    </div>
  );
}
