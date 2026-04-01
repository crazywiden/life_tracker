function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getAllowlistedEmail(): string {
  return required("ALLOWLIST_EMAIL").trim().toLowerCase();
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getDefaultTimezone(): string {
  return process.env.DEFAULT_TIMEZONE ?? "UTC";
}

export function isTestClockEnabled(): boolean {
  return process.env.LIFE_TRACKER_ENABLE_TEST_CLOCK === "1";
}
