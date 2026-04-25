"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function installConnector(formData: FormData) {
  const session = await requireSession();
  const connector = String(formData.get("connector") ?? "");
  if (!connector) return;
  const supabase = await createClient();
  await supabase
    .from("org_integrations")
    .upsert(
      {
        org_id: session.orgId,
        connector,
        status: "installed",
        installed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id,connector" },
    );
  revalidatePath("/console/settings/integrations");
}

export async function uninstallConnector(formData: FormData) {
  const session = await requireSession();
  const connector = String(formData.get("connector") ?? "");
  if (!connector) return;
  const supabase = await createClient();
  await supabase
    .from("org_integrations")
    .update({ status: "disabled", installed_at: null, updated_at: new Date().toISOString() })
    .eq("org_id", session.orgId)
    .eq("connector", connector);
  revalidatePath("/console/settings/integrations");
}
