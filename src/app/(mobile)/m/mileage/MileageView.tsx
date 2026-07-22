"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NormalizedList, KIcon, RecordDetail, FormScreen, type FieldDef, type FormDef } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { toFormData } from "@/lib/mobile/form-data";
import { updateMileage, deleteMileage, type State } from "./actions";

/**
 * Mileage — the drives the viewer has logged, on the kit view engine. The
 * table is the natural default (numeric miles + reimbursement); calendar keys
 * off `logged_on`. Mileage has no lifecycle state, so there is no board and no
 * status field — and no quick-filter pill (repo canon). The reimbursement is
 * derived (miles × rate), never a stored per-row input.
 *
 * A row opens its record, where the owner can correct or remove the drive:
 * mileage was create-only, so a mistyped distance was permanent and the only
 * "fix" was a second entry that double-counts the claim.
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
  const router = useRouter();
  const toast = useToast();
  const [detail, setDetail] = useState<MileageItem | null>(null);
  const [editing, setEditing] = useState<MileageItem | null>(null);
  const [, startTx] = useTransition();

  const fields: FieldDef<MileageItem>[] = [
    { id: "route", label: t("m.mileage.col.route", undefined, "Trip"), type: "text", get: (x) => x.route },
    { id: "miles", label: t("m.mileage.col.miles", undefined, "Miles"), type: "num", get: (x) => x.miles, cell: (x) => x.milesLabel },
    { id: "date", label: t("m.mileage.col.date", undefined, "Date"), type: "date", get: (x) => x.dateLabel, iso: (x) => x.loggedIso },
    { id: "value", label: t("m.mileage.col.value", undefined, "Reimbursement"), type: "text", get: (x) => x.valueLabel },
  ];

  const editForm: FormDef = {
    title: t("m.mileage.edit", undefined, "Edit Drive"),
    icon: "Truck",
    submit: t("m.mileage.save", undefined, "Save Changes"),
    fields: [
      { id: "origin", label: t("m.mileage.from", undefined, "From"), type: "text", required: true },
      { id: "destination", label: t("m.mileage.to", undefined, "To"), type: "text", required: true },
      { id: "miles", label: t("m.mileage.col.miles", undefined, "Miles"), type: "number", half: true, required: true },
      { id: "logged_on", label: t("m.mileage.col.date", undefined, "Date"), type: "date", half: true, required: true },
      { id: "notes", label: t("m.mileage.notes", undefined, "Notes"), type: "textarea" },
    ],
  };

  const onEditSubmit = (_def: FormDef, vals: Record<string, unknown>) => {
    const target = editing;
    if (!target) return;
    startTx(async () => {
      const res: State = await updateMileage(
        null,
        toFormData({
          id: target.id,
          origin: vals.origin ?? "",
          destination: vals.destination ?? "",
          miles: String(vals.miles ?? ""),
          logged_on: vals.logged_on ?? "",
          notes: vals.notes ?? "",
        }),
      );
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setEditing(null);
      setDetail(null);
      router.refresh();
    });
  };

  const onDelete = (x: MileageItem) => {
    startTx(async () => {
      const res: State = await deleteMileage(null, toFormData({ id: x.id }));
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setDetail(null);
      router.refresh();
    });
  };

  const row = (x: MileageItem) => (
    <div
      className="item tap"
      key={x.id}
      style={{ display: "block" }}
      role="button"
      tabIndex={0}
      onClick={() => setDetail(x)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetail(x); } }}
    >
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

  if (editing) {
    return (
      <FormScreen
        def={editForm}
        initial={{
          origin: editing.origin,
          destination: editing.destination,
          miles: editing.miles,
          logged_on: editing.loggedIso ?? "",
          notes: editing.notes ?? "",
        }}
        onClose={() => setEditing(null)}
        onSubmit={onEditSubmit}
      />
    );
  }

  return (
    <>
      <NormalizedList
        k="mileage"
        items={items}
        fields={fields}
        search={(x) => `${x.origin} ${x.destination} ${x.notes ?? ""}`}
        searchPlaceholder={t("m.mileage.search", undefined, "Search drives…")}
        renderRow={row}
        onRow={setDetail}
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

      {detail && (
        <RecordDetail
          title={`${detail.origin} → ${detail.destination}`}
          icon="Truck"
          fields={[
            { k: t("m.mileage.col.miles", undefined, "Miles"), v: detail.milesLabel },
            { k: t("m.mileage.col.date", undefined, "Date"), v: detail.dateLabel },
            { k: t("m.mileage.col.value", undefined, "Reimbursement"), v: detail.valueLabel },
            ...(detail.notes ? [{ k: t("m.mileage.notes", undefined, "Notes"), v: detail.notes, full: true }] : []),
          ]}
          actions={[
            { label: t("m.mileage.edit", undefined, "Edit Drive"), icon: "Pencil", primary: true, on: () => setEditing(detail) },
            {
              label: t("m.mileage.delete", undefined, "Remove Drive"),
              icon: "Trash2",
              danger: true,
              confirmText: t("m.mileage.deleteConfirm", undefined, "Remove this drive? The claim goes with it."),
              on: () => onDelete(detail),
            },
          ]}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
