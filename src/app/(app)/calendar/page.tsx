"use client";

import { PageHeader, Panel } from "@/components/panel";
import { MonthCalendar } from "@/components/month-calendar";
import { useHabitLogs } from "@/lib/data";
import { useIron } from "@/lib/use-iron";

export default function CalendarPage() {
  const iron = useIron();
  const { data: habitLogs } = useHabitLogs();

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-6">
      <PageHeader
        title="Calendar"
        description="Tap any day to see what was logged. Past is data, future is plan."
      />
      <Panel
        title="Your 180 days"
        description="Each day is colored by completion score. Click for the full breakdown."
        className="flex min-h-0 flex-1 flex-col"
      >
        <MonthCalendar
          stats={iron.stats}
          habitLogs={habitLogs ?? []}
        />
      </Panel>
    </div>
  );
}
