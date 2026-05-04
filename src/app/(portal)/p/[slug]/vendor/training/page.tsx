import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Training" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
  const courses = articles.filter((a) => tagsOf(a.tags).some((t) => RELEVANT.has(t)));

  return (
    <>
      <ModuleHeader
        eyebrow="Portal"
        title="Training & compliance"
        subtitle={`${courses.length} required course${courses.length === 1 ? "" : "s"}`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Vendor", href: `/p/${slug}/vendor` },
          { label: "Training" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Required Courses" value={fmt.number(courses.length)} />
          <MetricCard label="Total KB Articles" value={fmt.number(articles.length)} />
          <MetricCard label="Last Updated" value={courses[0]?.updated_at.slice(0, 10) ?? "—"} />
        </div>

        {courses.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--text-muted)]">
            No required training right now. Vendor onboarding usually includes safety induction, anti-bribery, and
            compliance modules — the producer will publish them here when needed.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-color)]">
            {courses.map((c) => {
              const tags = tagsOf(c.tags);
              return (
                <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="min-w-0">
                    <Link
                      href={`/p/${slug}/vendor/training/${c.slug}`}
                      className="font-medium hover:text-[var(--org-primary)]"
                    >
                      {c.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1 font-mono text-[10px] text-[var(--text-muted)]">
                      {tags.slice(0, 4).map((t) => (
                        <Badge key={t} variant="muted">
                          {t}
                        </Badge>
                      ))}
                      <span>· updated {fmtDate(c.updated_at)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs text-[var(--text-muted)]">
          Required modules are sourced from <code>kb_articles</code> tagged{" "}
          <code>vendor_training · safety · compliance · ethics · anti_bribery</code>. Completion is tracked at the
          membership level — your producer will share certificates as you complete each module.
        </p>
      </div>
    </>
  );
}
