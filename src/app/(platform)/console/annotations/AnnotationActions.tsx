"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { acknowledgeAction, confirmAction, dismissAction, resolveAction, replyAction } from "./actions";
import type { Annotation } from "@/lib/db/annotations";

export function AnnotationActions({
  id,
  status,
  confirmationRequired,
  confirmedAt,
}: {
  id: string;
  status: Annotation["status"];
  confirmationRequired: boolean;
  confirmedAt: string | null;
}) {
  const [pending, start] = useTransition();
  const isOpen = status === "open";
  const isAck = status === "acknowledged";
  const isClosed = status === "resolved" || status === "dismissed";
  const needsConfirmation = confirmationRequired && !confirmedAt;

  const run = (label: string, fn: () => Promise<{ error?: string } | undefined>) => () =>
    start(async () => {
      const r = await fn();
      if (r?.error) toast.error(r.error);
      else toast.success(label);
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {needsConfirmation && (
        <Button size="sm" disabled={pending} onClick={run("Confirmed", () => confirmAction(id))}>
          {pending ? "…" : "Confirm"}
        </Button>
      )}
      {isOpen && (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={run("Acknowledged", () => acknowledgeAction(id))}
        >
          {pending ? "…" : "Acknowledge"}
        </Button>
      )}
      {!isClosed && <ResolveButton id={id} pending={pending} start={start} />}
      {!isClosed && (
        <Button size="sm" variant="secondary" disabled={pending} onClick={run("Dismissed", () => dismissAction(id))}>
          {pending ? "…" : "Dismiss"}
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
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const note = window.prompt("Resolution note (optional):") ?? undefined;
          const r = await resolveAction(id, note);
          if (r?.error) toast.error(r.error);
          else toast.success("Resolved");
        })
      }
    >
      {pending ? "…" : "Resolve"}
    </Button>
  );
}

export function ReplyForm({ parentId }: { parentId: string }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        start(async () => {
          const r = await replyAction(parentId, body);
          if (r?.error) toast.error(r.error);
          else {
            toast.success("Reply posted");
            setBody("");
          }
        });
      }}
      className="flex flex-col gap-2"
    >
      <textarea
        className="surface min-h-24 w-full p-3 text-sm"
        placeholder="Reply to this annotation…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={pending}
      />
      <div>
        <Button type="submit" size="sm" disabled={pending || !body.trim()}>
          {pending ? "…" : "Post reply"}
        </Button>
      </div>
    </form>
  );
}
