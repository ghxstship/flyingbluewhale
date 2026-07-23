"use client";

import { useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createShareLinkAction } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
export function ShareLinkPanel({ proposalId }: { proposalId: string }) {
  const t = useT();
  const resolveErr = useActionErrorResolver();
  const [pending, start] = useTransition();

  const generate = (audience: string | null) =>
    start(async () => {
      const res = await createShareLinkAction(proposalId, audience);
      if (res?.error) {
        toast.error(resolveErr(res.error));
        return;
      }
      if (res?.ok) {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}${res.ok.url}`);
        } catch {
          // Clipboard write can fail if the page lost focus or the browser
          // blocked the API. Best-effort copy; the toast still confirms
          // the link was created server-side.
        }
        toast.success(t("console.proposals.edit.shareLink.copiedToast", undefined, "Share link copied to clipboard"));
      }
    });

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => generate("client")} disabled={pending}>
        {t("console.proposals.edit.shareLink.client", undefined, "+ Client link")}
      </Button>
      <Button size="sm" variant="secondary" onClick={() => generate("internal")} disabled={pending}>
        {t("console.proposals.edit.shareLink.internal", undefined, "+ Internal review link")}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => generate(null)} disabled={pending}>
        {t("console.proposals.edit.shareLink.generic", undefined, "+ Generic link")}
      </Button>
    </div>
  );
}
