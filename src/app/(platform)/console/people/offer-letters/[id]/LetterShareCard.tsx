"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { OfferLetterStatus } from "@/lib/offer-letters/types";

export function LetterShareCard({
  letterId,
  accessCode,
  publicUrl,
  status,
}: {
  letterId: string;
  accessCode: string;
  publicUrl: string;
  status: OfferLetterStatus;
}) {
  const [copied, setCopied] = useState<"url" | "code" | "both" | null>(null);

  const copy = async (kind: "url" | "code" | "both") => {
    let text = publicUrl;
    if (kind === "code") text = accessCode;
    if (kind === "both") text = `${publicUrl}\nAccess code: ${accessCode}`;
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="surface space-y-4 p-5" id={`share-${letterId}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase">Public Share Link</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Send this link plus the 6-character access code. The recipient enters the code to open the letter.
          </p>
        </div>
        <Badge variant={status === "draft" ? "muted" : "info"}>
          {status === "draft" ? "Draft — not yet sent" : "Public link active"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="rounded border border-[var(--border-default)] bg-[var(--surface-inset)] px-3 py-2 font-mono text-xs break-all">
          {publicUrl}
        </div>
        <Button variant="secondary" size="sm" onClick={() => copy("url")}>
          {copied === "url" ? "Copied" : "Copy link"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="rounded border border-[var(--border-default)] bg-[var(--surface-inset)] px-3 py-2 text-center font-mono text-2xl tracking-[0.4em]">
          {accessCode}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => copy("code")}>
            {copied === "code" ? "Copied" : "Copy code"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => copy("both")}>
            {copied === "both" ? "Copied" : "Copy both"}
          </Button>
        </div>
      </div>
    </section>
  );
}
