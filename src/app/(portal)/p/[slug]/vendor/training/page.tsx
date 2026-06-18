import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  tags: unknown;
  updated_at: string;
};

const TRAINING_TAG = "vendor_training";

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
          eyebrow={t("p.vendor.training.eyebrowLabel", undefined, "Portal")}
          title={t("p.vendor.training.titleShort", undefined, "Training")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.vendor.training.configureSupabase", undefined, "Configure Supabase.")}
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

  const articles = ((data ?? []) as unknown as ArticleRow[]) ?? [];
  // Filter to vendor-relevant training: articles tagged with vendor_training,
  // safety, compliance, h&s, ethics, anti-bribery.
  const RELEVANT = new Set([TRAINING_TAG, "safety", "compliance", "h&s", "ethics", "anti_bribery"]);
  const courses = articles.filter((a) => tagsOf(a.tags).some((tag) => RELEVANT.has(tag)));

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.vendor.training.eyebrowLabel", undefined, "Portal")}
        title={t("p.vendor.training.title", undefined, "Training & compliance")}
        subtitle={
          courses.length === 1
            ? t("p.vendor.training.subtitle.one", { count: courses.length }, `${courses.length} required course`)
            : t("p.vendor.training.subtitle.other", { count: courses.length }, `${courses.length} required courses`)
        }
        breadcrumbs={[
          { label: t("p.vendor.training.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.vendor.training.breadcrumb.vendor", undefined, "Vendor"), href: `/p/${slug}/vendor` },
          { label: t("p.vendor.training.breadcrumb.training", undefined, "Training") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.vendor.training.metric.requiredCourses", undefined, "Required Courses")}
            value={fmt.number(courses.length)}
          />
          <MetricCard
            label={t("p.vendor.training.metric.totalKbArticles", undefined, "Total KB Articles")}
            value={fmt.number(articles.length)}
          />
          <MetricCard
            label={t("p.vendor.training.metric.lastUpdated", undefined, "Last Updated")}
            value={courses[0]?.updated_at.slice(0, 10) ?? "—"}
          />
        </div>

        {courses.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t(
              "p.vendor.training.empty",
              undefined,
              "No required training right now. Vendor onboarding usually includes safety induction, anti-bribery, and compliance modules — the producer will publish them here when needed.",
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--p-border)]">
            {courses.map((c) => {
              const tags = tagsOf(c.tags);
              return (
                <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="min-w-0">
                    <Link
                      href={`/p/${slug}/vendor/training/${c.slug}`}
                      className="font-medium hover:text-[var(--p-accent)]"
                    >
                      {c.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1 font-mono text-[10px] text-[var(--p-text-2)]">
                      {tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="muted">
                          {tag}
                        </Badge>
                      ))}
                      <span>
                        {t(
                          "p.vendor.training.updatedAt",
                          { date: fmtDate(c.updated_at) },
                          `· updated ${fmtDate(c.updated_at)}`,
                        )}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "p.vendor.training.footer",
            undefined,
            "Required modules cover vendor training, safety, compliance, ethics, and anti-bribery. Completion is tracked against your membership — your producer will share certificates as you complete each module.",
          )}
        </p>
      </div>
    </>
  );
}
