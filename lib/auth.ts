import { redirect } from "next/navigation";

import { getAllowlistedEmail, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAppUser() {
  if (!isSupabaseConfigured()) {
    return {
      supabase: null,
      user: null
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.email?.toLowerCase() !== getAllowlistedEmail()) {
    await supabase.auth.signOut();
    redirect("/sign-in?error=allowlist");
  }

  return {
    supabase,
    user
  };
}

export async function getOptionalUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}
