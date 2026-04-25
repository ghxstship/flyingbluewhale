import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Knowledge base" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("kb_articles", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader
        eyebrow="Knowledge"
        title="Knowledge base"
        subtitle={`${rows.length} article${rows.length === 1 ? "" : "s"}`}
        action={<Button href="/console/kb/new" size="sm">+ New article</Button>}
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/kb/${r.id}`}
          columns={[
            { key: "slug", header: "Slug", render: (r) => <span className="font-mono text-xs">{String(r.slug ?? "—")}</span> },
            { key: "title", header: "Title", render: (r) => String(r.title ?? "—") },
            { key: "version", header: "Ver", render: (r) => <span className="font-mono text-xs">{String(r.version ?? "—")}</span> },
            { key: "updated_at", header: "Updated", render: (r) => <span className="font-mono text-xs">{String(r.updated_at ?? "—")}</span> },
          ]}
        />
      </div>
    </>
  );
}
