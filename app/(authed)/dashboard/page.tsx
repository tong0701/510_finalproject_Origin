import { DashboardManager } from "@/components/dashboard-manager";
import { ensureStarterDemoIfEmpty, syncStarterDemoMedia } from "@/lib/demo/seed-pack";
import { listPersons } from "@/lib/data/persons";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { persons, fetchError, missingTable } = await listPersons();

  if (!missingTable && !fetchError) {
    try {
      if (persons.length === 0) {
        await ensureStarterDemoIfEmpty(supabase, user.id);
        ({ persons, fetchError, missingTable } = await listPersons());
      } else {
        await syncStarterDemoMedia(supabase, user.id);
      }
    } catch {
      // Keep empty dashboard if seed fails (e.g. schema not applied).
    }
  }

  return (
    <div className="page-shell">
      {missingTable ? (
        <div className="mb-8 rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          Run <code className="rounded bg-white/60 px-1.5 py-0.5 font-mono text-xs">origins/supabase/schema.sql</code> in
          Supabase SQL editor.
        </div>
      ) : null}
      {fetchError ? (
        <div className="mb-8 rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
          Could not load people: {fetchError}
        </div>
      ) : null}

      <DashboardManager initialPeople={persons} userId={user.id} />
    </div>
  );
}
