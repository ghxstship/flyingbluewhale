"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { createDashboard } from "@/lib/db/dashboards";

/**
 * Create a fresh empty dashboard and redirect to its editor. Used by the
 * "New Dashboard" button on /console/dashboards.
 */
export async function createDashboardAction(): Promise<void> {
  const session = await requireSession();
  const row = await createDashboard({
    orgId: session.orgId,
    name: "Untitled Dashboard",
    scope: "private",
  });
  revalidatePath("/console/dashboards");
  redirect(`/console/dashboards/${row.id}/edit`);
}
