export function SetupState() {
  return (
    <section className="panel setup-panel">
      <p className="eyebrow">Setup Required</p>
      <h1>Life Tracker needs Supabase credentials before it can run.</h1>
      <p>
        Copy <code>.env.example</code> to <code>.env.local</code>, fill in your Supabase URL, anon key, and
        allowlisted email, then apply the SQL migration in <code>supabase/migrations</code>.
      </p>
      <p>
        The implementation is in place. What is missing now is environment wiring, not app structure.
      </p>
      <p>
        Plan reference: <code>docs/codex/personal-growth-habit-tracker.md</code>
      </p>
    </section>
  );
}
