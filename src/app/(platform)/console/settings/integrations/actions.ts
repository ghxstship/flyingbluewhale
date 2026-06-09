"use server";

import { revalidatePath } from "next/cache";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Bound the connector value so a crafted POST can't smuggle a slug into
// the org_integrations table (used by the integrations page list and
// the install gate). Same shape as the connector enum the UI renders.
const CONNECTOR_RE = /^[a-z0-9-]{1,64}$/;

export async function installConnector(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session)) return;
  const connector = String(formData.get("connector") ?? "");
  if (!CONNECTOR_RE.test(connector)) return;
  const supabase = await createClient();
  const { error } = await supabase.from("org_integrations").upsert(
    {
      org_id: session.orgId,
      connector,
      status: "installed",
      installed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,connector" },
  );
  if (error) throw new Error(`Could not save org integration: ${error.message}`);
  revalidatePath("/console/settings/integrations");
}

export async function uninstallConnector(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session)) return;
  const connector = String(formData.get("connector") ?? "");
  if (!CONNECTOR_RE.test(connector)) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("org_integrations")
    .update({ status: "disabled", installed_at: null, updated_at: new Date().toISOString() })
    .eq("org_id", session.orgId)
    .eq("connector", connector);
  if (error) throw new Error(`Could not update org integration: ${error.message}`);
  revalidatePath("/console/settings/integrations");
}
