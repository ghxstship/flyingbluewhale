"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Tab state persisted in the URL so the page is shareable + back-button
 * friendly. Replaces ad-hoc `useState<string>("overview")` in tabbed
 * detail pages. See docs/ia/02-navigation-redesign.md §3.6 + §7 #7.
 *
 *   const [tab, setTab] = useTabParam("tab", "overview");
 *   <Tabs value={tab} onValueChange={setTab}>...</Tabs>
 *
 * - Uses `router.replace` (not `push`) so tab changes don't pile up in
 *   history — Linear + Stripe Dashboard convention.
 * - Scroll preserved: `scroll: false` on the replace.
 * - Default value is stripped from the URL (kept clean).
 */
export function useTabParam(key: string = "tab", defaultValue: string): [string, (next: string) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const current = params.get(key) ?? defaultValue;

  const setTab = React.useCallback(
    (next: string) => {
      const url = new URL(window.location.href);
      if (next === defaultValue) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, next);
      }
      const qs = url.searchParams.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, key, defaultValue],
  );

  return [current, setTab];
}
