"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Utensils, X } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { SuccessModal } from "@/components/success-modal";
import {
  useDeleteRow,
  useInsertRow,
  useNutritionLogs,
  useProfile,
  useUpdateRow,
} from "@/lib/data";
import {
  MEALS,
  MEAL_LABELS,
  addDays,
  formatDateLabel,
  todayStr,
} from "@/lib/iron";
import {
  axisTick,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "@/lib/chart-style";

const EMPTY = {
  meal: "breakfast",
  item: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  sugar: "",
};

export default function NutritionPage() {
  const { data: rows = [] } = useNutritionLogs();
  const { data: profile } = useProfile();
  const insert = useInsertRow("nutrition_logs");
  const updateRow = useUpdateRow("nutrition_logs");
  const del = useDeleteRow("nutrition_logs");
  const [date, setDate] = useState(todayStr());
  const [form, setForm] = useState({ ...EMPTY });
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY });

  const dayRows = rows.filter((r) => r.log_date === date);
  const totals = dayRows.reduce(
    (acc, r) => ({
      calories: acc.calories + Number(r.calories),
      protein: acc.protein + Number(r.protein),
      carbs: acc.carbs + Number(r.carbs),
      fat: acc.fat + Number(r.fat),
      fiber: acc.fiber + Number(r.fiber),
      sugar: acc.sugar + Number(r.sugar),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
  );

  const weekSeries = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => addDays(todayStr(), -13 + i));
    return days.map((d) => {
      const rs = rows.filter((r) => r.log_date === d);
      return {
        label: formatDateLabel(d),
        calories: rs.reduce((a, b) => a + Number(b.calories), 0),
        protein: rs.reduce((a, b) => a + Number(b.protein), 0),
      };
    });
  }, [rows]);

  const macroPie = [
    { name: "Protein", value: Math.round(totals.protein * 4), color: "var(--color-primary)" },
    { name: "Carbs", value: Math.round(totals.carbs * 4), color: "var(--color-accent)" },
    { name: "Fat", value: Math.round(totals.fat * 9), color: "var(--color-chart-4)" },
  ].filter((m) => m.value > 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.item) return;
    insert.mutate(
      {
        log_date: date,
        meal: form.meal,
        item: form.item,
        calories: Number(form.calories || 0),
        protein: Number(form.protein || 0),
        carbs: Number(form.carbs || 0),
        fat: Number(form.fat || 0),
        fiber: Number(form.fiber || 0),
        sugar: Number(form.sugar || 0),
      },
      {
        onSuccess: () => {
          toast.success("Meal logged");
          setSuccess(
            `${MEAL_LABELS[form.meal as keyof typeof MEAL_LABELS] ?? form.meal} · ${form.item}`,
          );
          setForm({ ...EMPTY, meal: form.meal });
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  function beginEdit(r: (typeof rows)[number]) {
    setEditingId(r.id);
    // The NutritionLog type uses `[key: string]: unknown` so we narrow the
    // values we actually read — the existing JSX in this file relies on the
    // same implicit-any handling for display, but `String()` won't accept
    // `unknown`, so we cast once here.
    const row = r as Record<string, unknown>;
    setEditForm({
      meal: String(row["meal"] ?? "breakfast"),
      item: String(row["item"] ?? ""),
      calories: String(row["calories"] ?? ""),
      protein: String(row["protein"] ?? ""),
      carbs: String(row["carbs"] ?? ""),
      fat: String(row["fat"] ?? ""),
      fiber: String(row["fiber"] ?? ""),
      sugar: String(row["sugar"] ?? ""),
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit() {
    if (!editingId) return;
    if (!editForm.item.trim()) {
      toast.error("Item name is required");
      return;
    }
    updateRow.mutate(
      {
        id: editingId,
        values: {
          meal: editForm.meal,
          item: editForm.item.trim(),
          calories: Number(editForm.calories || 0),
          protein: Number(editForm.protein || 0),
          carbs: Number(editForm.carbs || 0),
          fat: Number(editForm.fat || 0),
          fiber: Number(editForm.fiber || 0),
          sugar: Number(editForm.sugar || 0),
        },
      },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Entry updated");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nutrition"
        description="Fuel the transformation. Protein first."
        action={
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Calories" value={totals.calories} hint={`Goal ${profile?.calorie_goal ?? 0}`} />
        <StatCard
          label="Protein"
          value={totals.protein}
          suffix=" g"
          accent="success"
          hint={`Goal ${profile?.protein_goal ?? 0} g`}
        />
        <StatCard label="Carbs" value={totals.carbs} suffix=" g" accent="accent" />
        <StatCard
          label="Fat"
          value={totals.fat}
          suffix=" g"
          accent="warning"
          hint={`Fiber ${Math.round(totals.fiber)}g · Sugar ${Math.round(totals.sugar)}g`}
        />
      </div>

      <Panel title="Add entry">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted-foreground">Meal</span>
            <select
              value={form.meal}
              onChange={(e) => setForm({ ...form, meal: e.target.value })}
              className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
            >
              {MEALS.map((m) => (
                <option key={m} value={m}>
                  {MEAL_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="block lg:col-span-3">
            <span className="mb-1.5 block text-xs text-muted-foreground">Item</span>
            <input
              value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
              placeholder="Chicken, rice and broccoli"
              className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
            />
          </label>
          {(["calories", "protein", "carbs", "fat", "fiber", "sugar"] as const).map((k) => (
            <label key={k} className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground capitalize">{k}</span>
              <input
                type="number"
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
              />
            </label>
          ))}
          <div className="flex items-end lg:col-span-2">
            <button className="ember-bg inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              <Plus className="size-4" /> Add entry
            </button>
          </div>
        </form>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Calories & protein" description="Last 14 days" className="lg:col-span-2">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} minTickGap={16} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} width={42} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  cursor={{ fill: "var(--color-muted)", opacity: 0.2 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="calories" name="Calories" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="protein" name="Protein (g)" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Macro split" description="Calories by macro today">
          {macroPie.length ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroPie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {macroPie.map((m) => (
                      <Cell key={m.name} fill={m.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                    labelStyle={tooltipLabelStyle}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No macros yet" description="Add a meal to see the split." />
          )}
        </Panel>
      </div>

      <Panel title={`Entries for ${date}`}>
        {dayRows.length ? (
          <div className="space-y-2">
            {dayRows.map((r) =>
              editingId === r.id ? (
                <div
                  key={r.id}
                  className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block">
                      <span className="mb-1.5 block text-xs text-muted-foreground">Meal</span>
                      <select
                        value={editForm.meal}
                        onChange={(e) => setEditForm({ ...editForm, meal: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
                      >
                        {MEALS.map((m) => (
                          <option key={m} value={m}>
                            {MEAL_LABELS[m]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block lg:col-span-3">
                      <span className="mb-1.5 block text-xs text-muted-foreground">Item</span>
                      <input
                        value={editForm.item}
                        onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
                      />
                    </label>
                    {(["calories", "protein", "carbs", "fat", "fiber", "sugar"] as const).map((k) => (
                      <label key={k} className="block">
                        <span className="mb-1.5 block text-xs text-muted-foreground capitalize">{k}</span>
                        <input
                          type="number"
                          value={editForm[k]}
                          onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })}
                          className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <X className="size-3.5" /> Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={updateRow.isPending}
                      className="ember-bg inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{String(r.item ?? "")}</p>
                    <p className="text-xs text-muted-foreground">
                      {MEAL_LABELS[r.meal as keyof typeof MEAL_LABELS] ?? r.meal} · {Number(r.calories)} kcal · {Number(r.protein)}g protein · {Number(r.carbs)}g carbs · {Number(r.fat)}g fat
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => beginEdit(r)}
                      className="text-muted-foreground hover:text-primary"
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => del.mutate(r.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <EmptyState
            icon={<Utensils className="size-8" />}
            title="Nothing logged for this day"
            description="Add your first meal above."
          />
        )}
      </Panel>

      <SuccessModal
        open={success !== null}
        title="Meal logged"
        description={success ?? undefined}
        onClose={() => setSuccess(null)}
      />
    </div>
  );
}
