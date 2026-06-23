"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createReservation } from "../actions";

export type TableOption = {
  id: string;
  table_no: string;
  seats: number;
  zone: string | null;
};

export function NewReservationForm({
  tables,
  defaultTableId,
}: {
  tables: TableOption[];
  defaultTableId: string;
}) {
  const t = useT();
  return (
    <FormShell
      action={createReservation}
      cancelHref="/studio/operations/reservations"
      submitLabel={t("console.reservations.new.submit", undefined, "Create Reservation")}
    >
      <Input
        label={t("console.reservations.new.guest", undefined, "Guest name")}
        name="guest_name"
        required
        maxLength={120}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.reservations.new.party", undefined, "Party size")}
          name="party_size"
          type="number"
          min={1}
          max={100}
          defaultValue={2}
          required
        />
        <Input
          label={t("console.reservations.new.reservedFor", undefined, "Reserved for")}
          name="reserved_for"
          type="datetime-local"
          required
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="res-table">
          {t("console.reservations.new.table", undefined, "Table")}
        </label>
        <select
          id="res-table"
          name="table_id"
          defaultValue={defaultTableId}
          className="ps-input mt-1.5 w-full"
        >
          <option value="">{t("console.reservations.new.tableUnassigned", undefined, "Unassigned")}</option>
          {tables.map((tbl) => (
            <option key={tbl.id} value={tbl.id}>
              {tbl.zone ? `${tbl.table_no} · ${tbl.zone} · ${tbl.seats} seats` : `${tbl.table_no} · ${tbl.seats} seats`}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("console.reservations.new.phone", undefined, "Contact phone")} name="contact_phone" />
        <Input
          label={t("console.reservations.new.email", undefined, "Contact email")}
          name="contact_email"
          type="email"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="res-notes">
          {t("console.reservations.new.notes", undefined, "Notes")}
        </label>
        <textarea id="res-notes" name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
