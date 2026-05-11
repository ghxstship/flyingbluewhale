import { z } from "zod";
import { registerAction } from "../registry";
import { notify } from "@/lib/notify";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

const Schema = z.object({
  /** Optional target user. If omitted, the notification is broadcast (webhook only). */
  userId: z.string().uuid().optional(),
  /** Canonical event-type registered in `src/lib/notify.ts#NotifyEvent`. */
  eventType: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  href: z.string().max(500).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

registerAction({
  type: "notify",
  schema: Schema,
  label: "Send Notification",
  description: "Sends an in-app notification to a user (and fans out to webhook subscribers).",
  async run(input, ctx) {
    // Cross-tenant guard: an automation author must not be able to fan
    // notifications into another org by passing a foreign userId. Verify
    // the target user is an active member of ctx.orgId before notify().
    // If the service client isn't configured we skip the check (notify
    // has its own fallbacks) — this is a defense-in-depth gate.
    if (input.userId && isServiceClientAvailable()) {
      const svc = createServiceClient() as unknown as import("@/lib/supabase/loose").LooseSupabase;
      const lookup = (await svc
        .from("memberships")
        .select("user_id")
        .eq("user_id", input.userId)
        .eq("org_id", ctx.orgId)
        .is("deleted_at", null)
        .maybeSingle()) as { data: { user_id: string } | null };
      if (!lookup.data) {
        throw new Error(`notify: userId ${input.userId} is not a member of this organization`);
      }
    }
    const id = await notify({
      orgId: ctx.orgId,
      userId: input.userId ?? null,
      // The notify() signature requires NotifyEvent — but the registry is open
      // by design (automations should be able to emit custom events). Cast at
      // the boundary; downstream the column is just `text`.
      eventType: input.eventType as never,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      data: input.data ?? {},
    });
    return { output: { sent: true, notificationId: id } };
  },
});

export {};
