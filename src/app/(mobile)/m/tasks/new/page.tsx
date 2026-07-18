import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { TaskForm } from "./TaskForm";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · New Task.
 *
 * The field could complete tasks but never create one, so anything a crew
 * member spotted on site had to survive until someone reached a desk. The
 * kit `task` form spec existed the whole time and was mounted nowhere.
 *
 * Kit 31 (live-test resolution #14): construction-grade — the server half
 * reads the org's real cost codes (`cost_centers`) and companies/subs
 * (`vendors`) so the selects offer live records, never seed strings.
 */
export default async function NewTaskPage() {
  let costCodeOptions: string[] = [];
  let companyOptions: string[] = [];

  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();
    const [{ data: codes }, { data: vendors }] = await Promise.all([
      supabase
        .from("cost_centers")
        .select("code, name")
        .eq("org_id", session.orgId)
        .eq("active", true)
        .order("code", { ascending: true })
        .limit(100),
      supabase
        .from("vendors")
        .select("name")
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .order("name", { ascending: true })
        .limit(200),
    ]);
    costCodeOptions = ((codes ?? []) as { code: string; name: string }[]).map(
      (c) => `${c.code} · ${c.name}`,
    );
    companyOptions = ((vendors ?? []) as { name: string }[]).map((v) => v.name).filter(Boolean);
  }

  return <TaskForm costCodeOptions={costCodeOptions} companyOptions={companyOptions} />;
}
