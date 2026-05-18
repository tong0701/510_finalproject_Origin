import { AuthedNav } from "@/components/authed-nav";
import { ToastProvider } from "@/components/ui/toast";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) redirect("/login?error=config");

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const initials =
    user.email?.slice(0, 2).toUpperCase() ??
    user.user_metadata?.full_name?.slice(0, 2)?.toUpperCase() ??
    "?";

  return (
    <ToastProvider>
      <div className="flex min-h-full flex-1 flex-col bg-[var(--origins-paper)]">
        <AuthedNav email={user.email ?? null} initials={initials} />
        <main className="flex-1">{children}</main>
      </div>
    </ToastProvider>
  );
}
