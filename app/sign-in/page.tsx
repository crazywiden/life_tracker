import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SetupState } from "@/components/setup-state";
import { getAllowlistedEmail, getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function requestMagicLink(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email !== getAllowlistedEmail()) {
    redirect("/sign-in?error=allowlist");
  }

  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const origin = forwardedHost ? `${forwardedProto ?? "https"}://${forwardedHost}` : getAppUrl();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/confirm?next=/today`
    }
  });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/sign-in?status=sent");
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;

  return (
    <main className="shell auth-shell">
      {!isSupabaseConfigured() ? (
        <SetupState />
      ) : (
        <section className="panel">
          <p className="eyebrow">Private Access</p>
          <h1 className="page-title">Sign in with your allowlisted email.</h1>
          <p className="muted-copy">
            This app uses magic-link sign-in and only accepts the email configured in the environment.
          </p>
          {error ? (
            <div className="error-banner">
              {error === "allowlist" ? "That email is not allowed to access this app." : error}
            </div>
          ) : null}
          {status === "sent" ? (
            <div className="success-banner">Check your email for the magic link.</div>
          ) : null}
          <form action={requestMagicLink} className="stack">
            <label>
              <span className="eyebrow">Email</span>
              <input type="email" name="email" className="field" required placeholder={getAllowlistedEmail()} />
            </label>
            <button type="submit" className="primary-button">
              Send magic link
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
