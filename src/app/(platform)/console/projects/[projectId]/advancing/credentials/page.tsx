import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { CREDENTIAL_TYPE_LABELS } from "@/lib/open-shifts";
import { getRequestT } from "@/lib/i18n/request";
import { revokeCredentialAction } from "./actions";

export const dynamic = "force-dynamic";

type CredRow = {
  id: string;
  holder_name: string;
  credential_title: string;
  credential_type: string;
  issued_at: string;
  expires_at: string | null;
  qr_token: string;
  is_revoked: boolean;
};

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [projectResp, credsResp] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("digital_credentials")
      .select("id, holder_id, credential_title, credential_type, issued_at, expires_at, qr_token, is_revoked")
      .eq("project_id", projectId)
      .eq("org_id", session.orgId)
      .order("issued_at", { ascending: false })
      .limit(1000),
  ]);

  if (!projectResp.data) return notFound();
  const project = projectResp.data as { id: string; name: string };

  const rawCreds = (credsResp.data ?? []) as Array<{
    id: string; holder_id: string; credential_title: string;
    credential_type: string; issued_at: string; expires_at: string | null;
    qr_token: string; is_revoked: boolean;
  }>;

  const holderIds = Array.from(new Set(rawCreds.map((c) => c.holder_id)));
  const { data: users } = holderIds.length
    ? await supabase.from("users").select("id, name, email").in("id", holderIds)
    : { data: [] };

  const userMap = new Map(
    ((users ?? []) as Array<{ id: string; name: string | null; email: string }>)
      .map((u) => [u.id, u.name ?? u.email]),
  );

  const rows: CredRow[] = rawCreds.map((c) => ({
    id: c.id,
    holder_name: userMap.get(c.holder_id) ?? "Unknown",
    credential_title: c.credential_title,
    credential_type: c.credential_type,
    issued_at: c.issued_at,
    expires_at: c.expires_at,
    qr_token: c.qr_token,
    is_revoked: c.is_revoked,
  }));

  const active = rows.filter((r) => !r.is_revoked).length;
  const revoked = rows.filter((r) => r.is_revoked).length;

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t("console.projects.advancing.credentials.title", undefined, "Digital Credentials")}
        subtitle={t(
          "console.projects.advancing.credentials.subtitle",
          { active, revoked, total: rows.length },
          `${active} Active · ${revoked} Revoked · ${rows.length} Total`,
        )}
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project.name, href: `/console/projects/${projectId}` },
          { label: "Advancing", href: `/console/projects/${projectId}/advancing` },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.projects.advancing.credentials.metric.active", undefined, "Active")}
            value={String(active)}
            accent
          />
          <MetricCard
            label={t("console.projects.advancing.credentials.metric.revoked", undefined, "Revoked")}
            value={String(revoked)}
          />
          <MetricCard
            label={t("console.projects.advancing.credentials.metric.total", undefined, "Total")}
            value={String(rows.length)}
          />
        </div>

        <DataTable<CredRow>
          tableId="advancing.digital_credentials"
          rows={rows}
          emptyLabel={t("console.projects.advancing.credentials.empty.label", undefined, "No credentials issued")}
          emptyDescription={t(
            "console.projects.advancing.credentials.empty.desc",
            undefined,
            "Credentials are auto-issued when a credential_assignment deliverable reaches Delivered state.",
          )}
          columns={[
            {
              key: "holder",
              header: t("console.projects.advancing.credentials.column.holder", undefined, "Holder"),
              render: (r) => r.holder_name,
              accessor: (r) => r.holder_name,
              filterable: true,
            },
            {
              key: "title",
              header: t("console.projects.advancing.credentials.column.title", undefined, "Credential"),
              render: (r) => r.credential_title,
              accessor: (r) => r.credential_title,
              filterable: true,
            },
            {
              key: "type",
              header: t("console.projects.advancing.credentials.column.type", undefined, "Type"),
              render: (r) => CREDENTIAL_TYPE_LABELS[r.credential_type as keyof typeof CREDENTIAL_TYPE_LABELS] ?? r.credential_type,
              accessor: (r) => r.credential_type,
              filterable: true,
              groupable: true,
            },
            {
              key: "issued",
              header: t("console.projects.advancing.credentials.column.issued", undefined, "Issued"),
              render: (r) => new Date(r.issued_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              accessor: (r) => r.issued_at,
            },
            {
              key: "expires",
              header: t("console.projects.advancing.credentials.column.expires", undefined, "Expires"),
              render: (r) => r.expires_at
                ? new Date(r.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "—",
              accessor: (r) => r.expires_at ?? null,
            },
            {
              key: "qr",
              header: t("console.projects.advancing.credentials.column.token", undefined, "Token"),
              render: (r) => <span className="font-mono text-xs text-[var(--text-muted)]">{r.qr_token.slice(0, 8)}…</span>,
              accessor: (r) => r.qr_token,
            },
            {
              key: "status",
              header: t("console.projects.advancing.credentials.column.status", undefined, "Status"),
              render: (r) => (
                <Badge variant={r.is_revoked ? "error" : "success"}>
                  {r.is_revoked
                    ? t("console.projects.advancing.credentials.revoked", undefined, "Revoked")
                    : t("console.projects.advancing.credentials.active", undefined, "Active")}
                </Badge>
              ),
              accessor: (r) => r.is_revoked ? "revoked" : "active",
              filterable: true,
              groupable: true,
            },
            {
              key: "action",
              header: t("console.projects.advancing.credentials.column.action", undefined, "Action"),
              render: (r) =>
                !r.is_revoked ? (
                  <form action={revokeCredentialAction}>
                    <input type="hidden" name="credential_id" value={r.id} />
                    <input type="hidden" name="project_id" value={projectId} />
                    <button type="submit" className="btn btn-secondary btn-xs">
                      {t("console.projects.advancing.credentials.action.revoke", undefined, "Revoke")}
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                ),
              accessor: () => null,
            },
          ]}
        />
      </div>
    </>
  );
}
