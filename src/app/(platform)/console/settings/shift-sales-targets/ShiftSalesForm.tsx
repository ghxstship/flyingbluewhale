"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

export function ShiftSalesForm({ orgId }: { orgId: string }) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const revenueUsd = parseFloat(fd.get("projected_revenue") as string);
    if (!revenueUsd || revenueUsd <= 0) {
      setError("Revenue must be a positive number");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/v1/shift-sales-targets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        org_id: orgId,
        shift_date: fd.get("shift_date"),
        schedule_name: fd.get("schedule_name") || null,
        projected_revenue_cents: Math.round(revenueUsd * 100),
        currency: "USD",
        notes: fd.get("notes") || null,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error?.message ?? "Failed to save");
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("console.settings.shiftSalesTargets.form.date", undefined, "Shift Date")}
          name="shift_date"
          type="date"
          required
        />
        <Input
          label={t("console.settings.shiftSalesTargets.form.revenue", undefined, "Projected Revenue (USD)")}
          name="projected_revenue"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="0.00"
        />
      </div>
      <Input
        label={t("console.settings.shiftSalesTargets.form.schedule", undefined, "Schedule name (optional)")}
        name="schedule_name"
        maxLength={120}
        placeholder={t("console.settings.shiftSalesTargets.form.schedulePlaceholder", undefined, "e.g. Main Bar, VIP Area")}
      />
      <Input
        label={t("console.settings.shiftSalesTargets.form.notes", undefined, "Notes (optional)")}
        name="notes"
        maxLength={500}
      />
      {error && <p className="text-xs text-[var(--c-error)]">{error}</p>}
      <Button type="submit" size="sm" disabled={loading}>
        {loading
          ? t("console.settings.shiftSalesTargets.form.saving", undefined, "Saving…")
          : t("console.settings.shiftSalesTargets.form.save", undefined, "Save Target")}
      </Button>
    </form>
  );
}
