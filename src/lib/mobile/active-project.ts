import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * The COMPVSS field shell's context row (`MobileAppBar`) names the ORG and the
 * ACTIVE PROJECT with a live dot — the two facts a crew member needs to know
 * they're looking at the right world before reading anything else.
 *
 * Previously the `(mobile)` layout resolved the active project by pulling the
 * newest 50 projects + every referenced client + venue on EVERY nav (to also
 * populate the rarely-opened switcher sheet), then `.find(p => Live)`. That's
 * up to four table reads to answer "which one project is live right now".
 *
 * This is the dedicated read: the single most-recent ACTIVE project, one
 * indexed query. `project_state` is the LDP lifecycle column ("active" === the
 * kit's "Live" chip). Wrapped in React's `cache()` so it's resolved once per
 * request — the layout AND any sibling /m page that needs the live project
 * dedupe onto the same promise instead of re-querying.
 */
export type ActiveProject = { id: string; name: string; live: true };

export const getActiveProject = cache(async (orgId: string): Promise<ActiveProject | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", orgId)
    .eq("project_state", "active")
    .is("deleted_at", null)
    .order("start_date", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, name: data.name, live: true };
});
