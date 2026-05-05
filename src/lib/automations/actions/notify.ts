import { z } from "zod";
import { registerAction } from "../registry";
import { notify } from "@/lib/notify";

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
