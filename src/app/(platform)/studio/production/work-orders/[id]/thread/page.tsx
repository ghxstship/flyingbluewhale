import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { postWorkOrderMessageAction } from "../../actions";

export const dynamic = "force-dynamic";

type Msg = { id: string; body: string; author_id: string | null; created_at: string };

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default async function WorkOrderThread({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data: wo } = await supabase
    .from("work_orders")
    .select("id, title")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!wo) notFound();

  const { data: msgData } = await supabase
    .from("work_order_messages")
    .select("id, body, author_id, created_at")
    .eq("work_order_id", id)
    .order("created_at", { ascending: true })
    .limit(500);
  const messages = (msgData ?? []) as Msg[];

  const authorIds = [...new Set(messages.map((m) => m.author_id).filter(Boolean) as string[])];
  const nameById = new Map<string, string>();
  if (authorIds.length) {
    const { data: users } = await supabase.from("users").select("id, name, email").in("id", authorIds);
    for (const u of (users ?? []) as { id: string; name: string | null; email: string }[]) {
      nameById.set(u.id, u.name ?? u.email.split("@")[0]!);
    }
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.workOrders.eyebrow", undefined, "Production")}
        title={t("console.production.workOrders.thread.title", undefined, "Work Order Thread")}
        subtitle={wo.title}
      />
      <div className="mb-4">
        <Link href={`/studio/production/work-orders/${id}`} className="text-sm text-[var(--p-accent-text)] hover:underline">
          ← {t("console.production.workOrders.thread.back", undefined, "Back to work order")}
        </Link>
      </div>

      <div className="page-content max-w-2xl">
        {messages.length === 0 ? (
          <EmptyState
            size="compact"
            title={t("console.production.workOrders.thread.empty", undefined, "No messages yet")}
            description={t(
              "console.production.workOrders.thread.emptyBody",
              undefined,
              "Coordinate scope, scheduling and site access with the awarded crew here.",
            )}
          />
        ) : (
          <ul className="mb-6 flex flex-col gap-3">
            {messages.map((m) => (
              <li key={m.id} className="surface rounded-[var(--p-r-md)] border border-[var(--p-border)] p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{m.author_id ? nameById.get(m.author_id) ?? "Member" : "Member"}</span>
                  <span className="font-mono text-[10px] text-[var(--p-text-3)]">{fmt(m.created_at)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap text-[var(--p-text-1)]">{m.body}</p>
              </li>
            ))}
          </ul>
        )}

        <FormShell
          action={postWorkOrderMessageAction.bind(null, id)}
          submitLabel={t("console.production.workOrders.thread.send", undefined, "Send")}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("console.production.workOrders.thread.message", undefined, "Message")}</span>
            <textarea name="body" required maxLength={2000} rows={3} className="ps-input" />
          </label>
        </FormShell>
      </div>
    </>
  );
}
