"use client";

import * as React from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { useT } from "@/lib/i18n/LocaleProvider";

export function LocationPickerDemo() {
  const t = useT();
  const [value, setValue] = React.useState<string | null>(null);

  const loader = React.useCallback(async (query: string): Promise<ComboboxOption[]> => {
    const r = await fetch(`/api/v1/locations?q=${encodeURIComponent(query)}`);
    if (!r.ok) return [];
    const json = (await r.json()) as {
      ok: boolean;
      data?: { locations: { id: string; name: string; secondary: string }[] };
    };
    return (json.data?.locations ?? []).map((l) => ({
      value: l.id,
      label: l.name,
      keywords: l.secondary ? [l.secondary] : [],
    }));
  }, []);

  return (
    <div className="surface space-y-2 p-5">
      <div className="text-xs font-medium tracking-[0.18em] text-[var(--text-muted)] uppercase">
        {t("console.locations.picker.tryIt", undefined, "Try it")}
      </div>
      <Combobox
        optionsLoader={loader}
        value={value}
        onChange={setValue}
        placeholder={t("console.locations.picker.searchPlaceholder", undefined, "Search locations…")}
        searchPlaceholder={t("console.locations.picker.typeToSearch", undefined, "Type to search…")}
      />
      {value && (
        <div className="text-xs text-[var(--text-muted)]">
          {t("console.locations.picker.selectedLabel", undefined, "Selected:")}{" "}
          <span className="font-mono">{value}</span>
        </div>
      )}
    </div>
  );
}
