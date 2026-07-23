import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { formatDate } from "@/lib/i18n/format";
import { transitionPunchItem } from "./actions";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

function fmt(d: string | null): string {
  if (!d) return "—";
  return formatDate(new Date(d + "T00:00:00"));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data: item } = await supabase
    .from("punch_items")
    .select("*, project:project_id(name), assignee:assignee_id(name, email), vendor:vendor_id(name)")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!item) notFound();

  const project = (item.project as unknown as { name: string | null } | null)?.name ?? "—";
  const assignee = item.assignee as unknown as { name: string | null; email: string | null } | null;
  const vendor = (item.vendor as unknown as { name: string | null } | null)?.name ?? null;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.punch.detail.eyebrow", undefined, "Operations")}
        breadcrumbs={[
          { label: t("console.punch.detail.breadcrumb", undefined, "Punch List"), href: "/studio/punch" },
          { label: item.code },
        ]}
        title={`${item.code} — ${item.title}`}
        subtitle={project}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={toneFor(item.item_state)}>{toTitle(item.item_state)}</Badge>
            {item.show_ready_gate && (
              <Badge variant="error">{t("console.punch.detail.doorsGate", undefined, "Doors Gate")}</Badge>
            )}
            <a
              href={`/studio/punch/${item.id}/edit`}
              className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
            >
              {t("common.edit", undefined, "Edit")}
            </a>
            {item.item_state === "open" && (
              <form action={transitionPunchItem.bind(null, id, "in_progress")}>
                <button className="ps-btn ps-btn--ghost ps-btn--sm" type="submit">
                  {t("console.punch.detail.start", undefined, "Start")}
                </button>
              </form>
            )}
            {item.item_state === "in_progress" && (
              <form action={transitionPunchItem.bind(null, id, "ready_for_review")}>
                <button className="ps-btn ps-btn--ghost ps-btn--sm" type="submit">
                  {t("console.punch.detail.markReady", undefined, "Mark ready")}
                </button>
              </form>
            )}
            {item.item_state === "ready_for_review" && (
              <form action={transitionPunchItem.bind(null, id, "complete")}>
                <button className="ps-btn ps-btn--ghost ps-btn--sm" type="submit">
                  {t("console.punch.detail.close", undefined, "Close")}
                </button>
              </form>
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="surface p-4">
          <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <dt className="text-xs text-[var(--p-text-2)]">
                {t("console.punch.detail.priority", undefined, "Priority")}
              </dt>
              <dd className="font-medium">{toTitle(item.priority)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--p-text-2)]">{t("console.punch.detail.due", undefined, "Due")}</dt>
              <dd className="font-mono">{fmt(item.due_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--p-text-2)]">
                {t("console.punch.detail.assignee", undefined, "Assignee")}
              </dt>
              <dd>{assignee?.name ?? assignee?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--p-text-2)]">
                {t("console.punch.detail.vendor", undefined, "Vendor")}
              </dt>
              <dd>{vendor ?? "—"}</dd>
            </div>
          </dl>
          {item.description && <p className="mt-4 text-sm whitespace-pre-wrap">{item.description}</p>}
        </section>
        <ConversationPanel orgId={session.orgId} recordType="punch_item" recordId={id} />
      </div>
    </>
  );
}
