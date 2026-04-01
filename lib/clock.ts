import { getDefaultTimezone, isTestClockEnabled } from "@/lib/env";

export const TIMEZONE_COOKIE = "lt_timezone";
const TEST_NOW_COOKIE = "lt_test_now";
const TEST_TIMEZONE_COOKIE = "lt_test_timezone";

export type ClockContext = {
  now: Date;
  timezone: string;
  localDate: string;
};

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

function getDatePart(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

export function sanitizeTimezone(input: string | undefined | null): string {
  const fallback = getDefaultTimezone();
  const candidate = input?.trim() || fallback;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate });
    return candidate;
  } catch {
    return fallback;
  }
}

export function getClockContext(cookieStore: CookieReader): ClockContext {
  const timezoneCookie = cookieStore.get(TIMEZONE_COOKIE)?.value;
  const testTimezoneCookie = isTestClockEnabled() ? cookieStore.get(TEST_TIMEZONE_COOKIE)?.value : null;
  const timezone = sanitizeTimezone(testTimezoneCookie ?? timezoneCookie);

  const testNow = isTestClockEnabled() ? cookieStore.get(TEST_NOW_COOKIE)?.value : null;
  const now = testNow ? new Date(testNow) : new Date();
  const safeNow = Number.isNaN(now.getTime()) ? new Date() : now;

  return {
    now: safeNow,
    timezone,
    localDate: getDatePart(safeNow, timezone)
  };
}

export function getMonthWindow(monthKey: string | undefined, clock: ClockContext): {
  monthKey: string;
  startDate: string;
  endDate: string;
  prevMonthKey: string;
  nextMonthKey: string;
  label: string;
} {
  const basis = monthKey ? `${monthKey}-01T12:00:00.000Z` : `${clock.localDate.slice(0, 7)}-01T12:00:00.000Z`;
  const date = new Date(basis);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1, 12));
  const end = new Date(Date.UTC(year, month + 1, 0, 12));
  const prev = new Date(Date.UTC(year, month - 1, 1, 12));
  const next = new Date(Date.UTC(year, month + 1, 1, 12));

  return {
    monthKey: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
    startDate: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-01`,
    endDate: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`,
    prevMonthKey: `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`,
    nextMonthKey: `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`,
    label: start.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: clock.timezone
    })
  };
}
