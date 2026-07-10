"use client";

import { useRouter, usePathname } from "next/navigation";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Record picker for a record-bindable doc type — a Combobox over the doc
 * type's backing table (org-scoped, resolved server-side and passed in as
 * options). Selecting a record navigates to `?recordId=<id>`, the same
 * binding path the public API uses; clearing returns to the sample showcase.
 */
export function RecordPicker({ options, value }: { options: ComboboxOption[]; value?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();

  return (
    <div className="flex items-center gap-2">
      <Combobox
        options={options}
        value={value ?? null}
        onChange={(v) => router.push(`${pathname}?recordId=${encodeURIComponent(v)}`)}
        placeholder={t("console.documents.recordPicker.placeholder", undefined, "Bind a record…")}
        searchPlaceholder={t("console.documents.recordPicker.search", undefined, "Search records…")}
        emptyLabel={t("console.documents.recordPicker.empty", undefined, "No records found")}
        aria-label={t("console.documents.recordPicker.aria", undefined, "Bind a record to this document")}
        className="min-w-64"
      />
      {value && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="text-xs text-[var(--p-text-2)] hover:text-[var(--p-text-1)] hover:underline"
        >
          {t("console.documents.recordPicker.clear", undefined, "Clear")}
        </button>
      )}
    </div>
  );
}
