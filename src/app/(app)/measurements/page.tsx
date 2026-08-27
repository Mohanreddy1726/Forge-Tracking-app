"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Ruler, Trash2 } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/panel";
import { SuccessModal } from "@/components/success-modal";
import { useDeleteRow, useMeasurements, useSaveMeasurement } from "@/lib/data";
import { MEASUREMENT_FIELDS, todayStr } from "@/lib/iron";
import {
  axisTick,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "@/lib/chart-style";

export default function MeasurementsPage() {
  const { data: rows = [] } = useMeasurements();
  const save = useSaveMeasurement();
  const del = useDeleteRow("measurements");
  const [date, setDate] = useState(todayStr());
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = rows.find((r) => r.log_date === date);
    const next: Record<string, string> = {};
    for (const f of MEASUREMENT_FIELDS) next[f] = existing?.[f] != null ? String(existing[f]) : "";
    setForm(next);
  }, [rows, date]);

  const first = rows[0];
  const last = rows[rows.length - 1];
  const comparison = MEASUREMENT_FIELDS.map((f) => ({
    field: f[0]!.toUpperCase() + f.slice(1),
    first: first?.[f] != null ? Number(first[f]) : 0,
    latest: last?.[f] != null ? Number(last[f]) : 0,
  }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, number | null> = {};
    for (const f of MEASUREMENT_FIELDS) payload[f] = form[f] ? Number(form[f]) : null;
    save.mutate(
      { log_date: date, ...payload },
      {
        onSuccess: () => {
          toast.success("Measurements saved");
          setSaved(true);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Body measurements" description="Log weekly. The scale lies, the tape doesn't." />

      <Panel
        title="Log measurements (cm)"
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MEASUREMENT_FIELDS.map((f) => (
              <label key={f} className="block">
                <span className="mb-1.5 block text-xs text-muted-foreground capitalize">{f}</span>
                <input
                  type="number"
                  step="0.1"
                  value={form[f] ?? ""}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
                />
              </label>
            ))}
          </div>
          <button className="ember-bg rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Save
          </button>
        </form>
      </Panel>

      <Panel title="First vs latest" description="Compare where you started with where you are">
        {rows.length ? (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="field" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  cursor={{ fill: "var(--color-muted)", opacity: 0.2 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="first" name="First" fill="var(--color-muted-foreground)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="latest" name="Latest" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={<Ruler className="size-8" />}
            title="No measurements yet"
            description="Log your first set above to unlock comparison charts."
          />
        )}
      </Panel>

      <Panel title="History">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Date</th>
                  {MEASUREMENT_FIELDS.map((f) => (
                    <th key={f} className="py-2 pr-3 capitalize">
                      {f}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => (
                  <tr key={r.id} className="border-b border-border/50 transition-colors hover:bg-muted/20">
                    <td className="py-2.5 pr-3 font-medium">{r.log_date}</td>
                    {MEASUREMENT_FIELDS.map((f) => (
                      <td key={f} className="py-2.5 pr-3 text-muted-foreground">
                        {r[f] ?? "—"}
                      </td>
                    ))}
                    <td className="py-2.5">
                      <button
                        onClick={() => del.mutate(r.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Nothing logged yet" />
        )}
      </Panel>

      <SuccessModal
        open={saved}
        title="Measurements saved"
        description={`Entry for ${date} recorded.`}
        onClose={() => setSaved(false)}
      />
    </div>
  );
}
