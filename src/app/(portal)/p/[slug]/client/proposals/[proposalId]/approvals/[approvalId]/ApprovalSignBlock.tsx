"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { signApprovalAction, declineApprovalAction } from "../actions";
import type { FormState } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";

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
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "sign"
              ? "bg-[var(--org-primary)] text-white"
              : "bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          {t("p.client.proposals.approvals.sign.tab", undefined, "Sign")}
        </button>
        <button
          type="button"
          onClick={() => setMode("decline")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "decline"
              ? "bg-[color:var(--color-error)] text-white"
              : "bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
              className="input-base mt-1.5 w-full"
            />
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
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
            className="input-base mt-1.5 w-full"
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
