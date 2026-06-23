"use client";

import * as React from "react";
import Link from "next/link";
import { ChartBar } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

/**
 * ATLVS-only Dashboards menu (ADR-0006 / ADR-0007).
 *
 * Surfaces the user's saved dashboards from `/studio/dashboards` as a
 * top-bar dropdown so they're never more than one click away. ADR-0006
 * pulled Dashboards out of the sidebar (was 9 TECHNOLOGY → Dashboards)
 * because the user's saved dashboards are workspace chrome — they
 * follow you across the console, not a destination you visit.
 *
 * Items are passed in pre-fetched from the layout's server component.
 * If no dashboards exist, the menu still renders the "All Dashboards"
 * link so the affordance is discoverable.
 */
export type DashboardEntry = { id: string; name: string; href: string };

export function DashboardsMenu({ entries }: { entries: DashboardEntry[] }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Dashboards"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--p-text-2)] hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
        >
          <ChartBar size={16} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-40 w-64 rounded-lg border border-[var(--p-border)] bg-[var(--p-bg)] p-1 shadow-lg"
        >
          {entries.length === 0 ? (
            <div className="px-2 py-1.5 text-[11px] text-[var(--p-text-2)]">No saved dashboards yet.</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {entries.map((d) => (
                <Link
                  key={d.id}
                  href={d.href}
                  className="block truncate rounded-md px-2 py-1.5 text-sm hover:bg-[var(--p-surface)]"
                >
                  {d.name}
                </Link>
              ))}
            </div>
          )}
          <div className="my-1 border-t border-[var(--p-border)]" />
          <Link href="/studio/dashboards" className="block rounded-md px-2 py-1.5 text-sm hover:bg-[var(--p-surface)]">
            All dashboards →
          </Link>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
