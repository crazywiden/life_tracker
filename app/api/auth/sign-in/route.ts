import { NextResponse } from "next/server";

import { getAllowlistedEmail, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function redirectToSignIn(request: Request, params: Record<string, string>) {
  const url = new URL("/sign-in", request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return redirectToSignIn(request, { error: "config" });
  }

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");

  if (!password) {
    return redirectToSignIn(request, { error: "credentials" });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: getAllowlistedEmail(),
    password
  });

  if (error) {
    return redirectToSignIn(request, { error: "credentials" });
  }

  return NextResponse.redirect(new URL("/today", request.url), { status: 303 });
}
