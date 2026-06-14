"use server";

import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { deleteViewConfig, saveViewConfig, setDefaultView } from "@/lib/db/view-configs";
import type { SaveViewSubmit } from "@/components/views/SaveViewDialog";

/**
 * Server actions for the Clients collection's saved-view layer (coverage
 * gap CV1). The SavedViewSelector / SaveViewDialog wired into the table
 * call these to persist named, role-scoped filter+sort+group views to the
 * `view_configs` table.
 *
 * RLS is the real authorization boundary — `view_configs` policies gate
 * private views to the caller and `org` / `public` writes to manager+
 * roles. These wrappers add a belt-and-suspenders app-side check before
 * publishing a shared view, and pin every write to the session org so a
 * stale id from another tenant can never be reached.
 *
 * `STABLE_TABLE_ID` MUST match the `tableId` the page passes to
 * `<DataTable>` so the loaded views and the persisted views line up.
 */
const STABLE_TABLE_ID = "console:clients";

export async function saveClientsView(input: SaveViewSubmit): Promise<void> {
  const session = await requireSession();
  if ((input.scope === "org" || input.scope === "public") && !isManagerPlus(session)) {
    throw new Error("Only manager+ can publish shared or public views");
  }
  await saveViewConfig({
    orgId: session.orgId,
    tableId: STABLE_TABLE_ID,
    type: input.type,
    scope: input.scope,
    name: input.name,
    description: input.description,
    config: input.config,
    upsertById: input.upsertById,
  });
  revalidatePath("/console/clients");
}

export async function deleteClientsView(id: string): Promise<void> {
  const session = await requireSession();
  await deleteViewConfig({ id, orgId: session.orgId });
  revalidatePath("/console/clients");
}

export async function setDefaultClientsView(id: string): Promise<void> {
  const session = await requireSession();
  await setDefaultView({ id, orgId: session.orgId });
  revalidatePath("/console/clients");
}
