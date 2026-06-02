import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

// Credential types tracked for scheduling compliance (mirrors credential_type enum)
const REQUIRED_CREDENTIAL_TYPES = [
  "general_liability",
  "workers_comp",
  "i9",
  "w9",
  "drivers_license",
  "alcohol_permit",
  "food_handler",
  "first_aid",
] as const;

type CrewMember = {
  id: string;
  full_name: string;
  role: string | null;
  email: string | null;
};

type Credential = {
  crew_member_id: string;
  credential_type: string;
  expires_at: string | null;
  verified: boolean;
};

type ComplianceRow = {
  id: string;
  full_name: string;
  role: string | null;
  email: string | null;
  credentials: Credential[];
  missingCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  complianceState: "compliant" | "expiring" | "gaps";
};

function daysBetween(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Credential Compliance" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [{ data: crew }, { data: creds }] = await Promise.all([
    supabase
      .from("crew_members")
      .select("id, full_name, role, email")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("full_name")
      .limit(500),
    supabase
      .from("credentials")
      .select("crew_member_id, credential_type, expires_at, verified")
      .eq("org_id", session.orgId)
      .order("expires_at", { ascending: true, nullsFirst: false }),
  ]);

  const crewList = (crew ?? []) as CrewMember[];
  const credList = (creds ?? []) as Credential[];

  // Group credentials by crew member id
  const credsByMember: Record<string, Credential[]> = {};
  for (const c of credList) {
    credsByMember[c.crew_member_id] ??= [];
    credsByMember[c.crew_member_id].push(c);
  }

  const rows: ComplianceRow[] = crewList.map((m) => {
    const memberCreds = credsByMember[m.id] ?? [];
    const heldTypes = new Set(memberCreds.map((c) => c.credential_type));

    const missingCount = REQUIRED_CREDENTIAL_TYPES.filter((t) => !heldTypes.has(t)).length;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    for (const c of memberCreds) {
      if (!c.expires_at) continue;
      const days = daysBetween(c.expires_at);
      if (days < 0) expiredCount++;
      else if (days <= 30) expiringSoonCount++;
    }

    const complianceState: ComplianceRow["complianceState"] =
      missingCount > 0 || expiredCount > 0
        ? "gaps"
        : expiringSoonCount > 0
          ? "expiring"
          : "compliant";

    return { ...m, credentials: memberCreds, missingCount, expiringSoonCount, expiredCount, complianceState };
  });

  const compliant = rows.filter((r) => r.complianceState === "compliant").length;
  const expiring = rows.filter((r) => r.complianceState === "expiring").length;
  const gaps = rows.filter((r) => r.complianceState === "gaps").length;

  const STATE_TONE: Record<ComplianceRow["complianceState"], "success" | "warning" | "error"> = {
    compliant: "success",
    expiring: "warning",
    gaps: "error",
  };

  const STATE_LABEL: Record<ComplianceRow["complianceState"], string> = {
    compliant: "Compliant",
    expiring: "Expiring Soon",
    gaps: "Gaps",
  };

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Credential Compliance"
        subtitle={`${crewList.length} crew member${crewList.length === 1 ? "" : "s"} · ${gaps} with gaps · ${expiring} expiring within 30 days`}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Compliant" value={fmt.number(compliant)} accent />
          <MetricCard label="Expiring ≤30d" value={fmt.number(expiring)} />
          <MetricCard label="Credential Gaps" value={fmt.number(gaps)} />
        </div>

        <section className="surface p-4 space-y-2">
          <h2 className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)]">
            Tracked Credential Types
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {REQUIRED_CREDENTIAL_TYPES.map((t) => (
              <Badge key={t} variant="muted">
                {t.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            These types are required before scheduling crew to compliance-gated roles. Add credentials in the crew
            member profile under Credentials.
          </p>
        </section>

        {crewList.length === 0 ? (
          <EmptyState
            title="No Crew Members"
            description="Add crew members to start tracking credential compliance."
          />
        ) : (
          <DataTable<ComplianceRow>
            rows={rows}
            rowHref={(r) => `/console/crew/${r.id}`}
            columns={[
              {
                key: "name",
                header: "Name",
                render: (r) => r.full_name,
                accessor: (r) => r.full_name,
                filterable: true,
              },
              {
                key: "role",
                header: "Role",
                render: (r) => r.role ?? "—",
                accessor: (r) => r.role ?? null,
                filterable: true,
                groupable: true,
              },
              {
                key: "status",
                header: "Status",
                render: (r) => (
                  <Badge variant={STATE_TONE[r.complianceState]}>{STATE_LABEL[r.complianceState]}</Badge>
                ),
                accessor: (r) => r.complianceState,
                filterable: true,
                groupable: true,
              },
              {
                key: "creds",
                header: "Credentials",
                render: (r) => fmt.number(r.credentials.length),
                accessor: (r) => r.credentials.length,
                className: "font-mono text-xs text-right",
              },
              {
                key: "missing",
                header: "Missing",
                render: (r) =>
                  r.missingCount > 0 ? (
                    <span className="font-mono text-xs text-[var(--color-error)]">{r.missingCount}</span>
                  ) : (
                    <span className="font-mono text-xs text-[var(--text-muted)]">0</span>
                  ),
                accessor: (r) => r.missingCount,
                className: "font-mono text-xs text-right",
              },
              {
                key: "expired",
                header: "Expired",
                render: (r) =>
                  r.expiredCount > 0 ? (
                    <span className="font-mono text-xs text-[var(--color-error)]">{r.expiredCount}</span>
                  ) : (
                    <span className="font-mono text-xs text-[var(--text-muted)]">0</span>
                  ),
                accessor: (r) => r.expiredCount,
                className: "font-mono text-xs text-right",
              },
              {
                key: "expiring",
                header: "Expiring ≤30d",
                render: (r) =>
                  r.expiringSoonCount > 0 ? (
                    <Badge variant="warning">{r.expiringSoonCount}</Badge>
                  ) : (
                    <span className="font-mono text-xs text-[var(--text-muted)]">—</span>
                  ),
                accessor: (r) => r.expiringSoonCount,
                className: "font-mono text-xs text-right",
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
