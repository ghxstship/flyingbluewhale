"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { signApprovalAction, declineApprovalAction } from "../actions";
import type { FormState } from "@/components/FormShell";

export function ApprovalSignBlock({
  slug,
  proposalId,
  approvalId,
}: {
  slug: string;
  proposalId: string;
  approvalId: string;
}) {
  const [mode, setMode] = useState<"sign" | "decline">("sign");
  const action = mode === "sign" ? signApprovalAction : declineApprovalAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="approvalId" value={approvalId} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("sign")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition ${
            mode === "sign"
              ? "bg-[var(--org-primary)] text-white"
              : "bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          Sign
        </button>
        <button
          type="button"
          onClick={() => setMode("decline")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition ${
            mode === "decline"
              ? "bg-[color:var(--color-error)] text-white"
              : "bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          Decline
        </button>
      </div>

      {mode === "sign" ? (
        <>
          <div>
            <label htmlFor="signedLabel" className="text-sm font-medium">
              Type your full name to sign
            </label>
            <input
              id="signedLabel"
              name="signedLabel"
              required
              placeholder="Julian Clarkson"
              className="input-base mt-1.5 w-full"
            />
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              By typing your name, you agree this constitutes an electronic signature.
            </p>
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="reason" className="text-sm font-medium">
            Reason for decline
          </label>
          <textarea
            id="reason"
            name="reason"
            required
            rows={3}
            placeholder="What needs to change before this can be signed?"
            className="input-base mt-1.5 w-full"
          />
        </div>
      )}

      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">Recorded.</Alert>}

      <div className="flex justify-end">
        <Button type="submit" loading={pending} variant={mode === "decline" ? "danger" : "primary"}>
          {mode === "sign" ? "Sign approval" : "Decline approval"}
        </Button>
      </div>
    </form>
  );
}
