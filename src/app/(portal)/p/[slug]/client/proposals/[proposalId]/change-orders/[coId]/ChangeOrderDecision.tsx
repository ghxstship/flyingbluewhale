"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { decideChangeOrderAction } from "../actions";
import type { FormState } from "@/components/FormShell";

export function ChangeOrderDecision({ slug, proposalId, coId }: { slug: string; proposalId: string; coId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(decideChangeOrderAction, null);
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");

  return (
    <form action={formAction} className="surface space-y-3 p-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="coId" value={coId} />
      <input type="hidden" name="decision" value={decision} />
      <div className="eyebrow text-xs text-[var(--text-muted)]">Your decision</div>
      <h3 className="text-base font-semibold">Approve or Reject This Change Order</h3>

      <div className="grid gap-2 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setDecision("approved")}
          className={`rounded border-2 p-4 text-start transition ${
            decision === "approved"
              ? "border-[color:var(--color-success)] bg-[color:var(--color-success)]/10"
              : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
          }`}
        >
          <div className="text-sm font-semibold">Approve</div>
          <div className="text-xs text-[var(--text-muted)]">
            Add to the contract; new total reflects on the overview.
          </div>
        </button>
        <button
          type="button"
          onClick={() => setDecision("rejected")}
          className={`rounded border-2 p-4 text-start transition ${
            decision === "rejected"
              ? "border-[color:var(--color-error)] bg-[color:var(--color-error)]/10"
              : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
          }`}
        >
          <div className="text-sm font-semibold">Reject</div>
          <div className="text-xs text-[var(--text-muted)]">Marks as declined; out of scope.</div>
        </button>
      </div>

      <textarea name="note" rows={3} placeholder="Optional note for the team…" className="input-base w-full" />

      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">Decision recorded.</Alert>}

      <div className="flex justify-end">
        <Button type="submit" loading={pending} variant={decision === "rejected" ? "danger" : "primary"}>
          {decision === "approved" ? "Approve change" : "Reject change"}
        </Button>
      </div>
    </form>
  );
}
