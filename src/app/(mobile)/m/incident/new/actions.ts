"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
  const { error } = await supabase.from("incidents").insert({
    org_id: session.orgId,
    reporter_id: session.userId,
    summary: parsed.data!.summary,
    severity: "minor",
    status: "open",
  });
  if (error) throw new Error(`Could not file incident: ${error.message}`);

  revalidatePath("/m/incident");
  revalidatePath("/m/incidents");
  redirect("/m/incident?filed=1");
}
