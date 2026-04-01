import { NextResponse } from "next/server";
import { z } from "zod";

import { parseTemplateSource } from "@/lib/template-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const importSchema = z.object({
  source: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const body = importSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const parsed = parseTemplateSource(body.source);

    const { data, error } = await supabase
      .from("templates")
      .insert({
        user_id: user.id,
        name: parsed.normalized.name,
        schema_version: parsed.normalized.schemaVersion,
        source_json: parsed.parsedSource,
        normalized_payload: parsed.normalized,
        is_active: false
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      template: data
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Template import failed."
      },
      { status: 400 }
    );
  }
}
