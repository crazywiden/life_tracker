import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeDayPayload } from "@/lib/day-payload";
import { getDayStrength, getModuleCompletion } from "@/lib/derived-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TEMPLATE_FIELD_KEYS } from "@/lib/types";

const diarySchema = z.object({
  completed: z.boolean(),
  updatedAt: z.string().nullable()
});

const readingSchema = z.object({
  bookTitle: z.string(),
  notes: z.string(),
  updatedAt: z.string().nullable()
});

const templateFieldEnum = z.enum(TEMPLATE_FIELD_KEYS);
const gymEntrySchema = z.object({
  sets: z.number().nullable().optional(),
  reps: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  duration: z.number().nullable().optional(),
  distance: z.number().nullable().optional()
});

const gymSchema = z.object({
  templateId: z.string().nullable(),
  templateName: z.string().nullable(),
  snapshot: z
    .object({
      schemaVersion: z.literal(1),
      name: z.string(),
      exercises: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          fields: z.array(templateFieldEnum)
        })
      )
    })
    .nullable(),
  entries: z.record(z.string(), gymEntrySchema),
  updatedAt: z.string().nullable()
});

const patchSchema = z.object({
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1),
  module: z.enum(["diary", "reading", "gym"]),
  value: z.union([diarySchema, readingSchema, gymSchema])
});

export async function PATCH(request: Request) {
  try {
    const body = patchSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("patch_day_module", {
      p_local_date: body.localDate,
      p_timezone: body.timezone,
      p_module: body.module,
      p_value: body.value
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const row = Array.isArray(data) ? data[0] : data;
    const payload = normalizeDayPayload(row?.payload);

    return NextResponse.json({
      payload,
      completion: getModuleCompletion(payload),
      strength: getDayStrength(payload)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected save error."
      },
      { status: 400 }
    );
  }
}
