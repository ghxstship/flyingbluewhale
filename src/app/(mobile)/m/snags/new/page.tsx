import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SnagForm, type ProjectOpt } from "./SnagForm";

export const dynamic = "force-dynamic";

/** COMPVSS · Raise A Snag — server fetches the org's projects → client form. */
export default async function NewSnagPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  const projects = ((data ?? []) as Array<{ id: string; name: string | null }>).map(
    (p): ProjectOpt => ({ id: p.id, name: p.name ?? "Untitled Project" }),
  );
  return <SnagForm projects={projects} />;
}
