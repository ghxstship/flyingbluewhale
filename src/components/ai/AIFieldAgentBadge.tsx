"use client";

import * as React from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export type AIFieldAgentBadgeProps = {
  /** ai_agents.id — required to refresh on demand. */
  agentId: string;
  /** Target record id this badge refreshes against. */
  recordId: string;
  /** ISO timestamp of the last refresh. Drives the "updated 3m ago" label. */
  updatedAt?: string | null;
  /**
   * Server action that triggers the refresh. Receives `{ agentId, recordId }`.
   * Resolve to the new ISO updated_at string on success; throw on failure.
   */
  onRefresh: (input: { agentId: string; recordId: string }) => Promise<string | void>;
  className?: string;
};

function timeAgo(iso?: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "never";
  const diff = Date.now() - then;
  if (diff < 60_000) return "just now";
  const m = Math.round(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

/**
 * Small badge shown next to AI-populated fields. SmartSuite parity for
 * "AI Field Agent" indicators — tells the user this column was machine-
 * generated, when it was last refreshed, and offers a Refresh button.
 */
export function AIFieldAgentBadge({ agentId, recordId, updatedAt, onRefresh, className = "" }: AIFieldAgentBadgeProps) {
  const [pending, startTransition] = React.useTransition();
  const [stamp, setStamp] = React.useState<string | null>(updatedAt ?? null);
  const [error, setError] = React.useState<string | null>(null);

  const handleRefresh = React.useCallback(() => {
    setError(null);
    startTransition(async () => {
      try {
        const next = await onRefresh({ agentId, recordId });
        setStamp(typeof next === "string" ? next : new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Refresh failed");
      }
    });
  }, [agentId, recordId, onRefresh]);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`.trim()} aria-live="polite">
      <Badge variant="brand-soft">
        <Sparkles size={11} aria-hidden="true" className="me-1" />
        AI
      </Badge>
      <span className="muted text-xs">Updated {timeAgo(stamp)}</span>
      <Button
        size="icon"
        variant="ghost"
        aria-label="Refresh AI field"
        onClick={handleRefresh}
        loading={pending}
        disabled={pending}
      >
        <RefreshCw size={14} className={pending ? "motion-safe:animate-spin" : ""} aria-hidden="true" />
      </Button>
      {error ? (
        <span role="alert" className="error-text text-xs">
          {error}
        </span>
      ) : null}
    </span>
  );
}
