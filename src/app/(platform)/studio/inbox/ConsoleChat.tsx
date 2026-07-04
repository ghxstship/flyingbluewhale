"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useOptimistic } from "react";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { CHAT_URL_PATTERN, type RecordRefMap } from "./record-ref-types";
import { sendConsoleMessage, type State } from "./actions";

export type ConsoleMessage = {
  id: string;
  authorId: string | null;
  authorName: string;
  body: string;
  timeText: string;
  dayKey: string;
  dayLabel: string;
};

export type ConsoleChatLabels = {
  placeholder: string;
  send: string;
  sending: string;
  empty: string;
  emptyHint: string;
};

/**
 * Console chat thread (kit 20 Inbox M1) — the two-pane inbox's right pane.
 * Optimistic send reconciled by the realtime INSERT (RealtimeRefresh nudges
 * a server re-render, which also re-resolves record-ref chips for new
 * messages). Enter sends, Shift+Enter breaks the line.
 */
export function ConsoleChat({
  roomId,
  userId,
  messages,
  refs,
  labels,
}: {
  roomId: string;
  userId: string;
  messages: ConsoleMessage[];
  refs: RecordRefMap;
  labels: ConsoleChatLabels;
}) {
  const [draft, setDraft] = React.useState("");
  const [state, formAction, pending] = useActionState<State, FormData>(sendConsoleMessage, null);
  const [optimistic, addOptimistic] = useOptimistic(messages, (cur, next: ConsoleMessage) => [...cur, next]);
  const formRef = React.useRef<HTMLFormElement>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [optimistic.length]);

  const submit = () => {
    const body = draft.trim();
    if (!body || pending) return;
    const fd = new FormData();
    fd.set("roomId", roomId);
    fd.set("body", body);
    React.startTransition(() => {
      addOptimistic({
        id: `pending-${Date.now()}`,
        authorId: userId,
        authorName: "",
        body,
        timeText: "…",
        dayKey: "pending",
        dayLabel: "",
      });
      formAction(fd);
    });
    setDraft("");
  };

  let lastDay = "";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RealtimeRefresh table="chat_messages" filter={`room_id=eq.${roomId}`} channelName={`console-chat-${roomId}`} />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {optimistic.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <div className="text-sm font-semibold">{labels.empty}</div>
            <p className="text-xs text-[var(--p-text-2)]">{labels.emptyHint}</p>
          </div>
        ) : (
          optimistic.map((m) => {
            const divider = m.dayKey !== "pending" && m.dayKey !== lastDay ? m.dayLabel : null;
            if (m.dayKey !== "pending") lastDay = m.dayKey;
            const mine = m.authorId === userId;
            return (
              <React.Fragment key={m.id}>
                {divider ? (
                  <div className="eyebrow py-1 text-center" role="separator">
                    {divider}
                  </div>
                ) : null}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-[var(--p-r-md)] border px-3 py-2 ${
                      mine
                        ? "border-transparent bg-[var(--p-accent)] text-[var(--p-accent-on)]"
                        : "border-[var(--p-border)] bg-[var(--p-surface)]"
                    }`}
                  >
                    {!mine && m.authorName ? (
                      <div className="text-[11px] font-semibold text-[var(--p-text-2)]">{m.authorName}</div>
                    ) : null}
                    <MessageBody body={m.body} refs={refs} mine={mine} />
                    <div
                      className={`mt-0.5 text-right font-mono text-[10px] ${
                        mine ? "opacity-80" : "text-[var(--p-text-3)]"
                      }`}
                    >
                      {m.timeText}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      {state?.error ? (
        <p role="alert" className="pt-2 text-xs text-[var(--p-danger-text)]">
          {state.error}
        </p>
      ) : null}
      <form
        ref={formRef}
        action={() => submit()}
        className="mt-3 flex items-end gap-2 border-t border-[var(--p-border)] pt-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder={labels.placeholder}
          className="ps-input min-h-[44px] flex-1 resize-y"
        />
        <button type="submit" className="ps-btn" disabled={pending || draft.trim().length === 0}>
          {pending ? labels.sending : labels.send}
        </button>
      </form>
    </div>
  );
}

/**
 * Message body with record-ref chips: tokens resolved server-side (doc
 * codes) render as deep-link chips; pasted /studio links chip even without
 * a lookup. Unresolved text stays plain — no fabricated links.
 */
function MessageBody({ body, refs, mine }: { body: string; refs: RecordRefMap; mine: boolean }) {
  const tokens = Object.keys(refs);
  const pattern =
    tokens.length > 0
      ? new RegExp(
          `(${[...tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), CHAT_URL_PATTERN.source].join("|")})`,
          "g",
        )
      : new RegExp(`(${CHAT_URL_PATTERN.source})`, "g");
  const parts = body.split(pattern);
  // Local, non-global copy — testing with the shared /g regex would mutate
  // its lastIndex during render.
  const urlTest = new RegExp(`^(?:${CHAT_URL_PATTERN.source})$`);
  return (
    <div className="text-sm break-words whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (!part) return null;
        const ref = refs[part];
        const isUrl = !ref && urlTest.test(part) && part.includes("/studio/");
        if (!ref && !isUrl) return <React.Fragment key={i}>{part}</React.Fragment>;
        const href = ref ? ref.href : part.slice(part.indexOf("/studio/"));
        const label = ref ? ref.label : href.split(/[?#]/)[0];
        return (
          <Link
            key={i}
            href={href}
            className={`mx-0.5 inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 align-middle font-mono text-[11px] font-semibold ${
              mine
                ? "border-[var(--p-accent-on)] text-[var(--p-accent-on)] underline-offset-2 hover:underline"
                : "border-[var(--p-border)] bg-[var(--p-bg)] text-[var(--p-accent-text)] hover:underline"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
