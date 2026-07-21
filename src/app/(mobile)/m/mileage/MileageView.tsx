"use client";

import Link from "next/link";
import { NormalizedList, KIcon, type FieldDef } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Mileage — the drives the viewer has logged, migrated onto the kit view
 * engine. The table is the natural default (numeric miles + reimbursement);
 * calendar keys off `logged_on`. Mileage has no lifecycle state, so there is
 * no board and no status field — and no quick-filter pill (repo canon). The
 * reimbursement is derived (miles × rate), never a stored per-row input.
 */
export type MileageItem = {
  id: string;
  origin: string;
  destination: string;
  route: string;
  miles: number;
  milesLabel: string;
  loggedIso: string | null;
  dateLabel: string;
  valueLabel: string;
  notes: string | null;
};

export function MileageView({ items }: { items: MileageItem[] }) {
  const t = useT();

  const fields: FieldDef<MileageItem>[] = [
    { id: "route", label: t("m.mileage.col.route", undefined, "Trip"), type: "text", get: (x) => x.route },
    { id: "miles", label: t("m.mileage.col.miles", undefined, "Miles"), type: "num", get: (x) => x.miles, cell: (x) => x.milesLabel },
    { id: "date", label: t("m.mileage.col.date", undefined, "Date"), type: "date", get: (x) => x.dateLabel, iso: (x) => x.loggedIso },
    { id: "value", label: t("m.mileage.col.value", undefined, "Reimbursement"), type: "text", get: (x) => x.valueLabel },
  ];

  const row = (x: MileageItem) => (
    <div className="item" key={x.id} style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <KIcon name="Truck" size={18} style={{ color: "var(--p-text-2)", flex: "none", marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">
            {x.origin} → {x.destination}
          </div>
          <div className="s">
            {x.milesLabel} mi · {x.dateLabel}
          </div>
        </div>
        <span className="ps-badge ps-badge--neutral">{x.valueLabel}</span>
      </div>
      {x.notes ? (
        <p className="form-intro" style={{ margin: "8px 0 0" }}>
          {x.notes}
        </p>
      ) : null}
    </div>
  );

  return (
    <NormalizedList
      k="mileage"
      items={items}
      fields={fields}
      search={(x) => `${x.origin} ${x.destination} ${x.notes ?? ""}`}
      searchPlaceholder={t("m.mileage.search", undefined, "Search drives…")}
      renderRow={row}
      views={["table", "list", "calendar"]}
      initialView="table"
      dateField="date"
      empty={{
        cols: [
          t("m.mileage.col.route", undefined, "Trip"),
          t("m.mileage.col.miles", undefined, "Miles"),
          t("m.mileage.col.date", undefined, "Date"),
        ],
        title: t("m.mileage.emptyTitle", undefined, "No Drives Logged"),
        hint: t("m.mileage.emptyBody", undefined, "Log a trip while you remember it. Your manager approves it later."),
      }}
      footer={
        <Link
          href="/m/mileage/new"
          className="ps-btn ps-btn--cta ps-btn--lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 16, textDecoration: "none" }}
        >
          <KIcon name="Plus" size={16} /> {t("m.mileage.new", undefined, "Log A Drive")}
        </Link>
      }
    />
  );
}
