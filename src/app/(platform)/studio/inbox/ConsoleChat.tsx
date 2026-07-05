"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useOptimistic } from "react";
import { Copy } from "lucide-react";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { CHAT_URL_PATTERN, type RecordRefMap } from "./record-ref-types";
import { sendConsoleMessage, toggleReaction, type State } from "./actions";

export type MessageReaction = { emoji: string; count: number; mine: boolean };

export type ConsoleMessage = {
  id: string;
  authorId: string | null;
  authorName: string;
  body: string;
  timeText: string;
  dayKey: string;
  dayLabel: string;
  /** ISO timestamp — drives the unread jump line. Optimistic rows omit it. */
  createdAt?: string;
  reactions?: MessageReaction[];
};

export type ConsoleChatLabels = {
  placeholder: string;
  send: string;
  sending: string;
  empty: string;
  emptyHint: string;
  newMessages: string;
  addReaction: string;
  copy: string;
  copied: string;
};

/** The four curated reactions (kit 21 W5) — must match REACTION_EMOJI in actions.ts. */
const REACTIONS = ["👍", "❤️", "🎉", "👀"] as const;

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
  lastReadAt,
  labels,
}: {
  roomId: string;
  userId: string;
  messages: ConsoleMessage[];
  refs: RecordRefMap;
  /** Caller's last_read_at captured before the mark-read write; the first
   *  message newer than it (and not mine) gets the unread jump line. */
  lastReadAt: string | null;
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

  // Unread jump line — the first real (not-mine, not-optimistic) message
  // whose timestamp is newer than the caller's last_read_at.
  const firstUnreadId = React.useMemo(() => {
    if (!lastReadAt) return null;
    const cut = new Date(lastReadAt).getTime();
    const hit = messages.find((m) => m.authorId !== userId && m.createdAt && new Date(m.createdAt).getTime() > cut);
    return hit?.id ?? null;
  }, [messages, lastReadAt, userId]);

  let lastDay = "";
  let prevAuthor: string | null | undefined = undefined;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RealtimeRefresh table="chat_messages" filter={`room_id=eq.${roomId}`} channelName={`console-chat-${roomId}`} />
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
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
            // Group consecutive messages from the same author (day boundary
            // and the unread line both break a run): the follow-ons drop the
            // author label and tuck up tight.
            const unreadHere = m.id === firstUnreadId;
            const grouped = !divider && !unreadHere && prevAuthor === m.authorId;
            prevAuthor = m.authorId;
            return (
              <React.Fragment key={m.id}>
                {divider ? (
                  <div className="eyebrow py-1 text-center" role="separator">
                    {divider}
                  </div>
                ) : null}
                {unreadHere ? (
                  <div className="flex items-center gap-2 py-1" role="separator" aria-label={labels.newMessages}>
                    <span className="h-px flex-1 bg-[var(--p-accent)]" />
                    <span className="eyebrow text-[var(--p-accent-text)]">{labels.newMessages}</span>
                    <span className="h-px flex-1 bg-[var(--p-accent)]" />
                  </div>
                ) : null}
                <div className={`group/msg flex ${grouped ? "mt-0.5" : "mt-2"} ${mine ? "justify-end" : "justify-start"}`}>
                  <Message
                    m={m}
                    mine={mine}
                    grouped={grouped}
                    refs={refs}
                    labels={labels}
                    isPending={m.dayKey === "pending"}
                  />
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
 * One message: the bubble, a hover action toolbar (react · copy), and the
 * reaction tally row. Optimistic (pending) rows show the bubble only —
 * reactions/copy light up once the row is real.
 */
function Message({
  m,
  mine,
  grouped,
  refs,
  labels,
  isPending,
}: {
  m: ConsoleMessage;
  mine: boolean;
  grouped: boolean;
  refs: RecordRefMap;
  labels: ConsoleChatLabels;
  isPending: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = React.useCallback(() => {
    void navigator.clipboard?.writeText(m.body).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => {},
    );
  }, [m.body]);

  const react = (emoji: string) => React.startTransition(() => void toggleReaction(m.id, emoji));

  return (
    <div className={`flex max-w-[75%] flex-col ${mine ? "items-end" : "items-start"}`}>
      <div className={`flex items-center gap-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
        <div
          className={`rounded-[var(--p-r-md)] border px-3 py-2 ${
            mine
              ? "border-transparent bg-[var(--p-accent)] text-[var(--p-accent-on)]"
              : "border-[var(--p-border)] bg-[var(--p-surface)]"
          }`}
        >
          {!mine && !grouped && m.authorName ? (
            <div className="text-[11px] font-semibold text-[var(--p-text-2)]">{m.authorName}</div>
          ) : null}
          <MessageBody body={m.body} refs={refs} mine={mine} />
          <div className={`mt-0.5 text-right font-mono text-[10px] ${mine ? "opacity-80" : "text-[var(--p-text-3)]"}`}>
            {m.timeText}
          </div>
        </div>
        {!isPending ? (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => react(emoji)}
                aria-label={`${labels.addReaction} ${emoji}`}
                className="rounded p-0.5 text-xs leading-none hover:bg-[var(--p-surface-2,var(--p-bg))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)]"
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? labels.copied : labels.copy}
              className="rounded p-0.5 text-[var(--p-text-3)] hover:bg-[var(--p-surface-2,var(--p-bg))] hover:text-[var(--p-text-1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)]"
            >
              <Copy size={12} />
            </button>
          </div>
        ) : null}
      </div>
      {m.reactions && m.reactions.length > 0 ? (
        <div className={`mt-0.5 flex flex-wrap gap-1 ${mine ? "justify-end" : "justify-start"}`}>
          {m.reactions.map((r) => (
            <button
              key={r.emoji}
              type="button"
              onClick={() => react(r.emoji)}
              className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] leading-none ${
                r.mine
                  ? "border-[var(--p-accent)] bg-[var(--p-accent-weak,var(--p-surface))] text-[var(--p-accent-text)]"
                  : "border-[var(--p-border)] bg-[var(--p-surface)] text-[var(--p-text-2)]"
              }`}
            >
              <span>{r.emoji}</span>
              <span className="font-mono tabular-nums">{r.count}</span>
            </button>
          ))}
        </div>
      ) : null}
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
