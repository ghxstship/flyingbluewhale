"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutGrid, Check } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

/**
 * Cross-shell app switcher (ADR-0007).
 *
 * Lists the three shells the user has access to with their canonical
 * URLs (computed server-side via `urlFor()` and passed in as props).
 * Current shell is checkmarked. Click jumps to the corresponding root.
 *
 * Capability filtering happens at the layout level — if a user lacks
 * access to a shell, the layout omits that entry from `entries`.
 * The switcher is purely presentational.
 *
 * Brand accent dots mirror the sub-product palette per CLAUDE.md:
 *   ATLVS = red, GVTEWAY = blue, COMPVSS = yellow.
 */
export type AppSwitcherEntry = {
  shell: "platform" | "portal" | "mobile";
  label: string;
  href: string;
};

const ACCENT: Record<AppSwitcherEntry["shell"], string> = {
  platform: "bg-red-500",
  portal: "bg-blue-500",
  mobile: "bg-yellow-400",
};

export function AppSwitcher({ current, entries }: { current: AppSwitcherEntry["shell"]; entries: AppSwitcherEntry[] }) {
  // Single-app users get no chrome — no point in a switcher with one row.
  if (entries.length <= 1) return null;
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Switch app"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--p-text-2)] hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
        >
          <LayoutGrid size={16} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-40 w-56 rounded-lg border border-[var(--p-border)] bg-[var(--p-bg)] p-1 shadow-lg"
        >
          {entries.map((e) => {
            const active = e.shell === current;
            return (
              <Link
                key={e.shell}
                href={e.href}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--p-surface)]"
              >
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${ACCENT[e.shell]}`} />
                <span className="flex-1">{e.label}</span>
                {active ? <Check size={14} aria-hidden="true" className="text-[var(--p-text-2)]" /> : null}
              </Link>
            );
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
