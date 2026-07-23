import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRequestT } from "@/lib/i18n/request";
import { buildPositionForest, type ChartPosition, type PositionNode } from "./org-chart";

/**
 * Org-chart view (Organization pillar) — a pure-HTML/CSS tree, no chart lib.
 * Nesting is native `<details>/<summary>` (collapsible without a client
 * island); connectors are `--p-*` borders, the same treatment as the kit-30
 * roster reporting tree. Department chips are neutral (there is no
 * department -> airport-tone mapping; CATEGORY_TONE is signage-only).
 */

export type ChartPositionRow = ChartPosition & { active: boolean };

export type SeatHolder = { assignmentId: string; name: string };

export async function OrgChartView({
  positions,
  holdersByPosition,
  labelByCode,
}: {
  positions: ChartPositionRow[];
  holdersByPosition: Map<string, SeatHolder[]>;
  labelByCode: Map<string, string>;
}) {
  const { t } = await getRequestT();
  const { roots, edgeCount } = buildPositionForest(positions);

  const nodeCard = (node: PositionNode<ChartPositionRow>): ReactNode => {
    const p = node.position;
    const holders = holdersByPosition.get(p.id) ?? [];
    const openSeats = Math.max(0, p.seat_count - holders.length);
    return (
      <div className="surface flex flex-wrap items-center gap-x-3 gap-y-1 p-3">
        <div className="min-w-0">
          <Link
            href={`/legend/hub/organization/${p.id}`}
            className="text-sm font-medium text-[var(--p-text-1)] hover:underline"
          >
            {p.title}
          </Link>
          {!p.active && (
            <span className="ml-2 align-middle">
              <Badge variant="muted">{t("console.legend.hub.organization.archived", undefined, "Archived")}</Badge>
            </span>
          )}
          <div className="text-xs text-[var(--p-text-2)]">
            {holders.length > 0
              ? holders.map((h) => h.name).join(", ")
              : t("console.legend.hub.organization.chart.vacant", undefined, "Vacant")}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {p.department_code && (
            <Badge variant="muted">
              {p.department_code} · {labelByCode.get(p.department_code) ?? p.department_code}
            </Badge>
          )}
          {openSeats > 0 ? (
            <Badge variant="warning">
              {openSeats === 1
                ? t("console.legend.hub.organization.chart.oneOpenSeat", undefined, "1 open seat")
                : t("console.legend.hub.organization.chart.nOpenSeats", { count: openSeats }, `${openSeats} open seats`)}
            </Badge>
          ) : (
            <Badge variant="success">
              {t("console.legend.hub.organization.chart.staffed", undefined, "Staffed")}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  const renderNode = (node: PositionNode<ChartPositionRow>): ReactNode => {
    const p = node.position;
    if (node.children.length === 0) {
      return (
        <div key={p.id} className="mb-2">
          {nodeCard(node)}
        </div>
      );
    }
    return (
      <details key={p.id} open className="mb-2">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">{nodeCard(node)}</summary>
        <div className="mt-2 ml-5 border-l-2 border-[var(--p-border)] pl-3">
          {node.children.map((c) => renderNode(c))}
        </div>
      </details>
    );
  };

  if (positions.length === 0) {
    return (
      <EmptyState
        title={t("console.legend.hub.organization.emptyTitle", undefined, "No positions yet")}
        description={t(
          "console.legend.hub.organization.chart.emptyDescription",
          undefined,
          "The org chart draws itself from the position library. Create the first position to get started.",
        )}
        action={
          <Button href="/legend/hub/organization/new">
            {t("console.legend.hub.organization.newPosition", undefined, "+ New Position")}
          </Button>
        }
      />
    );
  }

  if (edgeCount === 0) {
    // Flat org: no reporting edges yet. Teach the first action, then list
    // every position flat so nothing is hidden behind the empty state.
    return (
      <div className="space-y-6">
        <EmptyState
          title={t("console.legend.hub.organization.chart.flatTitle", undefined, "No reporting lines yet")}
          description={t(
            "console.legend.hub.organization.chart.flatDescription",
            undefined,
            "Open a position and set who it reports to. The chart builds itself one line at a time.",
          )}
        />
        <div>{roots.map((r) => renderNode(r))}</div>
      </div>
    );
  }

  return <div>{roots.map((r) => renderNode(r))}</div>;
}
