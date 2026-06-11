"use client";

import { useActionState, useEffect, useLayoutEffect, useOptimistic, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { postMessage, markRoomRead, type State } from "../actions";

// Keep in sync with the initial fetch size in page.tsx.
const MESSAGES_PAGE_SIZE = 50;

export type ChatMessage = {
  id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

type OptimisticMessage = ChatMessage & { pending?: boolean };

export type ChatRoomLabels = {
  placeholder: string;
  send: string;
  loadOlder: string;
  loadingOlder: string;
};

function SendButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className="ps-btn ps-btn--sm disabled:opacity-60">
      {label}
    </button>
  );
}

function mergeById(existing: OptimisticMessage[], incoming: ChatMessage[]): OptimisticMessage[] {
  const seen = new Set(existing.map((m) => m.id));
  const fresh = incoming.filter((m) => !seen.has(m.id));
  return fresh.length === 0 ? existing : [...existing, ...fresh];
}

/**
 * Client island for a chat room: optimistic send, direct Supabase Realtime
 * INSERT subscription (no full RSC refresh per message), cursor-based
 * "Load Older" pagination, and scroll-to-bottom on new messages.
 *
 * Reconciliation: an optimistic row (temp id, `pending: true`) is layered by
 * `useOptimistic` over the confirmed list. The server action echoes the
 * inserted row back, which is merged into the confirmed list — so when the
 * optimistic layer rebases there is no flicker. Realtime INSERTs (own or
 * others') dedupe by id against the confirmed list. RLS scopes the
 * subscription to rows this user may read.
 */
export function ChatRoom({
  roomId,
  userId,
  locale,
  timezone,
  initialMessages,
  initialHasOlder,
  labels,
  emptyTitle,
  emptyDescription,
}: {
  roomId: string;
  userId: string;
  locale: Locale;
  timezone: string;
  /** Chronological ascending — the latest page, already reversed by the server. */
  initialMessages: ChatMessage[];
  initialHasOlder: boolean;
  labels: ChatRoomLabels;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [messages, setMessages] = useState<OptimisticMessage[]>(initialMessages);
  const [hasOlder, setHasOlder] = useState(initialHasOlder);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");

  const [optimisticMessages, addOptimistic] = useOptimistic(messages, (current, next: OptimisticMessage) => [
    ...current,
    next,
  ]);

  const listRef = useRef<HTMLUListElement>(null);
  // When "Load Older" prepends rows we restore the previous scroll offset
  // instead of jumping; this ref carries the pre-prepend scrollHeight.
  const prependAdjustRef = useRef<number | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formState, formAction] = useActionState<State, FormData>(async (prev, fd) => {
    const body = String(fd.get("body") ?? "").trim();
    if (!body) return null;
    addOptimistic({
      id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      author_id: userId,
      body,
      created_at: new Date().toISOString(),
      pending: true,
    });
    setDraft("");
    const result = await postMessage(prev, fd);
    if (result?.sent) {
      const sent = result.sent;
      setMessages((current) => mergeById(current, [sent]));
    } else if (result?.error) {
      // Restore the draft so a failed send is never silently swallowed.
      setDraft(body);
    }
    return result;
  }, null);

  // Realtime: append INSERTs for this room directly — no router.refresh.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`m-inbox-room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((current) => mergeById(current, [row]));
          // Debounced mark-read so the unread badge stays honest while the
          // room is open. Best-effort — failures are non-fatal.
          if (row.author_id !== userId) {
            if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
            markReadTimerRef.current = setTimeout(() => {
              void markRoomRead({ roomId }).catch(() => {});
            }, 2000);
          }
        },
      )
      .subscribe();
    return () => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  // Scroll management: restore offset after a prepend; otherwise scroll to
  // the bottom when the newest message changes (instant on mount, smooth
  // after — unless the user prefers reduced motion).
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (prependAdjustRef.current != null) {
      el.scrollTop += el.scrollHeight - prependAdjustRef.current;
      prependAdjustRef.current = null;
      return;
    }
    const lastId = optimisticMessages[optimisticMessages.length - 1]?.id ?? null;
    if (lastId === lastMessageIdRef.current) return;
    const isMount = lastMessageIdRef.current === null;
    lastMessageIdRef.current = lastId;
    if (lastId === null) return;
    const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: isMount || reduceMotion ? "auto" : "smooth" });
  }, [optimisticMessages]);

  async function loadOlder() {
    if (loadingOlder || !hasOlder) return;
    const oldest = messages[0]?.created_at;
    if (!oldest) return;
    setLoadingOlder(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, author_id, body, created_at")
        .eq("room_id", roomId)
        .lt("created_at", oldest)
        .order("created_at", { ascending: false })
        .limit(MESSAGES_PAGE_SIZE);
      if (!error && data) {
        const older = ([...data] as ChatMessage[]).reverse();
        prependAdjustRef.current = listRef.current?.scrollHeight ?? null;
        setMessages((current) => {
          const seen = new Set(current.map((m) => m.id));
          return [...older.filter((m) => !seen.has(m.id)), ...current];
        });
        setHasOlder(data.length === MESSAGES_PAGE_SIZE);
      }
    } finally {
      setLoadingOlder(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {optimisticMessages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4">
          <EmptyState size="compact" title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <ul ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {hasOlder && (
            <li className="flex justify-center pb-1">
              <button
                type="button"
                onClick={() => void loadOlder()}
                disabled={loadingOlder}
                className="rounded-md border border-[var(--p-border)] px-3 py-1 text-xs text-[var(--p-text-2)] disabled:opacity-60"
              >
                {loadingOlder ? labels.loadingOlder : labels.loadOlder}
              </button>
            </li>
          )}
          {optimisticMessages.map((m) => {
            const mine = m.author_id === userId;
            return (
              <li key={m.id} className={mine ? "flex justify-end" : "flex"}>
                <div
                  className={
                    (mine
                      ? "max-w-[80%] rounded-lg bg-[var(--p-accent)] px-3 py-2 text-xs text-[var(--p-accent-contrast)]"
                      : "surface max-w-[80%] px-3 py-2 text-xs") + (m.pending ? " opacity-60" : "")
                  }
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <span className="mt-1 block text-[10px] opacity-70">
                    {formatTime(m.created_at, { locale, timezone })}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="border-t border-[var(--p-border)] p-3">
        {formState?.error && (
          <p role="alert" className="mb-2 text-xs text-[var(--error)]">
            {formState.error}
          </p>
        )}
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="roomId" value={roomId} />
          <input
            type="text"
            name="body"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={labels.placeholder}
            required
            maxLength={4000}
            className="flex-1 rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-sm"
          />
          <SendButton label={labels.send} />
        </form>
      </div>
    </div>
  );
}
