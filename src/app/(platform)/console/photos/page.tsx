import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Photo = {
  id: string;
  album: string | null;
  file_path: string;
  caption: string | null;
  taken_at: string;
  project: { name: string | null } | null;
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export default async function Page({ searchParams }: { searchParams: Promise<{ album?: string; project?: string }> }) {
  const sp = await searchParams;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  let q = supabase
    .from("project_photos")
    .select("id, album, file_path, caption, taken_at, project:project_id(name)")
    .eq("org_id", session.orgId)
    .order("taken_at", { ascending: false })
    .limit(500);
  if (sp.album) q = q.eq("album", sp.album);
  if (sp.project) q = q.eq("project_id", sp.project);

  const { data } = await q;
  const photos = (data ?? []) as unknown as Photo[];
  const albums = Array.from(new Set(photos.map((p) => p.album).filter(Boolean))) as string[];

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Project Photos"
        subtitle={`${photos.length} photos${sp.album ? ` · album "${sp.album}"` : ""}`}
        action={
          <Button href="/console/photos/upload" size="sm">
            + Upload
          </Button>
        }
      />
      <div className="page-content space-y-4">
        <div className="metric-grid-3">
          <MetricCard label="Photos" value={photos.length.toLocaleString()} accent />
          <MetricCard label="Albums" value={albums.length.toLocaleString()} />
          <MetricCard
            label="Projects Covered"
            value={String(new Set(photos.map((p) => p.project?.name).filter(Boolean)).size)}
          />
        </div>
        {albums.length > 0 && (
          <div className="surface p-3">
            <div className="flex flex-wrap gap-1.5">
              <a
                href="/console/photos"
                className="hover-lift rounded border border-[var(--border-color)] px-2 py-1 text-xs"
              >
                All
              </a>
              {albums.map((a) => (
                <a
                  key={a}
                  href={`/console/photos?album=${encodeURIComponent(a)}`}
                  className="hover-lift rounded border border-[var(--border-color)] px-2 py-1 text-xs"
                >
                  {a}
                </a>
              ))}
            </div>
          </div>
        )}
        {photos.length === 0 ? (
          <div className="surface p-6 text-center text-sm text-[var(--text-muted)]">
            No photos yet. Upload via mobile or console.
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {photos.map((p) => (
              <li key={p.id} className="surface overflow-hidden">
                {/* Thumbnails are signed via /api/v1/photos/[id]/thumb when wired. */}
                <div className="aspect-square bg-[var(--surface-inset)]" />
                <div className="p-2 text-[11px]">
                  <div className="truncate font-medium">{p.caption ?? "—"}</div>
                  <div className="text-[var(--text-muted)]">
                    {p.album ?? "Unalbumed"} · {fmt(p.taken_at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
