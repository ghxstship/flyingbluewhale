import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DailyLogForm, type ProjectOpt } from "./DailyLogForm";

export const dynamic = "force-dynamic";

/** COMPVSS · New Daily Log — server fetches the org's projects → client form. */
export default async function NewDailyLogPage() {
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
  return <DailyLogForm projects={projects} />;
}
