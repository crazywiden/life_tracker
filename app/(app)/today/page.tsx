import { cookies } from "next/headers";

import { TodayShell } from "@/components/today-shell";
import { SetupState } from "@/components/setup-state";
import { requireAppUser } from "@/lib/auth";
import { getClockContext } from "@/lib/clock";
import { isSupabaseConfigured } from "@/lib/env";
import { getActiveTemplate, getDayByDate, getTodayPageState } from "@/lib/queries";

export default async function TodayPage() {
  if (!isSupabaseConfigured()) {
    return <SetupState />;
  }

  const context = await requireAppUser();
  if (!context.supabase || !context.user) {
    return <SetupState />;
  }

  const clock = getClockContext(await cookies());
  const [day, activeTemplate] = await Promise.all([
    getDayByDate(context.supabase, context.user, clock.localDate),
    getActiveTemplate(context.supabase, context.user)
  ]);
  const state = getTodayPageState(day, activeTemplate);

  return <TodayShell initialPayload={state.payload} localDate={clock.localDate} timezone={clock.timezone} />;
}
