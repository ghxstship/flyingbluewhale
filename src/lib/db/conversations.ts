import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ConversationRecordType =
  | "project"
  | "purchase_order"
  | "requisition"
  | "rfq"
  | "rfi"
  | "submittal"
  | "punch_item"
  | "inspection"
  | "daily_log"
  | "site_plan"
  | "vendor"
  | "client"
  | "proposal"
  | "deliverable"
  | "incident"
  | "task"
  | "event"
  | "ticket"
  | "invoice"
  | "payment_application"
  | "po_change_order"
  | "work_order_broadcast"
  | "safety_briefing"
  | "prequalification";

export type ConversationMessageView = {
  id: string;
  body: string;
  author_email: string | null;
  author_name: string | null;
  created_at: string;
};

/**
 * Get-or-create the conversation row for a record, then return its messages.
 * One thread per (org, record_type, record_id) — enforced by unique index.
 */
export async function listMessagesFor(
  orgId: string,
  recordType: ConversationRecordType,
  recordId: string,
): Promise<ConversationMessageView[]> {
  const supabase = await createClient();
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("org_id", orgId)
    .eq("record_type", recordType)
    .eq("record_id", recordId)
    .maybeSingle();
  if (!conv) return [];

  const { data } = await supabase
    .from("conversation_messages")
    .select("id, body, created_at, author:author_id (email, name)")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    (data ?? []) as unknown as Array<{
      id: string;
      body: string;
      created_at: string;
      author: { email: string | null; name: string | null } | null;
    }>
  ).map((m) => ({
    id: m.id,
    body: m.body,
    created_at: m.created_at,
    author_email: m.author?.email ?? null,
    author_name: m.author?.name ?? null,
  }));
}

/**
 * Append a message to a record's thread, creating the conversation row if
 * needed. Returns the message id.
 */
export async function appendMessage(opts: {
  orgId: string;
  authorId: string;
  recordType: ConversationRecordType;
  recordId: string;
  body: string;
}): Promise<string | { error: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("org_id", opts.orgId)
    .eq("record_type", opts.recordType)
    .eq("record_id", opts.recordId)
    .maybeSingle();

  let conversationId = existing?.id;
  if (!conversationId) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({
        org_id: opts.orgId,
        record_type: opts.recordType,
        record_id: opts.recordId,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    conversationId = created.id;
  }

  const { data: msg, error: msgErr } = await supabase
    .from("conversation_messages")
    .insert({
      org_id: opts.orgId,
      conversation_id: conversationId,
      author_id: opts.authorId,
      body: opts.body,
    })
    .select("id")
    .single();
  if (msgErr) return { error: msgErr.message };
  return msg.id;
}
