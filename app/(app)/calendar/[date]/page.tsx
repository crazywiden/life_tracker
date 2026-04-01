import { cookies } from "next/headers";

import { TodayShell } from "@/components/today-shell";
import { SetupState } from "@/components/setup-state";
import { requireAppUser } from "@/lib/auth";
import { getClockContext } from "@/lib/clock";
import { isSupabaseConfigured } from "@/lib/env";
import { getActiveTemplate, getDayByDate, getTodayPageState } from "@/lib/queries";

type DayDetailPageProps = {
  params: Promise<{
    date: string;
  }>;
};

export default async function DayDetailPage({ params }: DayDetailPageProps) {
  if (!isSupabaseConfigured()) {
    return <SetupState />;
  }

  const { date } = await params;
  const context = await requireAppUser();
  if (!context.supabase || !context.user) {
    return <SetupState />;
  }

  const clock = getClockContext(await cookies());
  const [day, activeTemplate] = await Promise.all([
    getDayByDate(context.supabase, context.user, date),
    getActiveTemplate(context.supabase, context.user)
  ]);
  const state = getTodayPageState(day, activeTemplate);
  const helperText = day ? `Editing ${date} in ${day.timezone}` : "Backfill this date from the calendar.";

  return (
    <TodayShell
      initialPayload={state.payload}
      localDate={date}
      timezone={day?.timezone ?? clock.timezone}
      eyebrow="Backfill"
      helperText={helperText}
    />
  );
}
