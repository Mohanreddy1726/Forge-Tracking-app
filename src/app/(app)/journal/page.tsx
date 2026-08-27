"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { NotebookPen, Trash2 } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/panel";
import { SuccessModal } from "@/components/success-modal";
import { useDeleteRow, useJournal, useSaveJournal } from "@/lib/data";
import { quoteForDate, todayStr } from "@/lib/iron";

/*
 * Journal page — daily reflection: wins, mistakes, gratitude, tomorrow's
 * one goal, free reflection. Each date maps to one entry.
 */

const FIELDS = [
  { key: "win", label: "Today's win", placeholder: "What went right?" },
  { key: "mistake", label: "Today's mistake", placeholder: "What would you redo?" },
  { key: "gratitude", label: "Grateful for", placeholder: "One thing you're thankful for" },
  { key: "tomorrow_goal", label: "Tomorrow's one goal", placeholder: "The single most important thing" },
  { key: "reflection", label: "Free reflection", placeholder: "Anything else on your mind" },
] as const;

export default function JournalPage() {
  const { data: entries = [] } = useJournal();
  const save = useSaveJournal();
  const del = useDeleteRow("journal");
  const [date, setDate] = useState(todayStr());
  const [form, setForm] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState(false);

  // Latest entries without making it a dependency of the date-sync effect.
  // Without this, every TanStack Query re-render gives us a new array
  // reference and the effect re-fires after we setForm → infinite loop.
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  // Sync form fields when the *date* changes. New entries are picked up
  // automatically because entriesRef points at the latest list, and a
  // successful save invalidates the query which causes this page to
  // re-render — at which point entriesRef.current will include the new
  // row, and the user can re-navigate to it (or it just appears in
  // "Past entries" below).
  useEffect(() => {
    const existing = entriesRef.current.find((e) => e.log_date === date);
    setForm({
      win: existing?.win ?? "",
      mistake: existing?.mistake ?? "",
      gratitude: existing?.gratitude ?? "",
      tomorrow_goal: existing?.tomorrow_goal ?? "",
      reflection: existing?.reflection ?? "",
    });
  }, [date]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    save.mutate(
      {
        log_date: date,
        win: form["win"] || null,
        mistake: form["mistake"] || null,
        gratitude: form["gratitude"] || null,
        tomorrow_goal: form["tomorrow_goal"] || null,
        reflection: form["reflection"] || null,
      },
      {
        onSuccess: () => {
          toast.success("Journal saved");
          setSaved(true);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  const filtered = entries.filter((e) =>
    !query
      ? true
      : [e.win, e.mistake, e.gratitude, e.tomorrow_goal, e.reflection]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Journal" description={quoteForDate(new Date())} />

      <Panel
        title="Daily reflection"
        action={
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
          />
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.key} className={f.key === "reflection" ? "block lg:col-span-2" : "block"}>
                <span className="mb-1.5 block text-xs text-muted-foreground">{f.label}</span>
                <textarea
                  rows={f.key === "reflection" ? 5 : 3}
                  value={form[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full resize-none rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
                />
              </label>
            ))}
          </div>
          <button className="ember-bg rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Save entry
          </button>
        </form>
      </Panel>

      <Panel
        title="Past entries"
        action={
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries"
            className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
          />
        }
      >
        {filtered.length ? (
          <div className="space-y-3">
            {filtered.map((e) => (
              <div
                key={e.id}
                className="flex items-stretch rounded-xl border border-border bg-muted/20 transition-colors hover:border-primary/40"
              >
                <button
                  onClick={() => setDate(e.log_date)}
                  className="block w-full rounded-xl p-4 text-left"
                >
                  <p className="text-xs text-muted-foreground">{e.log_date}</p>
                  {e.win ? <p className="mt-1 text-sm"><span className="text-success">Win:</span> {e.win}</p> : null}
                  {e.tomorrow_goal ? (
                    <p className="mt-1 text-sm text-muted-foreground">Next: {e.tomorrow_goal}</p>
                  ) : null}
                </button>
                <button
                  onClick={() => del.mutate(e.id)}
                  className="px-4 text-muted-foreground hover:text-destructive"
                  aria-label="Delete entry"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<NotebookPen className="size-8" />} title="No entries yet" description="Write your first reflection above." />
        )}
      </Panel>

      <SuccessModal
        open={saved}
        title="Journal saved"
        description={`Reflection for ${date} recorded.`}
        onClose={() => setSaved(false)}
      />
    </div>
  );
}