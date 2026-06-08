"use client";

import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createReqAction } from "../actions";
import { AiParsePanel } from "./AiParsePanel";

type ParseResult = {
  title: string;
  description: string;
  estimated_cents: number | null;
  vendor_name: string | null;
  line_items: Array<{ description: string; quantity: number; unit_price_cents: number }>;
};

export function NewReqForm() {
  const t = useT();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimated, setEstimated] = useState("");

  function onParsed(result: ParseResult) {
    setTitle(result.title ?? "");
    const lines = result.line_items
      ?.map((l) => `${l.description} (×${l.quantity}) — $${(l.unit_price_cents / 100).toFixed(2)}`)
      .join("\n");
    const vendor = result.vendor_name ? `Vendor: ${result.vendor_name}\n\n` : "";
    setDescription(vendor + (result.description ?? "") + (lines ? `\n\nLine items:\n${lines}` : ""));
    if (result.estimated_cents != null) {
      setEstimated((result.estimated_cents / 100).toFixed(2));
    }
  }

  return (
    <div className="space-y-4">
      <AiParsePanel onParsed={onParsed} />
      <FormShell
        action={createReqAction}
        cancelHref="/console/procurement/requisitions"
        submitLabel={t("console.procurement.requisitions.new.submit", undefined, "Create Requisition")}
      >
        <Input
          label={t("console.procurement.requisitions.new.title", undefined, "Title")}
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.procurement.requisitions.new.description", undefined, "Description")}
          </label>
          <textarea
            name="description"
            rows={4}
            className="ps-input mt-1.5 w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Input
          label={t("console.procurement.requisitions.new.estimatedCost", undefined, "Estimated Cost — USD")}
          name="estimated"
          type="number"
          step="0.01"
          value={estimated}
          onChange={(e) => setEstimated(e.target.value)}
        />
      </FormShell>
    </div>
  );
}
