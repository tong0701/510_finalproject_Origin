import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=config");
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
