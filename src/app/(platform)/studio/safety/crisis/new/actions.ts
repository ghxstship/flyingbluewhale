"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { sendPushBulk } from "@/lib/push/send";
import { orgMemberUserIds } from "@/lib/db/managers";
import { log } from "@/lib/log";

const Schema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
  severity: z.enum(["info", "warn", "critical"]),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createCrisisAlertAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("crisis_alerts").insert({
    org_id: session.orgId,
    title: parsed.data.title,
    body: parsed.data.body,
    severity: parsed.data.severity,
    created_by: session.userId,
  });
  if (error) return actionFail(error.message, fd);

  // Tell the field. This used to insert the row and stop — the console
  // could declare a crisis and nobody was notified, so the workforce found
  // out by opening the app and happening to look. The field even shipped a
  // tone for `crisis`, which nothing had ever been able to produce.
  //
  // Fans out to every active member, not the manager band: an evacuation is
  // not an escalation. The `crisis` kind is in UNSILENCEABLE_KINDS, so a
  // worker who muted notifications months ago still gets this one — muting
  // "alerts" is not consent to miss an emergency.
  //
  // Best-effort by construction: the alert is already recorded, and a push
  // failure must not roll it back or block the declarer, who has somewhere
  // more important to be.
  try {
    const recipients = await orgMemberUserIds(session.orgId);
    if (recipients.length) {
      await sendPushBulk(recipients, {
        title: parsed.data.title,
        body: parsed.data.body.slice(0, 160),
        // Kit 29: /m/alerts is the crisis surface — the declaration, the
        // response actions, and the response-plan link, not the routine bell.
        url: "/m/alerts",
        kind: "crisis",
        scope: "all",
        orgId: session.orgId,
      });
    }
  } catch (err) {
    log.error("crisis.fanout_failed", { err: err instanceof Error ? err.message : String(err) });
  }

  revalidatePath("/studio/safety/crisis");
  redirect("/studio/safety/crisis");
}
