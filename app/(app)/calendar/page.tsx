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

type HabitKind = "gym" | "reading" | "diary";

const HABITS: Array<{ kind: HabitKind; label: string }> = [
  { kind: "gym", label: "Gym" },
  { kind: "reading", label: "Reading" },
  { kind: "diary", label: "Diary" }
];

function HabitIcon({ kind }: { kind: HabitKind }) {
  if (kind === "gym") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="habit-icon">
        <path
          d="M3 9h2v6H3zm3-2h2v10H6zm3 4h6v2H9zm7-4h2v10h-2zm3 2h2v6h-2z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (kind === "reading") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="habit-icon">
        <path d="M4 5.5C4 4.67 4.67 4 5.5 4H11v15H6a2 2 0 0 0-2 2zm16 0V21a2 2 0 0 0-2-2h-5V4h5.5c.83 0 1.5.67 1.5 1.5z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="habit-icon">
      <path d="M4 17.5V20h2.5L17.81 8.69l-2.5-2.5zm15.71-9.29a1 1 0 0 0 0-1.42l-2.5-2.5a1 1 0 0 0-1.42 0l-1.46 1.46 3.92 3.92z" fill="currentColor" />
    </svg>
  );
}

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
      <div className="calendar-legend" aria-label="Habit legend">
        {HABITS.map((habit) => (
          <div key={habit.kind} className="legend-item">
            <span className="habit-marker" data-kind={habit.kind} data-active="true" aria-hidden="true">
              <HabitIcon kind={habit.kind} />
            </span>
            <span>{habit.label}</span>
          </div>
        ))}
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
                  {HABITS.map((habit) => (
                    <span
                      key={habit.kind}
                      className="habit-marker"
                      data-kind={habit.kind}
                      data-active={day?.completion[habit.kind] ?? false}
                      title={habit.label}
                      aria-label={`${habit.label}: ${(day?.completion[habit.kind] ?? false) ? "done" : "not done"}`}
                    >
                      <HabitIcon kind={habit.kind} />
                    </span>
                  ))}
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
