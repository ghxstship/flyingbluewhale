"use client";

import { useState } from "react";
import { Share2, Link2, Check } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";

/**
 * ShareSheet — share a GVTEWAY list (design_handoff §2). Lists are the
 * shareable unit of the consumer graph (`public.list.visibility` ∈
 * private/unlisted/public). This is a handoff surface: copy the link or fire
 * the OS share sheet — GVTEWAY never posts on the user's behalf.
 *
 * Token-only colors; the trigger is a styled `<Button>`.
 */
export function ShareSheet({
  url,
  title,
  triggerLabel = "Share",
}: {
  /** Absolute share URL (build cross-shell links with `urlFor`). */
  url: string;
  /** Human title used in the OS share payload. */
  title: string;
  triggerLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  async function nativeShare() {
    // Web Share API where available (mobile + Safari); falls back to copy.
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed or share failed — fall through to copy.
      }
    }
    await copy();
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" size="sm">
          <Share2 size={14} aria-hidden="true" />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-md">
        <SheetHeader>
          <SheetTitle>Share this list</SheetTitle>
          <SheetDescription>{title}</SheetDescription>
        </SheetHeader>

        <div className="space-y-3">
          <div className="surface-inset flex items-center gap-2 rounded-[var(--p-r-md)] px-3 py-2">
            <Link2 size={14} className="shrink-0 text-[var(--p-text-3)]" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--p-text-2)]">{url}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={copy}>
              {copied ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button variant="secondary" size="sm" onClick={nativeShare}>
              <Share2 size={14} aria-hidden="true" />
              Share via…
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
