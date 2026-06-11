export const dynamic = "force-dynamic";

import * as React from "react";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { fmtDate, money } from "@/components/detail/DetailShell";
import { DeleteForm } from "@/components/DeleteForm";
import { setEquipmentStatus, deleteEquipment } from "../actions";
import type { EquipmentStatus } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();
  // asset_movements canonical (0016) schema lives on the remote — but
  // database.types.ts was generated against the shadowed (0019) variant
  // with `asset_id` and no org_id. Migration 0060 guards against the
  // schema flipping back; until type generation catches up we use the
  // loose client for this one read.
  const loose = supabase as unknown as LooseSupabase;
  const [{ data: row }, { data: movementsData }] = await Promise.all([
    supabase
      .from("equipment")
      .select("id, name, category, asset_tag, serial, equipment_state, daily_rate_cents, notes, deleted_at, created_at")
      .eq("org_id", session.orgId)
      .eq("id", equipmentId)
      .maybeSingle(),
    loose
      .from("asset_movements")
      .select(
        "id, from_state, to_state, moved_at, reason, project_id, rental_id, moved_by, mover:users!asset_movements_moved_by_fkey(name, email), project:projects!asset_movements_project_id_fkey(name)",
      )
      .eq("org_id", session.orgId)
      .eq("equipment_id", equipmentId)
      .order("moved_at", { ascending: false })
      .limit(50),
  ]);

  if (!row || row.deleted_at) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.production.equipment.eyebrow", undefined, "Production")}
          title={t("console.production.equipment.title", undefined, "Equipment")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("console.production.equipment.detail.notFound", undefined, "Not found.")}
          </div>
        </div>
      </>
    );
  }

  const transitions = NEXT[row.equipment_state as EquipmentStatus];

  // asset_movements is the LDP §3 append-only state ledger and had zero
  // UI exposure before this page — the equipment status was visible but
  // the audit trail of who moved what when wasn't reachable from the
  // app. Render the last 50 transitions; older entries stay queryable
  // via the activity log.
  type MovementRow = {
    id: string;
    from_state: string | null;
    to_state: string;
    moved_at: string;
    reason: string | null;
    project_id: string | null;
    rental_id: string | null;
    moved_by: string | null;
    mover: { name: string | null; email: string | null } | null;
    project: { name: string | null } | null;
  };
  const movements = (movementsData ?? []) as unknown as MovementRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.equipment.eyebrow", undefined, "Production")}
        title={row.name}
        subtitle={row.category ?? undefined}
        breadcrumbs={[
          { label: t("console.production.equipment.eyebrow", undefined, "Production") },
          {
            label: t("console.production.equipment.title", undefined, "Equipment"),
            href: "/console/production/equipment",
          },
          { label: row.name },
        ]}
        action={
          <div className="flex items-center gap-1">
            {transitions.map((to) => (
              <form key={to} action={setEquipmentStatus} className="inline">
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="equipment_state" value={to} />
                <button
                  type="submit"
                  className={`rounded-md border border-[var(--p-border)] px-2.5 py-1 text-xs font-medium transition-colors ${
                    to === "retired"
                      ? "text-[color:var(--p-danger)] hover:bg-[color:var(--p-danger)]/10"
                      : "text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)]"
                  }`}
                >
                  {t(
                    "console.production.equipment.detail.markStatus",
                    { equipment_state: toTitle(to) },
                    `Mark ${toTitle(to)}`,
                  )}
                </button>
              </form>
            ))}
            <a href={`/console/production/equipment/${row.id}/qr`} className="ps-btn ps-btn--ghost ps-btn--sm">
              {t("console.production.equipment.detail.qr", undefined, "QR")}
            </a>
            <a href={`/console/production/equipment/${row.id}/edit`} className="ps-btn ps-btn--ghost ps-btn--sm">
              {t("common.edit", undefined, "Edit")}
            </a>
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        <section className="surface p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field
              label={t("console.production.equipment.detail.field.equipment_state", undefined, "Status")}
              value={<StatusBadge status={row.equipment_state} />}
            />
            <Field
              label={t("console.production.equipment.detail.field.category", undefined, "Category")}
              value={row.category ?? "—"}
            />
            <Field
              label={t("console.production.equipment.detail.field.assetTag", undefined, "Asset Tag")}
              value={row.asset_tag ?? "—"}
              mono
            />
            <Field
              label={t("console.production.equipment.detail.field.serial", undefined, "Serial")}
              value={row.serial ?? "—"}
              mono
            />
            <Field
              label={t("console.production.equipment.detail.field.dailyRate", undefined, "Daily Rate")}
              value={money(row.daily_rate_cents)}
              mono
            />
            <Field
              label={t("console.production.equipment.detail.field.created", undefined, "Created")}
              value={fmtDate(row.created_at)}
              mono
            />
          </div>
          {row.notes && (
            <div className="mt-4 border-t border-[var(--p-border)] pt-3 text-xs text-[var(--p-text-2)]">
              {row.notes}
            </div>
          )}
        </section>

        <section className="surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">
              {t("console.production.equipment.detail.ledger.title", undefined, "Movement Ledger")}
            </h2>
            <span className="font-mono text-xs text-[var(--p-text-2)]">
              {movements.length === 1
                ? t(
                    "console.production.equipment.detail.ledger.countOne",
                    { count: movements.length },
                    `${movements.length} recent transition`,
                  )
                : t(
                    "console.production.equipment.detail.ledger.countOther",
                    { count: movements.length },
                    `${movements.length} recent transitions`,
                  )}
            </span>
          </div>
          {movements.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "console.production.equipment.detail.ledger.empty",
                undefined,
                "No movements recorded yet. Every status change writes a row to the append-only ledger.",
              )}
            </p>
          ) : (
            <ol className="mt-3 space-y-2 text-xs">
              {movements.map((m) => {
                const who =
                  m.mover?.name ??
                  m.mover?.email ??
                  t("console.production.equipment.detail.ledger.system", undefined, "system");
                return (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-2 last:border-0"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      {m.from_state ? (
                        <>
                          <StatusBadge status={m.from_state} /> →{" "}
                        </>
                      ) : (
                        <Badge variant="muted">
                          {t("console.production.equipment.detail.ledger.initial", undefined, "initial")}
                        </Badge>
                      )}
                      <StatusBadge status={m.to_state} />
                      <span className="text-[var(--p-text-2)]">
                        {t("console.production.equipment.detail.ledger.by", { who }, `by ${who}`)}
                      </span>
                      {m.project?.name && <Badge variant="muted">{m.project.name}</Badge>}
                      {m.reason && <span className="text-[var(--p-text-2)]">— {m.reason}</span>}
                    </span>
                    <span className="font-mono text-[var(--p-text-2)]">{new Date(m.moved_at).toLocaleString()}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="surface p-4 text-xs">
          <div className="flex items-center justify-between">
            <Badge variant="muted">{t("console.production.equipment.detail.lifecycle", undefined, "Lifecycle")}</Badge>
            <DeleteForm
              action={deleteEquipment.bind(null, row.id)}
              confirm={t(
                "console.production.equipment.detail.deleteConfirm",
                undefined,
                "Retire and remove this equipment? It is soft-deleted and can be restored right after.",
              )}
              label={t("console.production.equipment.detail.retireRemove", undefined, "Retire & Remove")}
              undo={{ table: "equipment", id: row.id, redirectTo: "/console/production/equipment" }}
            />
          </div>
        </section>
      </div>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-[var(--p-text-2)] uppercase">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}
