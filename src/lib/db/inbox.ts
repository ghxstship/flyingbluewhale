import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * Inbox read layer (v7.7). Reads the `v_inbox_items` view, which is
 * security_invoker + self-scoped to auth.uid() — so the session-scoped client
 * returns only the calling user's actionable items. The view is brand-new and
 * not in the generated types, so we use the sanctioned loose client and map the
 * snake_case row to a typed item. RLS on the base tables is the real boundary.
 */
export type InboxSource = "notification" | "task";

export type InboxItem = {
  itemId: string;
  source: InboxSource;
  /** Notification kind (assignment / mention / approval / …) or "task". */
  kind: string;
  title: string;
  subtitle: string | null;
  href: string | null;
  /** ISO timestamp the item surfaced at. */
  at: string;
  /** True when the item is past its SLA / due date. */
  slaOverdue: boolean;
  priority: number;
};

export async function listInbox(orgId: string, limit = 100): Promise<InboxItem[]> {
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await supabase
    .from("v_inbox_items")
    .select("item_id, source, kind, title, subtitle, href, at, sla_overdue, priority")
    .eq("org_id", orgId)
    .order("sla_overdue", { ascending: false })
    .order("at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    itemId: String(r.item_id),
    source: (r.source === "task" ? "task" : "notification") as InboxSource,
    kind: String(r.kind ?? "notification"),
    title: String(r.title ?? ""),
    subtitle: r.subtitle == null ? null : String(r.subtitle),
    href: r.href == null ? null : String(r.href),
    at: String(r.at),
    slaOverdue: Boolean(r.sla_overdue),
    priority: Number(r.priority ?? 0),
  }));
}
