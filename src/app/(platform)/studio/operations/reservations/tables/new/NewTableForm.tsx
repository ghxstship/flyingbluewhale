"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { VENUE_TABLE_STATES, VENUE_TABLE_STATE_LABELS } from "@/lib/reservations";
import { createVenueTable } from "../actions";

export function NewTableForm() {
  const t = useT();
  return (
    <FormShell
      action={createVenueTable}
      cancelHref="/studio/operations/reservations"
      submitLabel={t("console.reservations.tables.new.submit", undefined, "Create Table")}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.reservations.tables.new.tableNo", undefined, "Table number")}
          name="table_no"
          required
          maxLength={40}
        />
        <Input
          label={t("console.reservations.tables.new.seats", undefined, "Seats")}
          name="seats"
          type="number"
          min={1}
          max={100}
          defaultValue={2}
          required
        />
      </div>
      <Input label={t("console.reservations.tables.new.zone", undefined, "Zone")} name="zone" maxLength={80} />
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="table-state">
          {t("console.reservations.tables.new.state", undefined, "State")}
        </label>
        <select id="table-state" name="table_state" defaultValue="available" className="ps-input mt-1.5 w-full">
          {VENUE_TABLE_STATES.map((s) => (
            <option key={s} value={s}>
              {VENUE_TABLE_STATE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.reservations.tables.new.x", undefined, "Floor-plan X (0-100)")}
          name="x"
          type="number"
          min={0}
          max={100}
          step={0.1}
          defaultValue={50}
        />
        <Input
          label={t("console.reservations.tables.new.y", undefined, "Floor-plan Y (0-60)")}
          name="y"
          type="number"
          min={0}
          max={60}
          step={0.1}
          defaultValue={30}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="table-notes">
          {t("console.reservations.tables.new.notes", undefined, "Notes")}
        </label>
        <textarea id="table-notes" name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
