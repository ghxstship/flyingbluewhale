"use client";

import { useState, useTransition } from "react";
import { FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { signChatAttachmentUrl } from "@/lib/chat/attachment-actions";
import { isImageAttachment, type ChatAttachment } from "@/lib/chat/attachment-types";

/**
 * One attachment inside a chat bubble, both shells. A chip, not an inline
 * embed: the bucket is private and signed URLs expire in minutes, so
 * rendering N previews per thread would churn signatures for content nobody
 * tapped. Tap mints a fresh URL through the caller's session (RBAC travels
 * with it) and opens in a new tab.
 */
export function AttachmentChip({ attachment }: { attachment: ChatAttachment }) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const Icon = pending ? Loader2 : isImageAttachment(attachment) ? ImageIcon : FileText;

  return (
    <button
      type="button"
      className="refchip"
      style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer" }}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const url = await signChatAttachmentUrl({ path: attachment.path });
            if (!url) {
              setFailed(true);
              return;
            }
            setFailed(false);
            window.open(url, "_blank", "noopener,noreferrer");
          } catch {
            setFailed(true);
          }
        })
      }
    >
      <Icon size={13} className={pending ? "animate-spin" : undefined} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{attachment.name}</span>
      {failed && <span style={{ color: "var(--p-danger)" }}>!</span>}
    </button>
  );
}
