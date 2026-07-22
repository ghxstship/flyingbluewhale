import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Risk = {
  id: string;
  title: string;
  category: string | null;
  likelihood: string;
  impact: string;
  owner_id: string | null;
  risk_state: string;
  due_on: string | null;
};

const RISK_TONE: Record<string, "info" | "warning" | "error" | "success" | "muted"> = {
  open: "warning",
  monitoring: "info",
  mitigated: "success",
  closed: "muted",
  accepted: "info",
};

export default async function ProducerRisk({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return <div className="page-content">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  const { data } = project
    ? await supabase
        .from("risks")
        .select("id, title, category, likelihood, impact, owner_id, risk_state, due_on")
        .eq("org_id", session.orgId)
        .eq("project_id", project.id)
        .order("due_on", { ascending: true, nullsFirst: false })
        .limit(100)
    : { data: [] };
  const rows = (data ?? []) as Risk[];

  // Owner email hydration.
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id).filter((u): u is string => !!u)));
  const { data: owners } = ownerIds.length
    ? await supabase.from("users").select("id, email, name").in("id", ownerIds)
    : { data: [] };
  const ownerMap = new Map(
    ((owners ?? []) as unknown as Array<{ id: string; email: string; name: string | null }>).map((u) => [
      u.id,
      u.name ?? u.email,
    ]),
  );

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "producer")} />
      <div className="flex-1 p-6">
        <h1>{t("p.producer.risk.title", undefined, "Risk Register")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "p.producer.risk.subtitle",
            { project: project?.name ?? t("p.producer.risk.thisProject", undefined, "this project") },
            "Open + monitoring risks for {project}. Mitigation owners + due dates.",
          )}
        </p>

        {rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              size="compact"
              title={t("p.producer.risk.empty.title", undefined, "No Risks Logged")}
              description={t(
                "p.producer.risk.empty.description",
                undefined,
                "Risks raised on this project surface here.",
              )}
            />
          </div>
        ) : (
          <table className="ps-table mt-5 w-full text-sm">
            <thead>
              <tr>
                <th>{t("p.producer.risk.col.title", undefined, "Title")}</th>
                <th>{t("p.producer.risk.col.category", undefined, "Category")}</th>
                <th>{t("p.producer.risk.col.likelihood", undefined, "Likelihood")}</th>
                <th>{t("p.producer.risk.col.impact", undefined, "Impact")}</th>
                <th>{t("p.producer.risk.col.owner", undefined, "Owner")}</th>
                <th>{t("p.producer.risk.col.due", undefined, "Due")}</th>
                <th>{t("p.producer.risk.col.risk_state", undefined, "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.category ?? "—"}</td>
                  <td className="font-mono text-xs">{r.likelihood}</td>
                  <td className="font-mono text-xs">{r.impact}</td>
                  <td>{r.owner_id ? (ownerMap.get(r.owner_id) ?? "—") : "—"}</td>
                  <td className="font-mono text-xs">{r.due_on ? fmt.date(r.due_on) : "—"}</td>
                  <td>
                    <Badge variant={RISK_TONE[r.risk_state] ?? "muted"}>{toTitle(r.risk_state)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
