"use client";

import * as React from "react";
import Link from "next/link";

type Tile = { href: string; label: string; sub: string };

/**
 * Three-section client switcher for the mobile home page. Section state
 * is local — the URL stays at `/m` because this is a single-page tabbed
 * surface (mirrors iOS HIG bottom-tab + section pattern). Tools and
 * Reports sections house the 17 surfaces that previously had no anchor.
 */
export function MobileHomeTabs({ today, tools, reports }: { today: Tile[]; tools: Tile[]; reports: Tile[] }) {
  const [active, setActive] = React.useState<"today" | "tools" | "reports">("today");
  const tiles = active === "today" ? today : active === "tools" ? tools : reports;

  return (
    <>
      <div
        role="tablist"
        aria-label="Mobile home sections"
        className="mt-5 inline-flex w-full items-center gap-0.5 rounded-md border border-[var(--border-color)] bg-[var(--surface-inset)] p-0.5"
      >
        {(
          [
            ["today", "Today", today.length],
            ["tools", "Tools", tools.length],
            ["reports", "Reports", reports.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active === key}
            onClick={() => setActive(key)}
            className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--org-primary)] ${
              active === key
                ? "bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {label}
            <span className="ml-1.5 text-[10px] text-[var(--text-muted)]">{count}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="surface hover-lift p-4">
            <div className="text-xs font-semibold tracking-wider uppercase">{t.label}</div>
            <div className="font-mono mt-1 text-xs text-[var(--text-muted)]">{t.sub}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
