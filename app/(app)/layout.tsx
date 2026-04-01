import { AppNav } from "@/components/app-nav";
import { SetupState } from "@/components/setup-state";
import { requireAppUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

import { signOutAction } from "./actions";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="shell">
        <SetupState />
      </main>
    );
  }

  await requireAppUser();

  return (
    <main className="shell">
      <AppNav signOutAction={signOutAction} />
      {children}
    </main>
  );
}
