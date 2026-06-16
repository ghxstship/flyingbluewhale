"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";

/**
 * Project report/export menu — the canonical home for the per-project generated
 * documents (PDF/report endpoints under `/api/v1/projects/{id}/…`). A single
 * overflow menu keeps the project header uncluttered and scales as new report
 * generators are added (add one row here, no header churn). Each item opens the
 * server route in a new tab; the route 302-redirects to a signed URL.
 */

const REPORTS: { key: string; label: string; path: string }[] = [
  { key: "advance-book", label: "Advance Book", path: "advance-book" },
  { key: "call-sheet", label: "Call Sheet", path: "call-sheet" },
  { key: "task-report", label: "Task Report", path: "task-report" },
  { key: "expense-report", label: "Expense Report", path: "expense-report" },
  { key: "signage-grid", label: "Signage Grid", path: "signage-grid" },
  { key: "sponsor-deck", label: "Sponsor Deck", path: "sponsor-deck" },
  { key: "wristbands", label: "Wristbands", path: "wristbands" },
];

export function ProjectReportsMenu({ projectId }: { projectId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]">
        Reports
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Generate document</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {REPORTS.map((r) => (
          <DropdownMenuItem key={r.key} asChild>
            <a href={`/api/v1/projects/${projectId}/${r.path}`} target="_blank" rel="noopener">
              {r.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
