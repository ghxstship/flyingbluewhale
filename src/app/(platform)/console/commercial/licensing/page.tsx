import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type TrademarkRow = {
  id: string;
  mark: string;
  jurisdiction: string | null;
  registration_no: string | null;
  registered_on: string | null;
  expires_on: string | null;
  status: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  active: "success",
  pending: "info",
  expired: "error",
  abandoned: "muted",
};

const SOON_DAYS = 90;

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Commercial" title="Licensing" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("trademarks")
    .select("id, mark, jurisdiction, registration_no, registered_on, expires_on, status")
    .eq("org_id", session.orgId)
    .order("expires_on", { ascending: true })
    .limit(500);

  const rows = (data ?? []) as TrademarkRow[];
  const now = Date.now();
  const expiringSoon = rows.filter(
    (r) =>
      r.expires_on && new Date(r.expires_on).getTime() - now < SOON_DAYS * 24 * 60 * 60 * 1000 && r.status === "active",
  );
  const active = rows.filter((r) => r.status === "active").length;
  const expired = rows.filter((r) => r.status === "expired").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Commercial"
        title="Licensing"
        subtitle={`${rows.length} Trademark${rows.length === 1 ? "" : "s"} · ${active} Active${expiringSoon.length ? ` · ${expiringSoon.length} Expiring In ${SOON_DAYS}d` : ""}`}
        action={
          <Button href="/console/legal/ip" size="sm">
            Legal · IP
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Active" value={fmt.number(active)} accent />
          <MetricCard label="Expiring · 90d" value={fmt.number(expiringSoon.length)} />
          <MetricCard label="Expired" value={fmt.number(expired)} />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No Trademarks Registered"
            description="Track marks, registration numbers, jurisdictions, and renewal dates here. Royalty + merchandise revenue tracking lives alongside Sponsors."
            action={
              <Link href="/console/legal/ip" className="btn btn-secondary btn-sm">
                Open Legal · IP
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Mark</th>
                  <th>Jurisdiction</th>
                  <th>Registration</th>
                  <th>Registered</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const expiresMs = r.expires_on ? new Date(r.expires_on).getTime() - now : null;
                  const soon = expiresMs != null && expiresMs < SOON_DAYS * 24 * 60 * 60 * 1000;
                  return (
                    <tr key={r.id}>
                      <td className="font-medium">{r.mark}</td>
                      <td>{r.jurisdiction ?? "—"}</td>
                      <td className="font-mono text-xs">{r.registration_no ?? "—"}</td>
                      <td className="font-mono text-xs">{r.registered_on ?? "—"}</td>
                      <td className="font-mono text-xs">{r.expires_on ?? "—"}</td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>
                          {r.status === "active" && soon && <Badge variant="warning">Renew Soon</Badge>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
