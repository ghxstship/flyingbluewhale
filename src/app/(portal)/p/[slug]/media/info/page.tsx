import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

type Article = {
  id: string;
  slug: string;
  title: string;
  tags: unknown;
  updated_at: string;
};

function tagsOf(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.media.info.eyebrowShort", undefined, "Portal")}
          title={t("p.media.info.title", undefined, "Info on Demand")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.media.info.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDate = (iso: string): string => fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });
  const { data } = await supabase
    .from("kb_articles")
    .select("id, slug, title, tags, updated_at")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false })
    .limit(200);

  const articles = ((data ?? []) as unknown as Article[]) ?? [];
  const RELEVANT = new Set(["media", "press", "info_on_demand", "factsheet", "biography", "results"]);
  const items = articles.filter((a) => tagsOf(a.tags).some((tag) => RELEVANT.has(tag)));

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.media.info.eyebrow", undefined, "Portal · Media")}
        title={t("p.media.info.title", undefined, "Info on Demand")}
        subtitle={
          items.length === 1
            ? t("p.media.info.subtitle.one", { count: items.length }, `${items.length} document`)
            : t("p.media.info.subtitle.other", { count: items.length }, `${items.length} documents`)
        }
        breadcrumbs={[
          { label: t("p.media.info.crumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.media.info.crumb.media", undefined, "Media"), href: `/p/${slug}/media` },
          { label: t("p.media.info.crumb.info", undefined, "Info") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.media.info.metric.documents", undefined, "Documents")}
            value={fmt.number(items.length)}
          />
          <MetricCard
            label={t("p.media.info.metric.totalKb", undefined, "Total KB")}
            value={fmt.number(articles.length)}
          />
          <MetricCard
            label={t("p.media.info.metric.lastUpdated", undefined, "Last Updated")}
            value={items[0]?.updated_at.slice(0, 10) ?? "—"}
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("p.media.info.section.documents", undefined, "Documents")}</h3>
          {items.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "p.media.info.empty",
                undefined,
                "No info-on-demand documents published yet. The producer publishes briefings and factsheets tagged Media or Press; they appear here when ready.",
              )}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {items.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <Link
                    href={urlFor("platform", `/knowledge/${a.slug}`)}
                    className="font-medium hover:text-[var(--p-accent)]"
                  >
                    {a.title}
                  </Link>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-[var(--p-text-2)]">
                    {tagsOf(a.tags)
                      .slice(0, 3)
                      .map((tag) => (
                        <Badge key={tag} variant="muted">
                          {tag}
                        </Badge>
                      ))}
                    <span className="ms-1">{fmtDate(a.updated_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
