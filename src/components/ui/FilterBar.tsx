"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * FilterBar — a URL-backed facet strip for lists / boards / calendars. Each
 * facet is a labeled native select bound to a search param; changing it
 * rewrites the query string (shareable, server-filterable) and a "Clear"
 * resets all facets. Distinct from DataTable's client-only column filters: this
 * is a first-class, linkable filter (§9 — e.g. the Class × Phase coordinate
 * facet). Token-only colors.
 */
export type Facet = {
  param: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel?: string;
};

export function FilterBar({ facets, clearLabel = "Clear" }: { facets: Facet[]; clearLabel?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = (param: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(param, value);
    else next.delete(param);
    const qs = next.toString();
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
          onClick={() => router.replace(pathname)}
          className="text-xs font-medium text-[var(--p-accent)]"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}
