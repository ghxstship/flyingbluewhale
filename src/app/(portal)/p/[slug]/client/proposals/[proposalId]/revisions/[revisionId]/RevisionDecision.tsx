"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { SelectableCard, type SelectableCardTone } from "@/components/ui/SelectableCard";
import { decideRevisionAction } from "../actions";
import type { FormState } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";

type Decision = "approved" | "changes_requested" | "rejected";

export function RevisionDecision({ slug, proposalId, roundId }: { slug: string; proposalId: string; roundId: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<FormState, FormData>(decideRevisionAction, null);
  const [decision, setDecision] = useState<Decision>("approved");

  const OPTIONS: { value: Decision; title: string; sub: string; tone: SelectableCardTone }[] = [
    {
      value: "approved",
      title: t("p.client.proposals.revisions.decision.approve.title", undefined, "Approve"),
      sub: t("p.client.proposals.revisions.decision.approve.sub", undefined, "Lock the deliverable as-is."),
      tone: "success",
    },
    {
      value: "changes_requested",
      title: t("p.client.proposals.revisions.decision.changes.title", undefined, "Request changes"),
      sub: t(
        "p.client.proposals.revisions.decision.changes.sub",
        undefined,
        "Round closes; we'll open the next round.",
      ),
      tone: "brand",
    },
    {
      value: "rejected",
      title: t("p.client.proposals.revisions.decision.reject.title", undefined, "Reject"),
      sub: t(
        "p.client.proposals.revisions.decision.reject.sub",
        undefined,
        "Stop the line — significant rethink needed.",
      ),
      tone: "error",
    },
  ];

  return (
    <form action={formAction} className="surface space-y-3 p-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="roundId" value={roundId} />
      <input type="hidden" name="decision" value={decision} />
      <div className="eyebrow text-xs text-[var(--p-text-2)]">
        {t("p.client.proposals.revisions.decision.eyebrow", undefined, "Your decision")}
      </div>
      <h3 className="text-base font-semibold">
        {t("p.client.proposals.revisions.decision.heading", undefined, "Decide on This Round")}
      </h3>

      <div
        className="grid gap-2 md:grid-cols-3"
        role="radiogroup"
        aria-label={t("p.client.proposals.revisions.decision.radioGroupLabel", undefined, "Round decision")}
      >
        {OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            tone={opt.tone}
            selected={decision === opt.value}
            onClick={() => setDecision(opt.value)}
            title={opt.title}
            description={opt.sub}
          />
        ))}
      </div>

      <textarea
        name="note"
        rows={3}
        placeholder={t(
          "p.client.proposals.revisions.decision.notePlaceholder",
          undefined,
          "Notes for the team — what's working, what isn't…",
        )}
        className="ps-input w-full"
      />

      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && (
        <Alert kind="success">
          {t("p.client.proposals.revisions.decision.recorded", undefined, "Decision recorded.")}
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={pending}
          variant={decision === "rejected" ? "danger" : decision === "approved" ? "primary" : "secondary"}
        >
          {t("p.client.proposals.revisions.decision.submit", undefined, "Submit decision")}
        </Button>
      </div>
    </form>
  );
}
