import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

type Article = {
  id: string;
  slug: string;
  title: string;
  body_markdown: string;
  tags: string[] | null;
  version: number;
  updated_at: string;
};

function tagsOf(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((t): t is string => typeof t === "string");
  return [];
}

function preview(body: string): string {
  const stripped = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s.*$/gm, "")
    .replace(/[*_`#>-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > 180 ? stripped.slice(0, 180) + "…" : stripped;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const sp = await searchParams;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Knowledge" title="Knowledge Base" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  let q = supabase
    .from("kb_articles")
    .select("id, slug, title, body_markdown, tags, version, updated_at")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false })
    .limit(200);

  const { data } = await q;
  let rows = (data ?? []).map((r) => ({
    ...r,
    tags: tagsOf((r as { tags?: unknown }).tags),
  })) as Article[];

  if (sp.tag) {
    rows = rows.filter((r) => r.tags?.includes(sp.tag!));
  }

  const allTags = Array.from(new Set(rows.flatMap((r) => r.tags ?? []))).sort();

  return (
    <>
      <ModuleHeader
        eyebrow="Knowledge"
        title="Knowledge Base"
        subtitle={
          sp.tag
            ? `${rows.length} article${rows.length === 1 ? "" : "s"} tagged "${sp.tag}"`
            : `${rows.length} article${rows.length === 1 ? "" : "s"}`
        }
        action={
          <Button href="/console/knowledge/new" size="sm">
            + New Article
          </Button>
        }
      />
      <div className="page-content space-y-4">
        {allTags.length > 0 && (
          <div className="surface p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href="/console/knowledge"
                className="hover-lift rounded border border-[var(--border-color)] px-2 py-1 text-xs"
              >
                All
              </Link>
              {allTags.map((t) => (
                <Link
                  key={t}
                  href={`/console/knowledge?tag=${encodeURIComponent(t)}`}
                  className={`hover-lift rounded border border-[var(--border-color)] px-2 py-1 text-xs ${
                    sp.tag === t ? "bg-[var(--surface-inset)] font-semibold" : ""
                  }`}
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="surface">
            <EmptyState
              size="compact"
              title={sp.tag ? `No articles tagged "${sp.tag}"` : "No articles yet"}
              description="Knowledge articles render markdown bodies and can be filtered by tag. Create one to get started."
              action={
                <Button href="/console/knowledge/new" size="sm">
                  + Create first article
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((a) => (
              <li key={a.id} className="surface hover-lift p-4">
                <Link href={`/console/knowledge/${a.slug}`} className="block">
                  <div className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
                    /{a.slug} · v{a.version}
                  </div>
                  <h3 className="mt-1 text-base font-semibold">{a.title}</h3>
                  <p className="mt-2 line-clamp-3 text-xs text-[var(--text-secondary)]">{preview(a.body_markdown)}</p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <div className="flex flex-wrap gap-1">
                      {(a.tags ?? []).slice(0, 4).map((t) => (
                        <Badge key={t} variant="muted">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <span>{timeAgo(a.updated_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
