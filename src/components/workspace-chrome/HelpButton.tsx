"use client";

import * as React from "react";
import Link from "next/link";
import { HelpCircle, BookOpen, ExternalLink } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

/**
 * `?` Help affordance (ADR-0007).
 *
 * Opens a small popover routing to internal KB (`/console/knowledge`)
 * and external docs / changelog. Replaces a sidebar "Knowledge" entry
 * per ADR-0006 §"What moves". Matches Linear / Notion / Stripe / Vercel
 * — none ship a Help group in their primary nav.
 */
export function HelpButton({ knowledgeUrl = "/console/knowledge" }: { knowledgeUrl?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Help"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
        >
          <HelpCircle size={16} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-40 w-64 rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-1 shadow-lg"
        >
          <Link
            href={knowledgeUrl}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--surface-raised)]"
          >
            <BookOpen size={14} aria-hidden="true" className="text-[var(--text-muted)]" />
            <span>Knowledge base</span>
          </Link>
          <Link
            href="/changelog"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--surface-raised)]"
          >
            <span aria-hidden="true" className="w-3.5" />
            <span>What's new</span>
          </Link>
          <a
            href="https://atlvs.pro/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--surface-raised)]"
          >
            <ExternalLink size={14} aria-hidden="true" className="text-[var(--text-muted)]" />
            <span>Docs</span>
          </a>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
