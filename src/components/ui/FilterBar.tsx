"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAnnounce } from "@/components/ui/LiveRegion";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * FilterBar — a URL-backed facet strip for lists / boards / calendars. Each
 * facet is a labeled native select bound to a search param; changing it
 * rewrites the query string (shareable, server-filterable) and a "Clear"
 * resets all facets. Distinct from DataTable's client-only column filters: this
 * is a first-class, linkable filter (§9 — e.g. the Class × Phase coordinate
 * facet). Token-only colors.
 *
 * A11y (F-23): applying a facet announces the new result count (when the host
 * page passes `resultCount`) through the shared polite live region, so screen
 * reader users hear the effect of the filter they just applied.
 */
export type Facet = {
  param: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel?: string;
};

export function FilterBar({
  facets,
  clearLabel = "Clear",
  resultCount,
}: {
  facets: Facet[];
  clearLabel?: string;
  /** Number of rows the current filter state yields — announced to AT after
   *  each facet change. Re-rendered by the server on every URL rewrite. */
  resultCount?: number;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const announce = useAnnounce();

  // Announce once per user interaction, after the server round-trip lands the
  // new count (the prop changes when the filtered page re-renders).
  const interacted = React.useRef(false);
  React.useEffect(() => {
    if (!interacted.current) return;
    interacted.current = false;
    announce(
      typeof resultCount === "number"
        ? t("filterBar.results", { count: resultCount }, `${resultCount} results`)
        : t("filterBar.updated", undefined, "Filters updated"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultCount, params]);

  const setParam = (param: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(param, value);
    else next.delete(param);
    const qs = next.toString();
    interacted.current = true;
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const anyActive = facets.some((f) => params.get(f.param));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {facets.map((f) => (
        <label key={f.param} className="inline-flex items-center gap-2 text-xs text-[var(--p-text-2)]">
          <span className="font-medium">{f.label}</span>
          <select
            className="ps-input ps-input--sm"
            value={params.get(f.param) ?? ""}
            onChange={(e) => setParam(f.param, e.target.value)}
          >
            <option value="">{f.allLabel ?? `All ${f.label.toLowerCase()}`}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      {anyActive && (
        <button
          type="button"
          onClick={() => {
            interacted.current = true;
            router.replace(pathname);
          }}
          className="text-xs font-medium text-[var(--p-accent)]"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}
