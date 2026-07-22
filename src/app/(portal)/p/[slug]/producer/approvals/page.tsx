import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

type Approval = {
  id: string;
  proposal_id: string;
  kind: string;
  title: string | null;
  state: string;
  signed_at: string | null;
  due_at: string | null;
  created_at: string;
};

export default async function ProducerApprovals({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("p.producer.approvals.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  // proposal_approvals → proposals → project_id. Two-step filter.
  const { data: proposals } = project
    ? await supabase.from("proposals").select("id, title").eq("org_id", session.orgId).eq("project_id", project.id)
    : { data: [] };
  const propMap = new Map(((proposals ?? []) as Array<{ id: string; title: string }>).map((p) => [p.id, p.title]));
  const propIds = Array.from(propMap.keys());

  const { data } = propIds.length
    ? await supabase
        .from("proposal_approvals")
        .select("id, proposal_id, kind, title, state, signed_at, due_at, created_at")
        .eq("org_id", session.orgId)
        .in("proposal_id", propIds)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };
  const rows = (data ?? []) as Approval[];

  const pendingCount = rows.filter((r) => r.state === "pending").length;

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "producer")} />
      <div className="flex-1 p-6">
        <h1>{t("p.producer.approvals.title", undefined, "Approvals")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {propIds.length === 1
            ? t(
                "p.producer.approvals.summary.one",
                { count: pendingCount },
                `${pendingCount} pending across 1 proposal.`,
              )
            : t(
                "p.producer.approvals.summary.other",
                { count: pendingCount, total: propIds.length },
                `${pendingCount} pending across ${propIds.length} proposals.`,
              )}
        </p>

        <ul className="mt-5 space-y-2">
          {rows.length === 0 ? (
            <li>
              <EmptyState
                size="compact"
                title={t("p.producer.approvals.empty.title", undefined, "No Approvals")}
                description={t(
                  "p.producer.approvals.empty.description",
                  undefined,
                  "Proposal approval steps appear here as they're routed.",
                )}
              />
            </li>
          ) : (
            rows.map((a) => (
              <li key={a.id} className="surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {propMap.get(a.proposal_id) ?? t("p.producer.approvals.proposalFallback", undefined, "Proposal")}{" "}
                      · {a.title ?? a.kind}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--p-text-2)]">
                      {a.kind} · {fmt.date(a.created_at)}
                      {a.signed_at
                        ? ` · ${t("p.producer.approvals.signedAt", { date: fmt.date(a.signed_at) }, `signed ${fmt.date(a.signed_at)}`)}`
                        : ""}
                      {a.due_at
                        ? ` · ${t("p.producer.approvals.dueAt", { date: fmt.date(a.due_at) }, `due ${fmt.date(a.due_at)}`)}`
                        : ""}
                    </div>
                  </div>
                  <Badge variant={a.state === "signed" ? "success" : a.state === "declined" ? "error" : "info"}>
                    {t(`p.producer.approvals.state.${a.state}`, undefined, a.state)}
                  </Badge>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
