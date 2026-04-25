"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";

const NEXT_BUTTONS: Record<string, Array<{ to: string; label: string; variant: "default" | "danger" }>> = {
  submitted: [
    { to: "in_review", label: "Start review", variant: "default" },
    { to: "approved", label: "Approve", variant: "default" },
    { to: "rejected", label: "Reject", variant: "danger" },
  ],
  in_review: [
    { to: "approved", label: "Approve", variant: "default" },
    { to: "revision_requested", label: "Request revision", variant: "default" },
    { to: "rejected", label: "Reject", variant: "danger" },
  ],
  approved: [
    { to: "fulfilled", label: "Mark fulfilled", variant: "default" },
  ],
  revision_requested: [
    { to: "in_review", label: "Resume review", variant: "default" },
  ],
  rejected: [
    { to: "revision_requested", label: "Reopen", variant: "default" },
  ],
};

export function AdvancingTransitionRow({
  id,
  status,
  fulfilled,
}: {
  id: string;
  status: string;
  fulfilled: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState<string | null>(null);

  const buttons = (NEXT_BUTTONS[status] ?? []).filter((b) => !(b.to === "fulfilled" && fulfilled));
  if (buttons.length === 0) {
    return <span className="text-xs text-[var(--text-muted)]">—</span>;
  }

  async function transition(to: string) {
    setPending(to);
    try {
      const r = await fetch(`/api/v1/deliverables/${id}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const json = (await r.json()) as { ok: boolean; error?: { message?: string } };
      if (!r.ok || !json.ok) {
        throw new Error(json.error?.message ?? "Transition failed");
      }
      toast.success(`Moved to ${to.replace("_", " ")}`);
      router.refresh();
    } catch (e) {
      toast.error("Transition failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="inline-flex items-center gap-1">
      {buttons.map((b) => (
        <button
          key={b.to}
          type="button"
          disabled={pending !== null}
          onClick={() => void transition(b.to)}
          className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-50 ${
            b.variant === "danger"
              ? "text-[color:var(--color-error)] hover:bg-[color:var(--color-error)]/10"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
          }`}
        >
          {pending === b.to ? "…" : b.label}
        </button>
      ))}
    </div>
  );
}
