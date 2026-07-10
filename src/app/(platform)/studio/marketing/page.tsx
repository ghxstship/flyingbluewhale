import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  kind: string;
  occurs_at: string;
  label: string | null;
  visibility: string;
  talent_offer_id: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketing.eyebrow", undefined, "Marketing")}
          title={t("console.marketing.title", undefined, "Overview")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.marketing.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("event_milestones")
    .select("id, kind, occurs_at, label, visibility, talent_offer_id")
    .eq("org_id", session.orgId)
    .gte("occurs_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
    .order("occurs_at", { ascending: true })
    .limit(200);
  const rows = (data ?? []) as Row[];
  const onsales = rows.filter((r) => r.kind === "onsale").length;
  const presales = rows.filter((r) => r.kind === "presale_start").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketing.eyebrow", undefined, "Marketing")}
        title={t("console.marketing.title", undefined, "Overview")}
        subtitle={
          rows.length === 1
            ? t("console.marketing.subtitleOne", { count: rows.length }, `${rows.length} Upcoming milestone`)
            : t("console.marketing.subtitleOther", { count: rows.length }, `${rows.length} Upcoming milestones`)
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.marketing.metrics.onsales", undefined, "On-sales")}
            value={fmt.number(onsales)}
            accent
          />
          <MetricCard
            label={t("console.marketing.metrics.presales", undefined, "Presales")}
            value={fmt.number(presales)}
          />
          <MetricCard
            label={t("console.marketing.metrics.allMilestones", undefined, "All Milestones")}
            value={fmt.number(rows.length)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Link href="/studio/marketing/onsales" className="surface p-5">
            <div className="text-sm font-semibold tracking-wide uppercase">
              {t("console.marketing.cards.onsales.title", undefined, "On-sales")}
            </div>
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("console.marketing.cards.onsales.description", undefined, "Upcoming on-sale dates across all shows.")}
            </p>
          </Link>
          <Link href="/studio/marketing/calendar" className="surface p-5">
            <div className="text-sm font-semibold tracking-wide uppercase">
              {t("console.marketing.cards.calendar.title", undefined, "Calendar")}
            </div>
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "console.marketing.cards.calendar.description",
                undefined,
                "Announce, presale, on-sale, sold-out, embargo.",
              )}
            </p>
          </Link>
        </div>

        {rows.length > 0 && (
          <section className="surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide uppercase">
                {t("console.marketing.upcoming", undefined, "Upcoming")}
              </h2>
              <Button href="/studio/marketing/calendar" size="sm" variant="ghost">
                {t("console.marketing.viewCalendar", undefined, "View calendar")}
              </Button>
            </div>
            <ul className="divide-y divide-[var(--border-subtle)]">
              {rows.slice(0, 10).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_TONE[r.kind] ?? "muted"}>{toTitle(r.kind)}</Badge>
                    <span>{r.label ?? "—"}</span>
                  </div>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">
                    {fmt.dateTime(new Date(r.occurs_at))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
