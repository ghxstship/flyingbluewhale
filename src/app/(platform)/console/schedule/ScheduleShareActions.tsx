"use client";

import { useTransition, useState } from "react";
import { createScheduleShareToken } from "./shareActions";

export function ScheduleShareButton({ orgId }: { orgId: string }) {
  const [pending, start] = useTransition();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleShare() {
    start(async () => {
      const result = await createScheduleShareToken(orgId);
      if (result.url) {
        setShareUrl(result.url);
      }
    });
  }

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (shareUrl) {
    return (
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={shareUrl}
          className="input max-w-xs font-mono text-xs"
        />
        <button onClick={handleCopy} className="btn btn-secondary text-xs">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleShare} disabled={pending} className="btn btn-secondary">
      {pending ? "Generating…" : "Share Schedule"}
    </button>
  );
}
