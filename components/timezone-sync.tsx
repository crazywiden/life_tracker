"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { TIMEZONE_COOKIE } from "@/lib/clock";

function getCookieValue(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const current = getCookieValue(TIMEZONE_COOKIE);

    if (timezone && current !== timezone) {
      document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(timezone)}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    }
  }, [router]);

  return null;
}
