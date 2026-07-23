"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useOptimistic } from "react";
import { Copy } from "lucide-react";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { CHAT_URL_PATTERN, type RecordRefMap } from "./record-ref-types";
import { loadEarlierMessages, markRoomRead, sendConsoleMessage, toggleReaction, type State } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
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
  loadEarlier: string;
  loadingEarlier: string;
};

/** The four curated reactions (kit 21 W5) — must match REACTION_EMOJI in actions.ts. */
const REACTIONS = ["👍", "❤️", "🎉", "👀"] as const;

/**
 * Console chat thread (kit 20 Inbox M1) — the two-pane inbox's right pane.
 * Optimistic send reconciled by the realtime INSERT (RealtimeRefresh nudges
 * a server re-render, which also re-resolves record-ref chips for new
 * messages). Enter sends, Shift+Enter breaks the line.
 */
export type ChatMember = { id: string; label: string };

export function ConsoleChat({
  roomId,
  userId,
  messages,
  refs,
  lastReadAt,
  hasMoreEarlier = false,
  people,
  labels,
}: {
  roomId: string;
  userId: string;
  messages: ConsoleMessage[];
  refs: RecordRefMap;
  /** Caller's last_read_at captured server-side; the first message newer
   *  than it (and not mine) gets the unread jump line. The read cursor is
   *  advanced by a client-fired action on mount (audit A-36), never as a
   *  GET-render side effect. */
  lastReadAt: string | null;
  /** True when the initial window did not reach the start of the thread —
   *  surfaces the "Load earlier messages" control (audit A-11). */
  hasMoreEarlier?: boolean;
  /** Org people for @mention typeahead + highlight (kit 21 W5). */
  people: ChatMember[];
  labels: ConsoleChatLabels;
}) {
  const [draft, setDraft] = React.useState("");
  const [state, formAction, pending] = useActionState<State, FormData>(sendConsoleMessage, null);
  const resolveErr = useActionErrorResolver();
  const [optimistic, addOptimistic] = useOptimistic(messages, (cur, next: ConsoleMessage) => [...cur, next]);
  const formRef = React.useRef<HTMLFormElement>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Older history loaded through the cursor action, prepended to the
  // server-rendered window (audit A-11). Record-ref chips for those rows
  // ride along in extraRefs.
  const [earlier, setEarlier] = React.useState<ConsoleMessage[]>([]);
  const [extraRefs, setExtraRefs] = React.useState<RecordRefMap>({});
  const [hasMore, setHasMore] = React.useState(hasMoreEarlier);
  const [loadingEarlier, setLoadingEarlier] = React.useState(false);

  // Rooms are swapped in place via `?room=` — reset the pagination state
  // when the thread changes.
  React.useEffect(() => {
    setEarlier([]);
    setExtraRefs({});
    setHasMore(hasMoreEarlier);
  }, [roomId, hasMoreEarlier]);

  // Advance my read cursor from the client (audit A-36): on mount, and
  // again whenever new messages land while the thread is open.
  React.useEffect(() => {
    void markRoomRead(roomId);
  }, [roomId, messages.length]);

  const loadEarlier = async () => {
    if (loadingEarlier) return;
    const oldest = earlier[0]?.createdAt ?? messages[0]?.createdAt;
    if (!oldest) return;
    setLoadingEarlier(true);
    try {
      const result = await loadEarlierMessages(roomId, oldest);
      if ("error" in result) return;
      const el = scrollRef.current;
      const prevHeight = el?.scrollHeight ?? 0;
      setEarlier((cur) => [...result.messages, ...cur]);
      setExtraRefs((cur) => ({ ...cur, ...result.refs }));
      setHasMore(result.hasMore);
      // Keep the viewport anchored on the message the reader was looking
      // at — prepended content would otherwise shove it out of view.
      requestAnimationFrame(() => {
        if (el) el.scrollTop += el.scrollHeight - prevHeight;
      });
    } finally {
      setLoadingEarlier(false);
    }
  };

  const allRefs = React.useMemo(() => ({ ...extraRefs, ...refs }), [extraRefs, refs]);
  const timeline = React.useMemo(() => [...earlier, ...optimistic], [earlier, optimistic]);

  // @mention typeahead — when the word at the caret starts with "@", surface
  // a member picker; selecting inserts "@Full Name ". `mentionNames` drives
  // the highlight of @mentions in rendered messages.
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);
  const [mentionIdx, setMentionIdx] = React.useState(0);
  const mentionNames = React.useMemo(() => people.map((p) => p.label), [people]);
  const mentionMatches = React.useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return people.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionQuery, people]);

  const syncMention = (value: string, caret: number) => {
    // The token being typed: from the last "@" back to a whitespace boundary.
    const upto = value.slice(0, caret);
    const at = upto.lastIndexOf("@");
    if (at === -1) return setMentionQuery(null);
    const between = upto.slice(at + 1);
    // A mention token has no whitespace and follows start-of-line or a space.
    if (/\s/.test(between) || (at > 0 && !/\s/.test(value[at - 1]!))) return setMentionQuery(null);
    setMentionQuery(between);
    setMentionIdx(0);
  };

  const applyMention = (member: ChatMember) => {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? draft.length;
    const upto = draft.slice(0, caret);
    const at = upto.lastIndexOf("@");
    if (at === -1) return;
    const next = `${draft.slice(0, at)}@${member.label} ${draft.slice(caret)}`;
    setDraft(next);
    setMentionQuery(null);
    // Restore focus + place caret after the inserted mention.
    requestAnimationFrame(() => {
      const pos = at + member.label.length + 2;
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  };

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
      {/* role="log" + polite live region (audit A-12) — incoming messages
          are announced to screen readers instead of landing silently. */}
      <div ref={scrollRef} role="log" aria-live="polite" className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {hasMore ? (
          <div className="pb-1 text-center">
            <button
              type="button"
              onClick={() => void loadEarlier()}
              disabled={loadingEarlier}
              className="ps-btn ps-btn--sm"
            >
              {loadingEarlier ? labels.loadingEarlier : labels.loadEarlier}
            </button>
          </div>
        ) : null}
        {timeline.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <div className="text-sm font-semibold">{labels.empty}</div>
            <p className="text-xs text-[var(--p-text-2)]">{labels.emptyHint}</p>
          </div>
        ) : (
          timeline.map((m) => {
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
                    refs={allRefs}
                    mentionNames={mentionNames}
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
          {resolveErr(state.error)}
        </p>
      ) : null}
      <form
        ref={formRef}
        action={() => submit()}
        className="mt-3 flex items-end gap-2 border-t border-[var(--p-border)] pt-3"
      >
        <div className="relative flex-1">
          {mentionQuery !== null && mentionMatches.length > 0 ? (
            <ul
              role="listbox"
              className="absolute bottom-full z-[var(--p-z-popover)] mb-1 max-h-48 w-full overflow-y-auto rounded-[var(--p-r-md)] border border-[var(--p-border)] bg-[var(--p-surface)] p-1 shadow-lg"
            >
              {mentionMatches.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === mentionIdx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyMention(p);
                    }}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-start text-sm ${
                      i === mentionIdx ? "bg-[var(--p-accent-weak,var(--p-surface))]" : "hover:bg-[var(--p-surface)]"
                    }`}
                  >
                    <span className="text-[var(--p-accent-text)]">@</span>
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              syncMention(e.target.value, e.target.selectionStart ?? e.target.value.length);
            }}
            onKeyDown={(e) => {
              if (mentionQuery !== null && mentionMatches.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMentionIdx((n) => (n + 1) % mentionMatches.length);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMentionIdx((n) => (n - 1 + mentionMatches.length) % mentionMatches.length);
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  applyMention(mentionMatches[mentionIdx]!);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setMentionQuery(null);
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder={labels.placeholder}
            className="ps-input min-h-[44px] w-full resize-y"
          />
        </div>
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
  mentionNames,
  labels,
  isPending,
}: {
  m: ConsoleMessage;
  mine: boolean;
  grouped: boolean;
  refs: RecordRefMap;
  mentionNames: string[];
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
          <MessageBody body={m.body} refs={refs} mine={mine} mentionNames={mentionNames} />
          <div className={`mt-0.5 text-right font-mono text-[11px] ${mine ? "opacity-80" : "text-[var(--p-text-3)]"}`}>
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
                className="rounded p-0.5 text-xs leading-none hover:bg-[var(--p-surface-2,var(--p-bg))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-focus)]"
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? labels.copied : labels.copy}
              className="rounded p-0.5 text-[var(--p-text-3)] hover:bg-[var(--p-surface-2,var(--p-bg))] hover:text-[var(--p-text-1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-focus)]"
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
function MessageBody({
  body,
  refs,
  mine,
  mentionNames,
}: {
  body: string;
  refs: RecordRefMap;
  mine: boolean;
  mentionNames: string[];
}) {
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
  // Longest-first so "@Jane Doe" wins over a stray "@Jane".
  const mentionRe =
    mentionNames.length > 0
      ? new RegExp(
          `(@(?:${mentionNames
            .slice()
            .sort((a, b) => b.length - a.length)
            .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("|")}))`,
          "g",
        )
      : null;
  return (
    <div className="text-sm break-words whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (!part) return null;
        const ref = refs[part];
        const isUrl = !ref && urlTest.test(part) && part.includes("/studio/");
        if (!ref && !isUrl) return <React.Fragment key={i}>{renderMentions(part, mentionRe, mine, i)}</React.Fragment>;
        const href = ref ? ref.href : part.slice(part.indexOf("/studio/"));
        const label = ref ? ref.label : (href ?? part).split(/[?#]/)[0];
        const chipClass = `mx-0.5 inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 align-middle font-mono text-[11px] font-semibold ${
          mine
            ? "border-[var(--p-accent-on)] text-[var(--p-accent-on)] underline-offset-2 hover:underline"
            : "border-[var(--p-border)] bg-[var(--p-bg)] text-[var(--p-accent-text)] hover:underline"
        }`;
        // A record with no route in this shell (href null) still chips — it
        // just doesn't navigate (ADR-0015 shell-route-map).
        return href ? (
          <Link key={i} href={href} className={chipClass}>
            {label}
          </Link>
        ) : (
          <span key={i} className={chipClass.replace("hover:underline", "")}>
            {label}
          </span>
        );
      })}
    </div>
  );
}

/** Highlight @mentions of known members inside a plain-text fragment.
 *  split() with a single capturing group yields [text, mention, text, …], so
 *  odd indices are the captured @mentions — no re-testing needed. */
function renderMentions(text: string, mentionRe: RegExp | null, mine: boolean, keyBase: number): React.ReactNode {
  if (!mentionRe) return text;
  const segs = text.split(mentionRe);
  return segs.map((seg, j) => {
    if (!seg) return null;
    if (j % 2 === 1) {
      return (
        <span
          key={`${keyBase}-${j}`}
          className={`rounded px-0.5 font-semibold ${mine ? "text-[var(--p-accent-on)]" : "text-[var(--p-accent-text)]"}`}
        >
          {seg}
        </span>
      );
    }
    return <React.Fragment key={`${keyBase}-${j}`}>{seg}</React.Fragment>;
  });
}
