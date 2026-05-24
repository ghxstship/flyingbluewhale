import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Volunteer Training" />
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
    .from("kb_articles")
    .select("id, slug, title, tags, updated_at")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false })
    .limit(200);

  const articles = ((data ?? []) as unknown as Article[]) ?? [];
  const required = articles.filter((a) => tagsOf(a.tags).some((t) => REQUIRED_TAGS.includes(t)));

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Volunteer"
        title="Training"
        subtitle={`${required.length} required module${required.length === 1 ? "" : "s"}`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Volunteer", href: `/p/${slug}/volunteer` },
          { label: "Training" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Required" value={fmt.number(required.length)} />
          <MetricCard label="Status" value="Open" accent={required.length > 0} />
          <MetricCard label="Last Updated" value={required[0]?.updated_at.slice(0, 10) ?? "—"} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Required Modules</h3>
          {required.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No required training right now. Modules cover volunteer orientation, induction, safety, safeguarding, and
              diversity; they appear here when the producer publishes them.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {required.map((a) => {
                const tags = tagsOf(a.tags).filter((t) => REQUIRED_TAGS.includes(t));
                return (
                  <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/console/knowledge/${a.slug}`} className="font-medium hover:text-[var(--org-primary)]">
                      {a.title}
                    </Link>
                    <div className="flex items-center gap-1">
                      {tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="muted">
                          {t}
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
          Completion of all required modules is mandatory before your first shift. Certificates are issued via the
          producer once you've worked through each module.
        </p>
      </div>
    </>
  );
}
