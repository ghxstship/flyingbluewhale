"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Print/PDF affordance for the composed day sheet (kit 26: "renders to PDF").
 * Same window.print idiom as DocToolbar/ReportToolbar — the sheet page is
 * server-rendered and print-clean; only this control is client state.
 */
export function DaySheetPrintButton() {
  const t = useT();
  return (
    <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
      {t("console.daySheets.detail.print", undefined, "Print / PDF")}
    </Button>
  );
}
