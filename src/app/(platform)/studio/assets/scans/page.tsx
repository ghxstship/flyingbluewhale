import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

/**
 * Scan Sessions — the org-wide view of the `asset_movements` ledger
 * (LDP §3, append-only). Every check-out, check-in, transfer, and scan
 * writes one row; COMPVSS field scans land here too. Nothing on this page
 * is editable by design — the ledger's RLS forbids update/delete.
 */
export default async function Page() {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  const title = t("console.assets.scans.title", undefined, "Scan Sessions");
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={title} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.assets.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );

  const session = await requireSession();
  const supabase = await createClient();
  // asset_movements carries no org_id — join through the (org-scoped) asset.
  const { data: movementRows } = await supabase
    .from("asset_movements")
    .select(
      "id, asset_id, movement_kind, from_state, to_state, occurred_at, notes, asset:assets!inner(id, org_id, display_name, asset_tag)",
    )
    .eq("asset.org_id", session.orgId)
    .order("occurred_at", { ascending: false })
    .limit(200);
  type MovementRow = {
    id: string;
    asset_id: string;
    movement_kind: string;
    from_state: string | null;
    to_state: string;
    occurred_at: string;
    notes: string | null;
    asset: { id: string; org_id: string; display_name: string; asset_tag: string | null };
  };
  const movements = (movementRows ?? []) as unknown as MovementRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.eyebrow", undefined, "Production · Build")}
        title={title}
        subtitle={t(
          "console.assets.scans.subtitle",
          { count: movements.length },
          `${movements.length} Recent Movements · Append-Only Chain Of Custody`,
        )}
      />
      <div className="page-content space-y-5">
        {movements.length === 0 ? (
          <EmptyState
            title={t("console.assets.scans.emptyTitle", undefined, "No movements recorded yet")}
            description={t(
              "console.assets.scans.emptyDescription",
              undefined,
              "Every check-out, check-in, and transfer writes a ledger row. Scan from the field on COMPVSS or transition an asset from its detail page.",
            )}
            action={
              <a className="ps-btn ps-btn--sm" href={urlFor("mobile", "/inventory/scan")}>
                {t("console.assets.scans.emptyAction", undefined, "Open Mobile Scanner")}
              </a>
            }
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-start">{t("console.assets.scans.columns.asset", undefined, "Asset")}</th>
                  <th className="text-start">{t("console.assets.scans.columns.kind", undefined, "Movement")}</th>
                  <th className="text-start">
                    {t("console.assets.scans.columns.transition", undefined, "Transition")}
                  </th>
                  <th className="text-end">{t("console.assets.scans.columns.when", undefined, "When")}</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <a className="font-medium hover:underline" href={`/studio/assets/${m.asset_id}`}>
                        {m.asset.display_name}
                      </a>
                      {m.asset.asset_tag && (
                        <span className="ms-2 font-mono text-xs text-[var(--p-text-2)]">{m.asset.asset_tag}</span>
                      )}
                    </td>
                    <td>
                      <Badge variant="muted">{toTitle(m.movement_kind)}</Badge>
                    </td>
                    <td>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs">
                        {m.from_state ? <StatusBadge status={m.from_state} /> : <Badge variant="muted">—</Badge>}
                        <span aria-hidden>→</span>
                        <StatusBadge status={m.to_state} />
                      </span>
                    </td>
                    <td className="text-end font-mono text-xs">{fmt.dateTime(new Date(m.occurred_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
