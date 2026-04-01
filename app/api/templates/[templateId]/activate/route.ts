import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{
    templateId: string;
  }>;
};

export async function POST(_: Request, { params }: RouteProps) {
  const { templateId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("activate_template", {
    p_template_id: templateId
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    template: Array.isArray(data) ? data[0] : data
  });
}
