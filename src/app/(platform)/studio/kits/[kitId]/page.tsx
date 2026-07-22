import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { getKit, formatCents, type KitZone, type KitLine, type KitTouchpoint, type KitPhaseGate } from "@/lib/kits/queries";

export const dynamic = "force-dynamic";

const GATE_STATE_VARIANT: Record<string, "success" | "warning" | "info" | "muted"> = {
  passed: "success",
  complete: "success",
  closed: "success",
  open: "info",
  active: "info",
  in_progress: "warning",
  blocked: "warning",
};

export default async function Page({ params }: { params: Promise<{ kitId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.kits.detail.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );

  const { kitId } = await params;
  const session = await requireSession();
  const kit = await getKit(session.orgId, kitId);
  if (!kit) notFound();

  const title = kit.pkg?.name ?? `${t("console.kits.kit", undefined, "Kit")} ${kit.kitId.slice(0, 8)}`;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.kits.detail.eyebrow", undefined, "Event Kit")}
        title={title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {kit.pkg?.kit_scale && <Badge variant="muted">{kit.pkg.kit_scale}</Badge>}
            <span className="font-mono text-xs">{kit.pkg?.code ?? kit.kitId.slice(0, 8)}</span>
            <span className="font-mono text-xs">
              {t(
                "console.kits.detail.totalEstimate",
                { amount: formatCents(kit.totalEstimateCents) },
                `${formatCents(kit.totalEstimateCents)} total`,
              )}
            </span>
          </span>
        }
      />
      <div className="page-content space-y-8">
        {kit.pkg?.description && (
          <section className="surface p-4 text-sm whitespace-pre-wrap">{kit.pkg.description}</section>
        )}

        <Section title={t("console.kits.detail.phaseGates", undefined, "Phase Gates")} count={kit.phaseGates.length}>
          {kit.phaseGates.length === 0 ? (
            <EmptyState size="compact" title={t("console.kits.detail.noPhaseGates", undefined, "No phase gates")} />
          ) : (
            <DataView<KitPhaseGate>
              rows={kit.phaseGates}
              searchable={false}
              columns={[
                {
                  key: "xpms_phase",
                  header: t("console.kits.detail.col.phase", undefined, "Phase"),
                  render: (r) => <Badge variant="muted">{r.xpms_phase}</Badge>,
                },
                {
                  key: "objective",
                  header: t("console.kits.detail.col.objective", undefined, "Objective"),
                  render: (r) => r.objective ?? "—",
                },
                {
                  key: "owner_role",
                  header: t("console.kits.detail.col.owner", undefined, "Owner"),
                  render: (r) => r.owner_role ?? "—",
                },
                {
                  key: "gate_state",
                  header: t("console.kits.detail.col.state", undefined, "State"),
                  render: (r) => (
                    <Badge variant={GATE_STATE_VARIANT[r.gate_state] ?? "muted"}>{r.gate_state}</Badge>
                  ),
                },
              ]}
            />
          )}
        </Section>

        <Section title={t("console.kits.detail.zones", undefined, "Zones")} count={kit.zones.length}>
          {kit.zones.length === 0 ? (
            <EmptyState size="compact" title={t("console.kits.detail.noZones", undefined, "No zones")} />
          ) : (
            <DataView<KitZone>
              rows={kit.zones}
              searchable={false}
              columns={[
                {
                  key: "zone_code",
                  header: t("console.kits.detail.col.code", undefined, "Code"),
                  render: (r) => r.zone_code,
                  mono: true,
                },
                {
                  key: "name",
                  header: t("console.kits.detail.col.name", undefined, "Name"),
                  render: (r) => r.name,
                },
                {
                  key: "dimensions",
                  header: t("console.kits.detail.col.dimensions", undefined, "Dimensions"),
                  render: (r) => r.dimensions ?? "—",
                },
                {
                  key: "capacity",
                  header: t("console.kits.detail.col.capacity", undefined, "Capacity"),
                  render: (r) => r.capacity ?? "—",
                  tabular: true,
                },
                {
                  key: "notes",
                  header: t("console.kits.detail.col.notes", undefined, "Notes"),
                  render: (r) => (
                    <span className="text-xs text-[var(--p-text-2)]">
                      {[r.power_notes, r.av_notes, r.loadin_notes].filter(Boolean).join(" · ") || "—"}
                    </span>
                  ),
                },
              ]}
            />
          )}
        </Section>

        <Section title={t("console.kits.detail.touchpoints", undefined, "Touchpoints")} count={kit.touchpoints.length}>
          {kit.touchpoints.length === 0 ? (
            <EmptyState size="compact" title={t("console.kits.detail.noTouchpoints", undefined, "No touchpoints")} />
          ) : (
            <DataView<KitTouchpoint>
              rows={kit.touchpoints}
              searchable={false}
              columns={[
                {
                  key: "sense",
                  header: t("console.kits.detail.col.sense", undefined, "Sense"),
                  render: (r) => <Badge variant="muted">{r.sense}</Badge>,
                },
                {
                  key: "design_intent",
                  header: t("console.kits.detail.col.designIntent", undefined, "Design Intent"),
                  render: (r) => r.design_intent,
                },
                {
                  key: "delivering_element",
                  header: t("console.kits.detail.col.deliveringElement", undefined, "Delivering Element"),
                  render: (r) => r.delivering_element ?? "—",
                },
              ]}
            />
          )}
        </Section>

        <Section title={t("console.kits.detail.lines", undefined, "Line Items")} count={kit.lines.length}>
          {kit.lines.length === 0 ? (
            <EmptyState size="compact" title={t("console.kits.detail.noLines", undefined, "No line items")} />
          ) : (
            <DataView<KitLine>
              rows={kit.lines}
              searchable={false}
              columns={[
                {
                  key: "item",
                  header: t("console.kits.detail.col.item", undefined, "Item"),
                  render: (r) => (
                    <span className="flex flex-col">
                      <span className="font-medium text-[var(--p-text-1)]">{r.item}</span>
                      <span className="text-[11px] text-[var(--p-text-2)]">
                        {[r.department, r.class].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  ),
                },
                {
                  key: "description",
                  header: t("console.kits.detail.col.description", undefined, "Description"),
                  render: (r) => <span className="text-xs text-[var(--p-text-2)]">{r.description ?? "—"}</span>,
                },
                {
                  key: "quantity",
                  header: t("console.kits.detail.col.qty", undefined, "Qty"),
                  render: (r) => r.quantity ?? "—",
                  tabular: true,
                  accessor: (r) => r.quantity,
                },
                {
                  key: "rate",
                  header: t("console.kits.detail.col.rate", undefined, "Rate"),
                  render: (r) => formatCents(r.rate_cents),
                  mono: true,
                  tabular: true,
                  accessor: (r) => r.rate_cents,
                },
                {
                  key: "estimate",
                  header: t("console.kits.detail.col.estimate", undefined, "Estimate"),
                  render: (r) => formatCents(r.estimate_cents),
                  mono: true,
                  tabular: true,
                  accessor: (r) => r.estimate_cents,
                  total: "sum",
                  totalFormat: { style: "money" },
                },
              ]}
            />
          )}
        </Section>
      </div>
    </>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-[var(--p-text-1)]">{title}</h2>
        <Badge variant="muted" shape="count">
          {count}
        </Badge>
      </div>
      {children}
    </section>
  );
}
