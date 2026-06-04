import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.commercial.licensing.eyebrow", undefined, "Commercial")}
          title={t("console.commercial.licensing.title", undefined, "Licensing")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.commercial.licensing.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.commercial.licensing.eyebrow", undefined, "Commercial")}
        title={t("console.commercial.licensing.title", undefined, "Licensing")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.commercial.licensing.trademarkSingular", undefined, "Trademark") : t("console.commercial.licensing.trademarkPlural", undefined, "Trademarks")} · ${active} ${t("console.commercial.licensing.activeLabel", undefined, "Active")}${expiringSoon.length ? ` · ${expiringSoon.length} ${t("console.commercial.licensing.expiringInDays", { days: SOON_DAYS }, `Expiring In ${SOON_DAYS}d`)}` : ""}`}
        action={
          <Button href="/console/legal/ip" size="sm">
            {t("console.commercial.licensing.legalIpAction", undefined, "Legal · IP")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.commercial.licensing.metricActive", undefined, "Active")}
            value={fmt.number(active)}
            accent
          />
          <MetricCard
            label={t("console.commercial.licensing.metricExpiring", undefined, "Expiring · 90d")}
            value={fmt.number(expiringSoon.length)}
          />
          <MetricCard
            label={t("console.commercial.licensing.metricExpired", undefined, "Expired")}
            value={fmt.number(expired)}
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title={t("console.commercial.licensing.emptyTitle", undefined, "No Trademarks Registered")}
            description={t(
              "console.commercial.licensing.emptyDescription",
              undefined,
              "Track marks, registration numbers, jurisdictions, and renewal dates here. Royalty + merchandise revenue tracking lives alongside Sponsors.",
            )}
            action={
              <Link href="/console/legal/ip" className="btn btn-secondary btn-sm">
                {t("console.commercial.licensing.openLegalIp", undefined, "Open Legal · IP")}
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.commercial.licensing.colMark", undefined, "Mark")}</th>
                  <th>{t("console.commercial.licensing.colJurisdiction", undefined, "Jurisdiction")}</th>
                  <th>{t("console.commercial.licensing.colRegistration", undefined, "Registration")}</th>
                  <th>{t("console.commercial.licensing.colRegistered", undefined, "Registered")}</th>
                  <th>{t("console.commercial.licensing.colExpires", undefined, "Expires")}</th>
                  <th>{t("console.commercial.licensing.colStatus", undefined, "Status")}</th>
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
                          {r.status === "active" && soon && (
                            <Badge variant="warning">
                              {t("console.commercial.licensing.renewSoon", undefined, "Renew Soon")}
                            </Badge>
                          )}
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
