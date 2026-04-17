"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { createShareLinkAction } from "./actions";

export function ShareLinkPanel({ proposalId }: { proposalId: string }) {
  const [pending, start] = useTransition();

  const generate = (audience: string | null) =>
    start(async () => {
      const res = await createShareLinkAction(proposalId, audience);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if (res?.ok) {
        try { await navigator.clipboard.writeText(`${window.location.origin}${res.ok.url}`); } catch {}
        toast.success("Share link copied to clipboard");
      }
    });

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => generate("client")} disabled={pending}>+ Client link</Button>
      <Button size="sm" variant="secondary" onClick={() => generate("internal")} disabled={pending}>+ Internal review link</Button>
      <Button size="sm" variant="ghost" onClick={() => generate(null)} disabled={pending}>+ Generic link</Button>
    </div>
  );
}
