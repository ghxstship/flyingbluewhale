"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { signApprovalAction, declineApprovalAction } from "../actions";
import type { FormState } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";

export function ApprovalSignBlock({
  slug,
  proposalId,
  approvalId,
}: {
  slug: string;
  proposalId: string;
  approvalId: string;
}) {
  const t = useT();
  const toast = useToast();
  const [mode, setMode] = useState<"sign" | "decline">("sign");
  const action = mode === "sign" ? signApprovalAction : declineApprovalAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);

  // The block only mounts while the approval is pending; the action's
  // revalidatePath unmounts it in the same round-trip, so the inline
  // "Recorded." alert is never reliably visible. The toast survives.
  useEffect(() => {
    if (state?.ok) {
      toast.success(t("p.client.proposals.approvals.recorded", undefined, "Recorded."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.ok]);

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="approvalId" value={approvalId} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("sign")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "sign"
              ? "bg-[var(--p-accent)] text-white"
              : "bg-[var(--p-surface-2)] text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
          }`}
        >
          {t("p.client.proposals.approvals.sign.tab", undefined, "Sign")}
        </button>
        <button
          type="button"
          onClick={() => setMode("decline")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "decline"
              ? "bg-[color:var(--p-danger)] text-white"
              : "bg-[var(--p-surface-2)] text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
          }`}
        >
          {t("p.client.proposals.approvals.decline.tab", undefined, "Decline")}
        </button>
      </div>

      {mode === "sign" ? (
        <>
          <div>
            <label htmlFor="signedLabel" className="text-sm font-medium">
              {t("p.client.proposals.approvals.sign.nameLabel", undefined, "Type your full name to sign")}
            </label>
            <input
              id="signedLabel"
              name="signedLabel"
              required
              placeholder={t("p.client.proposals.approvals.sign.namePlaceholder", undefined, "Julian Clarkson")}
              className="ps-input mt-1.5 w-full"
            />
            <p className="mt-1.5 text-xs text-[var(--p-text-2)]">
              {t(
                "p.client.proposals.approvals.sign.consent",
                undefined,
                "By typing your name, you agree this constitutes an electronic signature.",
              )}
            </p>
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="reason" className="text-sm font-medium">
            {t("p.client.proposals.approvals.decline.reasonLabel", undefined, "Reason for decline")}
          </label>
          <textarea
            id="reason"
            name="reason"
            required
            rows={3}
            placeholder={t(
              "p.client.proposals.approvals.decline.reasonPlaceholder",
              undefined,
              "What needs to change before this can be signed?",
            )}
            className="ps-input mt-1.5 w-full"
          />
        </div>
      )}

      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{t("p.client.proposals.approvals.recorded", undefined, "Recorded.")}</Alert>}

      <div className="flex justify-end">
        <Button type="submit" loading={pending} variant={mode === "decline" ? "danger" : "primary"}>
          {mode === "sign"
            ? t("p.client.proposals.approvals.sign.submit", undefined, "Sign approval")
            : t("p.client.proposals.approvals.decline.submit", undefined, "Decline approval")}
        </Button>
      </div>
    </form>
  );
}
