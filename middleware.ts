import type { NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

export function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return;
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
