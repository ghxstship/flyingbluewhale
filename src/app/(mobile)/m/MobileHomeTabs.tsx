"use client";

import * as React from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/LocaleProvider";

type Tile = { href: string; label: string; sub: string };

/**
 * Three-section client switcher for the mobile home page. Section state
 * is local — the URL stays at `/m` because this is a single-page tabbed
 * surface (mirrors iOS HIG bottom-tab + section pattern). Tools and
 * Reports sections house the 17 surfaces that previously had no anchor.
 */
export function MobileHomeTabs({ today, tools, reports }: { today: Tile[]; tools: Tile[]; reports: Tile[] }) {
  const t = useT();
  const [active, setActive] = React.useState<"today" | "tools" | "reports">("today");
  const tiles = active === "today" ? today : active === "tools" ? tools : reports;

  return (
    <>
      <div
        role="tablist"
        aria-label={t("m.home.tabs.ariaLabel", undefined, "Mobile home sections")}
        className="mt-5 inline-flex w-full items-center gap-0.5 rounded-md border border-[var(--p-border)] bg-[var(--p-surface-2)] p-0.5"
      >
        {(
          [
            ["today", t("m.home.tabs.today", undefined, "Today"), today.length],
            ["tools", t("m.home.tabs.tools", undefined, "Tools"), tools.length],
            ["reports", t("m.home.tabs.reports", undefined, "Reports"), reports.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active === key}
            onClick={() => setActive(key)}
            className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-color)] ${
              active === key
                ? "bg-[var(--p-surface)] text-[var(--p-text-1)] shadow-sm"
                : "text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
            }`}
          >
            {label}
            <span className="ms-1.5 text-[10px] text-[var(--p-text-2)]">{count}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="card p-4">
            <div className="text-label">{tile.label}</div>
            <div className="text-mono mt-1 text-xs text-[var(--color-text-tertiary)]">{tile.sub}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
