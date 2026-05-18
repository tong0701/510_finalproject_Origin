"use client";

import { createBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return (
    <button type="button" onClick={signOut} className="btn-ghost text-sm">
      Log out
    </button>
  );
}
