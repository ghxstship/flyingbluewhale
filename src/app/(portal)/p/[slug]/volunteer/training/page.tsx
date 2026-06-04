import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Article = {
  id: string;
  slug: string;
  title: string;
  tags: unknown;
  updated_at: string;
};

const REQUIRED_TAGS = ["volunteer_training", "induction", "safety", "safeguarding", "diversity"];

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
          eyebrow={t("p.volunteer.training.eyebrow.short", undefined, "Portal")}
          title={t("p.volunteer.training.title.full", undefined, "Volunteer Training")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.volunteer.training.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("kb_articles")
    .select("id, slug, title, tags, updated_at")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false })
    .limit(200);

  const articles = ((data ?? []) as unknown as Article[]) ?? [];
  const required = articles.filter((a) => tagsOf(a.tags).some((tag) => REQUIRED_TAGS.includes(tag)));

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.volunteer.training.eyebrow", undefined, "Portal · Volunteer")}
        title={t("p.volunteer.training.title", undefined, "Training")}
        subtitle={t(
          required.length === 1 ? "p.volunteer.training.subtitle.one" : "p.volunteer.training.subtitle.other",
          { count: required.length },
          `${required.length} required module${required.length === 1 ? "" : "s"}`,
        )}
        breadcrumbs={[
          { label: t("p.volunteer.training.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          {
            label: t("p.volunteer.training.breadcrumb.volunteer", undefined, "Volunteer"),
            href: `/p/${slug}/volunteer`,
          },
          { label: t("p.volunteer.training.breadcrumb.training", undefined, "Training") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.volunteer.training.metric.required", undefined, "Required")}
            value={fmt.number(required.length)}
          />
          <MetricCard
            label={t("p.volunteer.training.metric.status", undefined, "Status")}
            value={t("p.volunteer.training.metric.status.open", undefined, "Open")}
            accent={required.length > 0}
          />
          <MetricCard
            label={t("p.volunteer.training.metric.lastUpdated", undefined, "Last Updated")}
            value={required[0]?.updated_at.slice(0, 10) ?? "—"}
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("p.volunteer.training.requiredModules.heading", undefined, "Required Modules")}
          </h3>
          {required.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {t(
                "p.volunteer.training.requiredModules.empty",
                undefined,
                "No required training right now. Modules cover volunteer orientation, induction, safety, safeguarding, and diversity; they appear here when the producer publishes them.",
              )}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {required.map((a) => {
                const tags = tagsOf(a.tags).filter((tag) => REQUIRED_TAGS.includes(tag));
                return (
                  <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/console/knowledge/${a.slug}`} className="font-medium hover:text-[var(--org-primary)]">
                      {a.title}
                    </Link>
                    <div className="flex items-center gap-1">
                      {tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="muted">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          {t(
            "p.volunteer.training.footer.note",
            undefined,
            "Completion of all required modules is mandatory before your first shift. Certificates are issued via the producer once you've worked through each module.",
          )}
        </p>
      </div>
    </>
  );
}
