import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

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

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Info on Demand" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("kb_articles")
    .select("id, slug, title, tags, updated_at")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false })
    .limit(200);

  const articles = ((data ?? []) as unknown as Article[]) ?? [];
  const RELEVANT = new Set(["media", "press", "info_on_demand", "factsheet", "biography", "results"]);
  const items = articles.filter((a) => tagsOf(a.tags).some((t) => RELEVANT.has(t)));

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Media"
        title="Info on Demand"
        subtitle={`${items.length} document${items.length === 1 ? "" : "s"}`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Media", href: `/p/${slug}/media` },
          { label: "Info" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Documents" value={items.length.toLocaleString()} />
          <MetricCard label="Total KB" value={articles.length.toLocaleString()} />
          <MetricCard label="Last Updated" value={items[0]?.updated_at.slice(0, 10) ?? "—"} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Documents</h3>
          {items.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No info-on-demand documents published yet. Producer publishes briefings and factsheets to{" "}
              <code>kb_articles</code> tagged <code>media</code> or <code>press</code>.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {items.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/console/knowledge/${a.slug}`} className="font-medium hover:text-[var(--org-primary)]">
                    {a.title}
                  </Link>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-[var(--text-muted)]">
                    {tagsOf(a.tags)
                      .slice(0, 3)
                      .map((t) => (
                        <Badge key={t} variant="muted">
                          {t}
                        </Badge>
                      ))}
                    <span className="ml-1">{fmt(a.updated_at)}</span>
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
