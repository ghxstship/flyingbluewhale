import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestLocaleSettings, getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Item = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit_price_cents: number;
  currency: string;
  catalog: string;
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.media.services.eyebrow.short", undefined, "Portal")}
          title={t("p.media.services.title", undefined, "Media Services")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.media.services.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { locale } = await getRequestLocaleSettings();

  // Media services live in rate_card_items keyed by 'media' or 'mpc' catalog.
  const { data } = await supabase
    .from("rate_card_items")
    .select("id, sku, name, description, unit_price_cents, currency, catalog")
    .eq("org_id", session.orgId)
    .in("catalog", ["media", "mpc", "media_press_centre"])
    .order("sku", { ascending: true });

  const items = ((data ?? []) as unknown as Item[]) ?? [];
  const byCatalog = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.catalog] = (acc[i.catalog] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.media.services.eyebrowLabel", undefined, "Portal · Media")}
        title={t("p.media.services.title", undefined, "Media Services")}
        subtitle={
          items.length === 1
            ? t(
                "p.media.services.subtitle.one",
                { count: fmt.number(items.length) },
                `${fmt.number(items.length)} Item In Catalog`,
              )
            : t(
                "p.media.services.subtitle.other",
                { count: fmt.number(items.length) },
                `${fmt.number(items.length)} Items In Catalog`,
              )
        }
        breadcrumbs={[
          { label: t("p.media.services.breadcrumbs.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.media.services.breadcrumbs.media", undefined, "Media"), href: `/p/${slug}/media` },
          { label: t("p.media.services.breadcrumbs.services", undefined, "Services") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.media.services.metrics.items", undefined, "Items")}
            value={fmt.number(items.length)}
          />
          <MetricCard
            label={t("p.media.services.metrics.catalogs", undefined, "Catalogs")}
            value={fmt.number(Object.keys(byCatalog).length)}
          />
          <MetricCard
            label={t("p.media.services.metrics.status", undefined, "Status")}
            value={t("p.media.services.metrics.statusOpen", undefined, "Open")}
            accent
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("p.media.services.catalog.heading", undefined, "Catalog")}</h3>
          {items.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "p.media.services.catalog.empty",
                undefined,
                "No media services published. The producer publishes the MPC rate card under the Media catalog; items appear here when ready.",
              )}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {items.map((i) => (
                <li key={i.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{i.name}</div>
                    {i.description && <p className="mt-0.5 text-xs text-[var(--p-text-2)]">{i.description}</p>}
                    <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-[var(--p-text-2)]">
                      <Badge variant="muted">{i.catalog}</Badge>
                      <code>{i.sku}</code>
                    </div>
                  </div>
                  <div className="font-mono text-sm">
                    {formatMoney(i.unit_price_cents, { locale, currency: i.currency })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "p.media.services.footer.note",
            undefined,
            "Order via your producer or the on-site Help Desk. Payment terms: net 30 unless prepaid at booking.",
          )}
        </p>
      </div>
    </>
  );
}
