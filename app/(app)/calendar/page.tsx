import Link from "next/link";
import { cookies } from "next/headers";

import { SetupState } from "@/components/setup-state";
import { requireAppUser } from "@/lib/auth";
import { getClockContext, getMonthWindow } from "@/lib/clock";
import { isSupabaseConfigured } from "@/lib/env";
import { getCalendarState, getMonthDays } from "@/lib/queries";

type CalendarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildCalendarCells(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1, 12));
  const daysInMonth = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
  const startOffset = (first.getUTCDay() + 6) % 7;
  const cells: Array<{ localDate: string; dayNumber: number; outside: boolean }> = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push({
      localDate: `pad-${index}`,
      dayNumber: 0,
      outside: true
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      localDate: `${monthKey}-${String(day).padStart(2, "0")}`,
      dayNumber: day,
      outside: false
    });
  }

  return cells;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  if (!isSupabaseConfigured()) {
    return <SetupState />;
  }

  const params = await searchParams;
  const month = Array.isArray(params.month) ? params.month[0] : params.month;
  const context = await requireAppUser();
  if (!context.supabase || !context.user) {
    return <SetupState />;
  }

  const clock = getClockContext(await cookies());
  const window = getMonthWindow(month, clock);
  const days = await getMonthDays(context.supabase, context.user, window.startDate, window.endDate);
  const state = getCalendarState(days);
  const byDate = new Map(state.map((day) => [day.local_date, day]));
  const cells = buildCalendarCells(window.monthKey);

  return (
    <section className="panel">
      <div className="calendar-header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h1 className="page-title">{window.label}</h1>
        </div>
        <div className="nav-links">
          <Link href={`/calendar?month=${window.prevMonthKey}`}>Prev</Link>
          <Link href={`/calendar?month=${window.nextMonthKey}`}>Next</Link>
        </div>
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => {
          if (cell.outside) {
            return <div key={cell.localDate} className="calendar-cell" aria-hidden="true" />;
          }

          const day = byDate.get(cell.localDate);
          return (
            <Link key={cell.localDate} href={`/calendar/${cell.localDate}`}>
              <article className="calendar-cell" data-strength={day?.strength ?? "empty"}>
                <span className="calendar-day">{cell.dayNumber}</span>
                <div className="marker-row">
                  <span className="marker" data-active={day?.completion.gym ?? false} aria-label="Gym marker" />
                  <span className="marker" data-active={day?.completion.reading ?? false} aria-label="Reading marker" />
                  <span className="marker" data-active={day?.completion.diary ?? false} aria-label="Diary marker" />
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
