import { SetupState } from "@/components/setup-state";
import { isSupabaseConfigured } from "@/lib/env";

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="shell auth-shell">
      {!isSupabaseConfigured() ? (
        <SetupState />
      ) : (
        <section className="panel">
          <p className="eyebrow">Private Access</p>
          <h1 className="page-title">Sign in with your private password.</h1>
          <p className="muted-copy">
            This app signs into the one account configured in the environment. You only need the password here.
          </p>
          {error ? (
            <div className="error-banner">
              {error === "credentials" ? "The password was incorrect." : error}
            </div>
          ) : null}
          <form action="/api/auth/sign-in" method="post" className="stack">
            <label>
              <span className="eyebrow">Password</span>
              <input type="password" name="password" className="field" required autoComplete="current-password" />
            </label>
            <button type="submit" className="primary-button">
              Sign in
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
