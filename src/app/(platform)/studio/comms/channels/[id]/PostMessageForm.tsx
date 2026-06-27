"use client";

import { FormShell } from "@/components/FormShell";
import { postMessage } from "./actions";

export function PostMessageForm({
  channelId,
  placeholder,
  submitLabel,
}: {
  channelId: string;
  placeholder: string;
  submitLabel: string;
}) {
  return (
    <FormShell action={postMessage} submitLabel={submitLabel} dirtyGuard={false}>
      <input type="hidden" name="channel_id" value={channelId} />
      <textarea
        name="body_markdown"
        required
        rows={3}
        maxLength={10000}
        placeholder={placeholder}
        className="ps-input w-full"
      />
    </FormShell>
  );
}
