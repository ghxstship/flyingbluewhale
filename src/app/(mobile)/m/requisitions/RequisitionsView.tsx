"use client";

import Link from "next/link";
import { NormalizedList, KIcon, type FieldDef } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Purchase Requests — the viewer's own requisitions, migrated onto the kit
 * view engine (NormalizedList: search + View Options / Share & Export drawers +
 * list/table/board views). Status is the board column + row badge, never a
 * quick-filter pill (repo canon). The estimate is a sortable numeric field.
 * Rows are not tappable — there is no requisition detail route on the field
 * shell, matching the surface this replaces.
 */
export type RequisitionItem = {
  id: string;
  title: string;
  description: string | null;
  requisition_state: string;
  estimatedCents: number | null;
  estimatedLabel: string | null;
  createdLabel: string;
};

const STATE_TONE: Record<string, string> = {
  Draft: "text-3",
  Submitted: "warning",
  Approved: "success",
  Rejected: "danger",
  Ordered: "info",
};
const STATE_ORDER = ["Draft", "Submitted", "Approved", "Rejected", "Ordered"];

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`ps-badge ps-badge--${tone === "warning" ? "warn" : tone === "text-3" ? "neutral" : tone === "success" ? "ok" : tone}`}>{children}</span>;
}

export function RequisitionsView({ items }: { items: RequisitionItem[] }) {
  const t = useT();

  const stateLabel: Record<string, string> = {
    draft: t("m.reqs.state.draft", undefined, "Draft"),
    submitted: t("m.reqs.state.submitted", undefined, "Submitted"),
    approved: t("m.reqs.state.approved", undefined, "Approved"),
    rejected: t("m.reqs.state.rejected", undefined, "Rejected"),
    ordered: t("m.reqs.state.ordered", undefined, "Ordered"),
  };
  const stateOf = (x: RequisitionItem) => stateLabel[x.requisition_state] ?? x.requisition_state;

  const fields: FieldDef<RequisitionItem>[] = [
    { id: "title", label: t("m.reqs.col.title", undefined, "Request"), type: "text", get: (x) => x.title },
    { id: "requisition_state", label: t("m.reqs.col.status", undefined, "Status"), type: "select", options: STATE_ORDER, get: stateOf },
    { id: "estimate", label: t("m.reqs.col.estimate", undefined, "Estimate"), type: "num", get: (x) => x.estimatedCents ?? 0, cell: (x) => x.estimatedLabel ?? "—" },
  ];

  const row = (x: RequisitionItem) => (
    <div className="item" key={x.id} style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{x.title}</div>
          <div className="s">{[x.estimatedLabel, x.createdLabel].filter(Boolean).join(" · ")}</div>
        </div>
        <Badge tone={STATE_TONE[stateOf(x)] ?? "neutral"}>{stateOf(x)}</Badge>
      </div>
      {x.description ? (
        <p className="form-intro" style={{ margin: "8px 0 0" }}>
          {x.description}
        </p>
      ) : null}
    </div>
  );

  return (
    <NormalizedList
      k="requisitions"
      items={items}
      fields={fields}
      search={(x) => `${x.title} ${x.description ?? ""}`}
      searchPlaceholder={t("m.reqs.search", undefined, "Search requests…")}
      renderRow={row}
      views={["list", "table", "board"]}
      statusField="requisition_state"
      statusOrder={STATE_ORDER}
      boardTone={STATE_TONE}
      empty={{
        cols: [
          t("m.reqs.col.title", undefined, "Request"),
          t("m.reqs.col.status", undefined, "Status"),
          t("m.reqs.col.estimate", undefined, "Estimate"),
        ],
        title: t("m.reqs.emptyTitle", undefined, "Nothing Requested"),
        hint: t("m.reqs.emptyBody", undefined, "Need something bought for the job? Raise it here and your manager picks it up."),
      }}
      footer={
        <Link
          href="/m/requisitions/new"
          className="ps-btn ps-btn--cta ps-btn--lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 16, textDecoration: "none" }}
        >
          <KIcon name="Plus" size={16} /> {t("m.reqs.new", undefined, "Request A Purchase")}
        </Link>
      }
    />
  );
}
