import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  kind: string;
  due_at: string;
  completed_at: string | null;
  outcome: string | null;
};

const OUTCOME_VARIANT: Record<string, BadgeVariant> = {
  pass: "success",
  fail: "error",
  partial: "info",
};

export default async function Page({ params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("maintenance_jobs")
    .select("id,kind,due_at,completed_at,outcome")
    .eq("org_id", session.orgId)
    .eq("target_kind", "equipment")
    .eq("target_id", equipmentId)
    .order("due_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader eyebrow="Equipment" title="Maintenance" subtitle="Scheduled inspection + service jobs." />
      <div className="page-content space-y-4">
        <DataTable<Row>
          rows={rows}
          emptyLabel="No Maintenance Jobs"
          emptyDescription="No maintenance jobs scheduled for this equipment yet. Schedule one from the Maintenance module."
          columns={[
            { key: "kind", header: "Kind", render: (r) => r.kind, accessor: (r) => r.kind, filterable: true },
            {
              key: "due_at",
              header: "Due",
              render: (r) => formatDate(r.due_at),
              accessor: (r) => r.due_at,
              mono: true,
              sortable: true,
            },
            {
              key: "completed_at",
              header: "Completed",
              render: (r) => (r.completed_at ? formatDate(r.completed_at) : "—"),
              accessor: (r) => r.completed_at ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "outcome",
              header: "Outcome",
              render: (r) =>
                r.outcome ? <Badge variant={OUTCOME_VARIANT[r.outcome] ?? "default"}>{r.outcome}</Badge> : "—",
              accessor: (r) => r.outcome ?? "",
              filterable: true,
            },
          ]}
        />
        <p className="text-xs text-[var(--text-muted)]">
          Schedule jobs from the{" "}
          <Link href="/console/operations/maintenance" className="underline">
            Maintenance module
          </Link>
          .
        </p>
      </div>
    </>
  );
}
