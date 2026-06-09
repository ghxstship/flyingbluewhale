"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { notifyOrgAdmins } from "@/lib/notify";
import { log } from "@/lib/log";

const Schema = z.object({
  summary: z.string().min(5).max(500),
});

export async function quickFileIncident(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) redirect("/m/incident/new?error=invalid");

  const supabase = await createClient();
  // Defaults: severity=minor, status=open — supervisor fills the rest
  // from /console/safety/incidents. Reporter_id is the caller, gating
  // visibility on /m/incident to "mine only".
  const { data, error } = await supabase
    .from("incidents")
    .insert({
      org_id: session.orgId,
      reporter_id: session.userId,
      summary: parsed.data!.summary,
      severity: "minor",
      status: "open",
    })
    .select("id")
    .single();
  if (error) throw new Error(`Could not file incident: ${error.message}`);

  // Fan out to org admins — mirrors the full-form path at
  // /api/v1/incidents. Best-effort: without the service-role key
  // (dev / preview) the incident still persists, only the ping is
  // skipped.
  if (isServiceClientAvailable()) {
    try {
      await notifyOrgAdmins({
        orgId: session.orgId,
        eventType: "incident.filed",
        title: `Incident: ${parsed.data!.summary}`,
        body: "Severity: minor",
        href: `/console/operations/incidents/${(data as { id: string }).id}`,
        data: { incidentId: (data as { id: string }).id, severity: "minor" },
      });
    } catch (e) {
      log.warn("incident.quick_file_notify_failed", { err: e instanceof Error ? e.message : String(e) });
    }
  }

  revalidatePath("/m/incident");
  revalidatePath("/m/incidents");
  redirect("/m/incident?filed=1");
}
