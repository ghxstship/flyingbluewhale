"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

// "Generate Draft" affordance on the proposal detail. POSTs to the
// /api/v1/ai/propose route (which persists an ai_proposal_drafts row), then
// refreshes the server component so the new draft renders inline.
export function GenerateDraftButton({ proposalId }: { proposalId: string }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            const res = await fetch("/api/v1/ai/propose", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ proposalId }),
            });
            const body = (await res.json()) as { ok: boolean; error?: { message?: string } };
            if (!res.ok || !body.ok) {
              toast.error(
                body.error?.message ??
                  t("console.proposals.ai.generateError", undefined, "Draft generation failed"),
              );
              return;
            }
            toast.success(t("console.proposals.ai.generateSuccess", undefined, "Draft generated"));
            router.refresh();
          } catch {
            toast.error(t("console.proposals.ai.generateError", undefined, "Draft generation failed"));
          }
        })
      }
    >
      <Sparkles className="size-3.5" />
      {pending
        ? t("console.proposals.ai.generating", undefined, "Generating…")
        : t("console.proposals.ai.generateDraft", undefined, "Generate Draft")}
    </Button>
  );
}
