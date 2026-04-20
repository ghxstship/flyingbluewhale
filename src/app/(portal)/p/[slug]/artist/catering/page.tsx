export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  type Row = { id: string; title: string | null; data: unknown; updated_at: string };
  let items: Row[] = [];
  if (project) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("deliverables")
      .select("id, title, data, updated_at")
      .eq("project_id", project.id)
      .eq("type", "hospitality_rider")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    items = (data ?? []) as Row[];
  }
  return (
    <PortalSubpage slug={slug} persona="artist" title="Catering" subtitle="Hospitality rider + dietary notes">
      {items.length === 0 ? (
        <EmptyState title="Submit your catering rider" description="The rider you post on the Advancing tab surfaces here so the venue's kitchen can prep ahead." />
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li key={r.id} className="surface p-4 text-sm">
              <div className="font-medium">{r.title ?? "Hospitality rider"}</div>
              <pre className="mt-2 overflow-x-auto text-xs text-[var(--text-muted)]">{JSON.stringify(r.data, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </PortalSubpage>
  );
}
