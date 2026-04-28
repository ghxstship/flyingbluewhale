export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/components/detail/DetailShell";
import { setFabStatus, deleteFab } from "../actions";
import type { FabricationStatus } from "@/lib/supabase/types";

const NEXT: Record<FabricationStatus, { to: FabricationStatus; label: string }[]> = {
  open: [
    { to: "in_progress", label: "Start" },
    { to: "blocked", label: "Block" },
  ],
  in_progress: [
    { to: "complete", label: "Mark complete" },
    { to: "blocked", label: "Block" },
  ],
  blocked: [{ to: "in_progress", label: "Unblock" }],
  complete: [],
};

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("fabrication_orders")
    .select("id, title, description, status, due_at, project_id, created_at")
    .eq("org_id", session.orgId)
    .eq("id", orderId)
    .maybeSingle();

  if (!row) {
    return (
      <>
        <ModuleHeader eyebrow="Production" title="Fabrication" />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--text-muted)]">Not found.</div>
        </div>
      </>
    );
  }

  const transitions = NEXT[row.status as FabricationStatus];

  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title={row.title}
        subtitle={row.description ?? undefined}
        breadcrumbs={[
          { label: "Production" },
          { label: "Fabrication", href: "/console/production/fabrication" },
          { label: row.title },
        ]}
        action={
          <div className="flex items-center gap-1">
            {transitions.map((b) => (
              <form key={b.to} action={setFabStatus} className="inline">
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="status" value={b.to} />
                <button
                  type="submit"
                  className={`rounded-md border border-[var(--border-color)] px-2.5 py-1 text-xs font-medium transition-colors ${
                    b.to === "blocked"
                      ? "text-[var(--color-warning)] hover:bg-[color:var(--color-warning)]/10"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {b.label}
                </button>
              </form>
            ))}
            <a href={`/console/production/fabrication/${row.id}/edit`} className="btn btn-secondary btn-sm">
              Edit
            </a>
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        <section className="surface p-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status" value={<StatusBadge status={row.status} />} />
            <Field label="Due" value={<span className="font-mono text-xs">{fmtDate(row.due_at)}</span>} />
            <Field label="Created" value={<span className="font-mono text-xs">{fmtDate(row.created_at)}</span>} />
          </div>
          {row.description && (
            <div className="mt-4 border-t border-[var(--border-color)] pt-3 text-xs text-[var(--text-secondary)]">
              {row.description}
            </div>
          )}
        </section>

        <section className="surface p-4 text-xs">
          <div className="flex items-center justify-between">
            <Badge variant="muted">Lifecycle</Badge>
            <form action={deleteFab}>
              <input type="hidden" name="id" value={row.id} />
              <button type="submit" className="text-[color:var(--color-error)] hover:underline">
                Delete order
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-[var(--text-muted)] uppercase">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
