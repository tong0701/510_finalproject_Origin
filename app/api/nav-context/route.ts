import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pathname = url.searchParams.get("pathname") || "";
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ label: "" }, { status: 200 });

  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "dashboard") return NextResponse.json({ label: "Dashboard" });

  if (parts[0] === "interview" && parts[1]) {
    const { data } = await supabase.from("persons").select("name").eq("id", parts[1]).maybeSingle();
    return NextResponse.json({ label: data?.name ? `${data.name} · Interview` : "Interview" });
  }
  if (parts[0] === "timeline" && parts[1]) {
    const { data } = await supabase.from("persons").select("name").eq("id", parts[1]).maybeSingle();
    return NextResponse.json({ label: data?.name ? `${data.name} · Timeline` : "Timeline" });
  }
  if (parts[0] === "story" && parts[1]) {
    const { data: story } = await supabase
      .from("stories")
      .select("person_id")
      .eq("id", parts[1])
      .maybeSingle();
    if (story?.person_id) {
      const { data: person } = await supabase
        .from("persons")
        .select("name")
        .eq("id", story.person_id)
        .maybeSingle();
      return NextResponse.json({ label: person?.name ? `${person.name} · Story` : "Story" });
    }
    return NextResponse.json({ label: "Story" });
  }
  return NextResponse.json({ label: "" });
}
