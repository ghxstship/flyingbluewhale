import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type FormRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Console" title="Forms" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("form_defs")
    .select("id, title, slug, status, description, created_at, updated_at")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as FormRow[];

  return (
    <>
      <ModuleHeader
        eyebrow="Console"
        title="Forms"
        subtitle={`${rows.length} form${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/forms/new" size="sm">
            + New Form
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<FormRow>
          rows={rows}
          rowHref={(r) => `/console/forms/${r.id}`}
          emptyLabel="No forms yet"
          emptyDescription="Author intake, RSVP, or feedback forms with a JSON schema. Each form gets a public response URL."
          emptyAction={
            <Button href="/console/forms/new" size="sm">
              + New Form
            </Button>
          }
          columns={[
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title },
            {
              key: "slug",
              header: "Slug",
              render: (r) => <span className="font-mono text-xs">{r.slug}</span>,
              accessor: (r) => r.slug ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => r.status,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
            {
              key: "updated_at",
              header: "Updated",
              render: (r) => <span className="font-mono text-xs">{r.updated_at?.slice(0, 10)}</span>,
              accessor: (r) => r.updated_at?.slice ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
