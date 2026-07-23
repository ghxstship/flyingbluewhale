"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { Button } from "./ui/Button";
import { postConversationMessage } from "@/lib/actions/conversations";
import type { ConversationRecordType } from "@/lib/db/conversations";

import { useActionErrorResolver } from "@/lib/errors-client";
function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} size="sm">
      Post
    </Button>
  );
}

export function ConversationComposer({
  recordType,
  recordId,
}: {
  recordType: ConversationRecordType;
  recordId: string;
}) {
  const [state, formAction] = useActionState<{ error?: string } | null, FormData>(postConversationMessage, null);
  const resolveErr = useActionErrorResolver();
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="record_type" value={recordType} />
      <input type="hidden" name="record_id" value={recordId} />
      <textarea
        name="body"
        rows={3}
        required
        placeholder="Add a comment…"
        className="ps-input w-full"
      />
      {state?.error && <p className="text-xs text-[var(--error)]">{resolveErr(state.error)}</p>}
      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
