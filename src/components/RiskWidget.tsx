"use client";

import { useEffect, useState } from "react";

export type RiskFlag = {
  id: string;
  severity: "high" | "medium" | "low";
  category: "deliverables" | "budget" | "staleness" | "crew" | "incidents";
  message: string;
  count?: number;
};

type Props = {
  projectId: string;
};

const SEVERITY_STYLE: Record<RiskFlag["severity"], string> = {
  high:   "bg-[color:var(--color-error)]/10 border-[color:var(--color-error)]/30 text-[color:var(--color-error)]",
  medium: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
  low:    "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-muted)]",
};

const CATEGORY_ICON: Record<RiskFlag["category"], string> = {
  deliverables: "📋",
  budget:       "💰",
  staleness:    "🕐",
  crew:         "👷",
  incidents:    "⚠️",
};

export function RiskWidget({ projectId }: Props) {
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/projects/${projectId}/risk`)
      .then((r) => r.json())
      .then((body: { data?: { flags: RiskFlag[] } }) => {
        setFlags(body.data?.flags ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return null;
  if (flags.length === 0) {
    return (
      <div className="surface rounded-xl p-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <span>✅</span>
        <span>No risk flags detected</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Risk Flags</p>
      <ul className="space-y-2">
        {flags.map((f) => (
          <li
            key={f.id}
            className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-sm ${SEVERITY_STYLE[f.severity]}`}
          >
            <span className="flex-shrink-0 mt-0.5">{CATEGORY_ICON[f.category]}</span>
            <div className="flex-1 min-w-0">
              <span>{f.message}</span>
            </div>
            <span className="flex-shrink-0 text-xs font-medium uppercase">{f.severity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
