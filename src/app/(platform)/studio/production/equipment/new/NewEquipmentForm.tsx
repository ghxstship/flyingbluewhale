"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createEquipmentAction } from "../actions";

export function NewEquipmentForm() {
  const t = useT();
  return (
    <FormShell
      action={createEquipmentAction}
      cancelHref="/studio/production/equipment"
      submitLabel={t("console.production.equipment.new.submit", undefined, "Add Equipment")}
    >
      <Input label={t("console.production.equipment.new.name", undefined, "Name")} name="name" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.production.equipment.new.category", undefined, "Category")}
          name="category"
          placeholder={t("console.production.equipment.new.categoryPlaceholder", undefined, "Lighting, audio, video…")}
        />
        <Input label={t("console.production.equipment.new.assetTag", undefined, "Asset Tag")} name="asset_tag" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("console.production.equipment.new.serial", undefined, "Serial")} name="serial" />
        <Input
          label={t("console.production.equipment.new.dailyRate", undefined, "Daily Rate — USD")}
          name="daily_rate"
          type="number"
          step="0.01"
        />
      </div>
    </FormShell>
  );
}
