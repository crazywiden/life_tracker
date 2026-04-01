import { redirect } from "next/navigation";

import { getOptionalUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    redirect("/sign-in");
  }

  const user = await getOptionalUser();
  redirect(user ? "/today" : "/sign-in");
}
