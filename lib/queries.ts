import type { SupabaseClient, User } from "@supabase/supabase-js";

import { emptyDayPayload, normalizeDayPayload } from "@/lib/day-payload";
import { getDayStrength, getModuleCompletion } from "@/lib/derived-status";
import type { DayPayload, DayRecord, TemplateRow, WorkoutTemplate } from "@/lib/types";

type AppSupabaseClient = SupabaseClient;

function toDayRecord(row: Record<string, unknown>): DayRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    local_date: String(row.local_date),
    timezone: String(row.timezone),
    payload: normalizeDayPayload(row.payload),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

function toTemplateRow(row: Record<string, unknown>): TemplateRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    schema_version: Number(row.schema_version),
    source_json: row.source_json,
    normalized_payload: row.normalized_payload as WorkoutTemplate,
    is_active: Boolean(row.is_active),
    archived_at: row.archived_at ? String(row.archived_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

export async function getDayByDate(
  supabase: AppSupabaseClient,
  user: User,
  localDate: string
): Promise<DayRecord | null> {
  const { data, error } = await supabase
    .from("days")
    .select("*")
    .eq("user_id", user.id)
    .eq("local_date", localDate)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toDayRecord(data) : null;
}

export async function getMonthDays(
  supabase: AppSupabaseClient,
  user: User,
  startDate: string,
  endDate: string
): Promise<DayRecord[]> {
  const { data, error } = await supabase
    .from("days")
    .select("*")
    .eq("user_id", user.id)
    .gte("local_date", startDate)
    .lte("local_date", endDate)
    .order("local_date", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => toDayRecord(row));
}

export async function listTemplates(supabase: AppSupabaseClient, user: User): Promise<TemplateRow[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => toTemplateRow(row));
}

export async function getActiveTemplate(
  supabase: AppSupabaseClient,
  user: User
): Promise<TemplateRow | null> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toTemplateRow(data) : null;
}

export function getTodayPageState(day: DayRecord | null, activeTemplate: TemplateRow | null) {
  const payload = day?.payload ?? emptyDayPayload();
  const gymSnapshot = payload.gym.snapshot ?? activeTemplate?.normalized_payload ?? null;
  const mergedPayload: DayPayload = {
    ...payload,
    gym: {
      ...payload.gym,
      templateId: payload.gym.templateId ?? activeTemplate?.id ?? null,
      templateName: payload.gym.templateName ?? activeTemplate?.name ?? null,
      snapshot: gymSnapshot
    }
  };

  return {
    payload: mergedPayload,
    completion: getModuleCompletion(mergedPayload),
    strength: getDayStrength(mergedPayload)
  };
}

export function getCalendarState(days: DayRecord[]) {
  return days.map((day) => ({
    ...day,
    completion: getModuleCompletion(day.payload),
    strength: getDayStrength(day.payload)
  }));
}
