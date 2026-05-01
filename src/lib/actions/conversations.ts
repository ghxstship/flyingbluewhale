"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { appendMessage, type ConversationRecordType } from "@/lib/db/conversations";

const Schema = z.object({
  record_type: z.string().min(1),
  record_id: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

const VALID_TYPES: ConversationRecordType[] = [
  "project",
  "purchase_order",
  "requisition",
  "rfq",
  "rfi",
  "submittal",
  "punch_item",
  "inspection",
  "daily_log",
  "site_plan",
  "vendor",
  "client",
  "proposal",
  "deliverable",
  "incident",
  "task",
  "event",
  "ticket",
  "invoice",
  "payment_application",
  "po_change_order",
  "work_order_broadcast",
  "safety_briefing",
  "prequalification",
];

export async function postConversationMessage(
  _: { error?: string } | null,
  fd: FormData,
): Promise<{ error?: string } | null> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (!VALID_TYPES.includes(parsed.data.record_type as ConversationRecordType)) {
    return { error: "Unknown record type" };
  }

  const result = await appendMessage({
    orgId: session.orgId,
    authorId: session.userId,
    recordType: parsed.data.record_type as ConversationRecordType,
    recordId: parsed.data.record_id,
    body: parsed.data.body,
  });
  if (typeof result === "object" && "error" in result) return result;

  // Revalidate any path under platform / portal that might be showing this thread.
  revalidatePath("/console", "layout");
  revalidatePath("/p", "layout");
  return null;
}
