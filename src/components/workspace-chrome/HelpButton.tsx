"use client";

import * as React from "react";
import Link from "next/link";
import { HelpCircle, BookOpen, Sparkles, Activity, LifeBuoy, Compass } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { LATEST_RELEASE_VERSION, getSeenVersion } from "@/lib/help/whats-new";
import { startConsoleTour } from "@/lib/help/console-tour";
import { Hint } from "@/components/ui/Tooltip";

/**
 * `?` Help affordance (ADR-0007; kit 21 W6).
 *
 * Opens a popover into the console Help surfaces: the workspace Knowledge
 * Base, What's New, System Status, and Contact Support. Carries an unread dot
 * on the icon + a highlight on What's New until the operator opens the
 * changelog (persisted per-browser via localStorage).
 */
export function HelpButton({ knowledgeUrl = "/studio/knowledge" }: { knowledgeUrl?: string }) {
  const [unseen, setUnseen] = React.useState(false);

  React.useEffect(() => {
    const check = () => setUnseen(getSeenVersion() !== LATEST_RELEASE_VERSION);
    check();
    window.addEventListener("atlvs:whatsNewSeen", check);
    return () => window.removeEventListener("atlvs:whatsNewSeen", check);
  }, []);

  return (
    <Popover.Root>
      <Hint label="Help &amp; tour" side="bottom">
        <Popover.Trigger asChild>
          <button
            type="button"
            data-tour="help"
            aria-label="Help"
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--p-text-2)] hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
          >
            <HelpCircle size={16} aria-hidden="true" />
            {unseen && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-[var(--p-accent)] ring-2 ring-[var(--p-bg)]"
              />
            )}
          </button>
        </Popover.Trigger>
      </Hint>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-[var(--p-z-popover)] w-64 rounded-lg border border-[var(--p-border)] bg-[var(--p-bg)] p-1 shadow-lg"
        >
          <Popover.Close asChild>
            <button
              type="button"
              onClick={() => startConsoleTour()}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm hover:bg-[var(--p-surface)]"
            >
              <Compass size={14} aria-hidden="true" className="text-[var(--p-text-2)]" />
              <span>Take the tour</span>
            </button>
          </Popover.Close>
          <Link
            href="/studio/help"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--p-surface)]"
          >
            <LifeBuoy size={14} aria-hidden="true" className="text-[var(--p-text-2)]" />
            <span>Help Center</span>
          </Link>
          <Link
            href={knowledgeUrl}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--p-surface)]"
          >
            <BookOpen size={14} aria-hidden="true" className="text-[var(--p-text-2)]" />
            <span>Knowledge Base</span>
          </Link>
          <Link
            href="/studio/help/whats-new"
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--p-surface)]"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={14} aria-hidden="true" className="text-[var(--p-text-2)]" />
              <span>What's New</span>
            </span>
            {unseen && (
              <span className="rounded-full bg-[var(--p-accent)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--p-accent-contrast,white)]">
                New
              </span>
            )}
          </Link>
          <Link
            href="/studio/help/status"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--p-surface)]"
          >
            <Activity size={14} aria-hidden="true" className="text-[var(--p-text-2)]" />
            <span>System Status</span>
          </Link>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
