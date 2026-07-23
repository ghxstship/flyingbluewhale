"use client";

import { useState, useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { acknowledgeAction, confirmAction, dismissAction, resolveAction, replyAction } from "./actions";
import type { Annotation } from "@/lib/db/annotations";

import { useActionErrorResolver } from "@/lib/errors-client";
export function AnnotationActions({
  id,
  annotation_state,
  confirmationRequired,
  confirmedAt,
}: {
  id: string;
  annotation_state: Annotation["annotation_state"];
  confirmationRequired: boolean;
  confirmedAt: string | null;
}) {
  const t = useT();
  const resolveErr = useActionErrorResolver();
  const [pending, start] = useTransition();
  const isOpen = annotation_state === "open";
  const isClosed = annotation_state === "resolved" || annotation_state === "dismissed";
  const needsConfirmation = confirmationRequired && !confirmedAt;

  const run = (label: string, fn: () => Promise<{ error?: string } | undefined>) => () =>
    start(async () => {
      const r = await fn();
      if (r?.error) toast.error(resolveErr(r.error));
      else toast.success(label);
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {needsConfirmation && (
        <Button
          size="sm"
          disabled={pending}
          onClick={run(t("console.annotations.confirmedToast", undefined, "Confirmed"), () => confirmAction(id))}
        >
          {pending ? "…" : t("console.annotations.confirm", undefined, "Confirm")}
        </Button>
      )}
      {isOpen && (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={run(t("console.annotations.acknowledgedToast", undefined, "Acknowledged"), () =>
            acknowledgeAction(id),
          )}
        >
          {pending ? "…" : t("console.annotations.acknowledge", undefined, "Acknowledge")}
        </Button>
      )}
      {!isClosed && <ResolveButton id={id} pending={pending} start={start} />}
      {!isClosed && (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={run(t("console.annotations.dismissedToast", undefined, "Dismissed"), () => dismissAction(id))}
        >
          {pending ? "…" : t("console.annotations.dismiss", undefined, "Dismiss")}
        </Button>
      )}
    </div>
  );
}

function ResolveButton({
  id,
  pending,
  start,
}: {
  id: string;
  pending: boolean;
  start: (cb: () => Promise<void> | void) => void;
}) {
  const t = useT();
  const resolveErr = useActionErrorResolver();
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const note =
            window.prompt(t("console.annotations.resolutionNotePrompt", undefined, "Resolution note (optional):")) ??
            undefined;
          const r = await resolveAction(id, note);
          if (r?.error) toast.error(resolveErr(r.error));
          else toast.success(t("console.annotations.resolvedToast", undefined, "Resolved"));
        })
      }
    >
      {pending ? "…" : t("console.annotations.resolve", undefined, "Resolve")}
    </Button>
  );
}

export function ReplyForm({ parentId }: { parentId: string }) {
  const t = useT();
  const resolveErr = useActionErrorResolver();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        start(async () => {
          const r = await replyAction(parentId, body);
          if (r?.error) toast.error(resolveErr(r.error));
          else {
            toast.success(t("console.annotations.replyPostedToast", undefined, "Reply posted"));
            setBody("");
          }
        });
      }}
      className="flex flex-col gap-2"
    >
      <textarea
        className="surface min-h-24 w-full p-3 text-sm"
        placeholder={t("console.annotations.replyPlaceholder", undefined, "Reply to this annotation…")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={pending}
      />
      <div>
        <Button type="submit" size="sm" disabled={pending || !body.trim()}>
          {pending ? "…" : t("console.annotations.postReply", undefined, "Post reply")}
        </Button>
      </div>
    </form>
  );
}
