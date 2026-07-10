"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";
import { toTitle } from "@/lib/format";
import { useT } from "@/lib/i18n/LocaleProvider";

const NEXT_BUTTONS: Record<
  string,
  Array<{ to: string; labelKey: string; labelFallback: string; variant: "default" | "danger" }>
> = {
  submitted: [
    {
      to: "in_review",
      labelKey: "console.projects.advancing.transition.startReview",
      labelFallback: "Start Review",
      variant: "default",
    },
    {
      to: "approved",
      labelKey: "console.projects.advancing.transition.approve",
      labelFallback: "Approve",
      variant: "default",
    },
    {
      to: "rejected",
      labelKey: "console.projects.advancing.transition.reject",
      labelFallback: "Reject",
      variant: "danger",
    },
  ],
  in_review: [
    {
      to: "approved",
      labelKey: "console.projects.advancing.transition.approve",
      labelFallback: "Approve",
      variant: "default",
    },
    {
      to: "revision_requested",
      labelKey: "console.projects.advancing.transition.requestRevision",
      labelFallback: "Request Revision",
      variant: "default",
    },
    {
      to: "rejected",
      labelKey: "console.projects.advancing.transition.reject",
      labelFallback: "Reject",
      variant: "danger",
    },
  ],
  approved: [
    {
      to: "delivered",
      labelKey: "console.projects.advancing.transition.markDelivered",
      labelFallback: "Mark Delivered",
      variant: "default",
    },
  ],
  revision_requested: [
    {
      to: "submitted",
      labelKey: "console.projects.advancing.transition.resubmit",
      labelFallback: "Resubmit",
      variant: "default",
    },
    {
      to: "rejected",
      labelKey: "console.projects.advancing.transition.reject",
      labelFallback: "Reject",
      variant: "danger",
    },
  ],
};

export function AdvancingTransitionRow({ id, status, fulfilled }: { id: string; status: string; fulfilled: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const [pending, setPending] = React.useState<string | null>(null);

  const buttons = (NEXT_BUTTONS[status] ?? []).filter((b) => !(b.to === "fulfilled" && fulfilled));
  if (buttons.length === 0) {
    return <span className="text-xs text-[var(--p-text-2)]">—</span>;
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
      toast.success(
        t("console.projects.advancing.transition.movedToast", { state: toTitle(to) }, `Moved to ${toTitle(to)}`),
      );
      router.refresh();
    } catch (e) {
      toast.error(t("console.projects.advancing.transition.failedToast", undefined, "Transition failed"), {
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
              ? "text-[color:var(--p-danger)] hover:bg-[color:var(--p-danger)]/10"
              : "text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)]"
          }`}
        >
          {pending === b.to ? "…" : t(b.labelKey, undefined, b.labelFallback)}
        </button>
      ))}
    </div>
  );
}
