import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { QuickFileForm } from "./QuickFileForm";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Express incident quick-file. Server guard → client one-field
 * form. Kit 32 A2: `?followUpOf=<incidentId>` files this report as a
 * follow-up to an existing incident — the parent is resolved org-scoped
 * here so the form can show what it's chained to, and the action stamps
 * the parent's status chain.
 */
export default async function NewQuickIncidentPage({
  searchParams,
}: {
  searchParams: Promise<{ followUpOf?: string | string[] }>;
}) {
  const session = await requireSession();
  const { followUpOf } = await searchParams;
  const parentId = Array.isArray(followUpOf) ? followUpOf[0] : followUpOf;

  let parent: { id: string; summary: string } | null = null;
  if (hasSupabase && parentId && /^[0-9a-f-]{36}$/i.test(parentId)) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("incidents")
      .select("id, summary")
      .eq("id", parentId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (data) parent = { id: data.id as string, summary: data.summary as string };
  }

  return <QuickFileForm followUpOf={parent} />;
}
