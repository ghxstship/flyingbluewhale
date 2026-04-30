export const dynamic = "force-dynamic";

import * as React from "react";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, money } from "@/components/detail/DetailShell";
import { setEquipmentStatus, deleteEquipment } from "../actions";
import type { EquipmentStatus } from "@/lib/supabase/types";

const NEXT: Record<EquipmentStatus, EquipmentStatus[]> = {
  available: ["reserved", "in_use", "maintenance", "retired"],
  reserved: ["in_use", "available", "maintenance"],
  in_use: ["available", "maintenance"],
  maintenance: ["available", "retired"],
  retired: [],
};

export default async function Page({ params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("equipment")
    .select("id, name, category, asset_tag, serial, status, daily_rate_cents, notes, deleted_at, created_at")
    .eq("org_id", session.orgId)
    .eq("id", equipmentId)
    .maybeSingle();

  if (!row || row.deleted_at) {
    return (
      <>
        <ModuleHeader eyebrow="Production" title="Equipment" />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--text-muted)]">Not found.</div>
        </div>
      </>
    );
  }

  const transitions = NEXT[row.status as EquipmentStatus];

  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title={row.name}
        subtitle={row.category ?? undefined}
        breadcrumbs={[
          { label: "Production" },
          { label: "Equipment", href: "/console/production/equipment" },
          { label: row.name },
        ]}
        action={
          <div className="flex items-center gap-1">
            {transitions.map((to) => (
              <form key={to} action={setEquipmentStatus} className="inline">
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="status" value={to} />
                <button
                  type="submit"
                  className={`rounded-md border border-[var(--border-color)] px-2.5 py-1 text-xs font-medium transition-colors ${
                    to === "retired"
                      ? "text-[color:var(--color-error)] hover:bg-[color:var(--color-error)]/10"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Mark {to.replace("_", " ")}
                </button>
              </form>
            ))}
            <a href={`/console/production/equipment/${row.id}/qr`} className="btn btn-ghost btn-sm">
              QR
            </a>
            <a href={`/console/production/equipment/${row.id}/edit`} className="btn btn-secondary btn-sm">
              Edit
            </a>
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        <section className="surface p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Status" value={<StatusBadge status={row.status} />} />
            <Field label="Category" value={row.category ?? "—"} />
            <Field label="Asset Tag" value={row.asset_tag ?? "—"} mono />
            <Field label="Serial" value={row.serial ?? "—"} mono />
            <Field label="Daily Rate" value={money(row.daily_rate_cents)} mono />
            <Field label="Created" value={fmtDate(row.created_at)} mono />
          </div>
          {row.notes && (
            <div className="mt-4 border-t border-[var(--border-color)] pt-3 text-xs text-[var(--text-secondary)]">
              {row.notes}
            </div>
          )}
        </section>

        <section className="surface p-4 text-xs">
          <div className="flex items-center justify-between">
            <Badge variant="muted">Lifecycle</Badge>
            <form action={deleteEquipment}>
              <input type="hidden" name="id" value={row.id} />
              <button type="submit" className="text-[color:var(--color-error)] hover:underline">
                Retire & remove
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-[var(--text-muted)] uppercase">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}
