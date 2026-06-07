"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/LocaleProvider";
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
  const t = useT();
  const [copied, setCopied] = useState<"url" | "code" | "both" | null>(null);

  const copy = async (kind: "url" | "code" | "both") => {
    let text = publicUrl;
    if (kind === "code") text = accessCode;
    if (kind === "both") {
      text = `${publicUrl}\n${t(
        "console.people.offerLetters.share.accessCodePrefix",
        undefined,
        "Access code:",
      )} ${accessCode}`;
    }
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="surface space-y-4 p-5" id={`share-${letterId}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase">
            {t("console.people.offerLetters.share.title", undefined, "Public Share Link")}
          </h3>
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.people.offerLetters.share.description",
              undefined,
              "Send this link plus the 6-character access code. The recipient enters the code to open the letter.",
            )}
          </p>
        </div>
        <Badge variant={status === "draft" ? "muted" : "info"}>
          {status === "draft"
            ? t("console.people.offerLetters.share.statusDraft", undefined, "Draft — not yet sent")
            : t("console.people.offerLetters.share.statusActive", undefined, "Public link active")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="rounded border border-[var(--border-default)] bg-[var(--p-surface-2)] px-3 py-2 font-mono text-xs break-all">
          {publicUrl}
        </div>
        <Button variant="secondary" size="sm" onClick={() => copy("url")}>
          {copied === "url"
            ? t("console.people.offerLetters.share.copied", undefined, "Copied")
            : t("console.people.offerLetters.share.copyLink", undefined, "Copy link")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="rounded border border-[var(--border-default)] bg-[var(--p-surface-2)] px-3 py-2 text-center font-mono text-2xl tracking-[0.4em]">
          {accessCode}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => copy("code")}>
            {copied === "code"
              ? t("console.people.offerLetters.share.copied", undefined, "Copied")
              : t("console.people.offerLetters.share.copyCode", undefined, "Copy code")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => copy("both")}>
            {copied === "both"
              ? t("console.people.offerLetters.share.copied", undefined, "Copied")
              : t("console.people.offerLetters.share.copyBoth", undefined, "Copy both")}
          </Button>
        </div>
      </div>
    </section>
  );
}
