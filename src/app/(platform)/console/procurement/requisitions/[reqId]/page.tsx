export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteRequisition } from "./edit/actions";

export default async function Page({ params }: { params: Promise<{ reqId: string }> }) {
  const { reqId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("requisitions")
    .select("id, title, description, estimated_cents, project_id, created_at")
    .eq("org_id", session.orgId)
    .eq("id", reqId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="Procurement"
      title={(r) => r.title ?? "Requisition"}
      subtitle={(r) => `${money(r.estimated_cents)}`}
      breadcrumbs={[
        { label: "Procurement" },
        { label: "Requisitions", href: "/console/procurement/requisitions" },
        { label: row?.title ?? "Requisition" },
      ]}
      fields={
        row
          ? [
              { label: "Estimated", value: money(row.estimated_cents) },
              { label: "Description", value: row.description ?? "—" },
              { label: "Created", value: fmtDate(row.created_at) },
            ]
          : undefined
      }
      action={
        row ? (
          <div className="flex items-center gap-2">
            <Button href={`/console/procurement/requisitions/${reqId}/edit`} size="sm" variant="secondary">
              Edit
            </Button>
            <DeleteForm
              action={deleteRequisition.bind(null, reqId)}
              confirm={`Delete requisition "${row.title ?? "this record"}"? This cannot be undone.`}
            />
          </div>
        ) : undefined
      }
    />
  );
}
