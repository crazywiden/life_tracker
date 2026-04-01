import Link from "next/link";

type AppNavProps = {
  signOutAction: () => Promise<void>;
};

export function AppNav({ signOutAction }: AppNavProps) {
  return (
    <nav className="app-nav">
      <div className="brand-block">
        <Link href="/today" className="brand-link">
          Life Tracker
        </Link>
        <p className="brand-copy">Train. Read. Keep the day moving.</p>
      </div>
      <div className="nav-links">
        <Link href="/today">Today</Link>
        <Link href="/calendar">Calendar</Link>
        <Link href="/templates">Templates</Link>
        <form action={signOutAction}>
          <button type="submit" className="ghost-button">
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
