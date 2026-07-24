"use client";

import { startTransition, useActionState, useEffect, useLayoutEffect, useOptimistic, useRef, useState } from "react";
import Link from "next/link";
import { Paperclip, Send } from "lucide-react";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { OfflineSyncBanner } from "@/components/mobile/OfflineSyncBanner";
import { AttachmentChip } from "@/components/chat/AttachmentChip";
import { useOfflineQueue } from "@/lib/offline/useOfflineQueue";
import { sendChatAttachment } from "@/lib/chat/attachment-actions";
import { parseAttachments } from "@/lib/chat/attachment-types";
import { createClient } from "@/lib/supabase/client";
import { formatTime, formatDate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { sendMessage, type State } from "./actions";

/** Stable YYYY-MM-DD day key in the viewer's timezone (day-divider grouping). */
function dayKeyOf(iso: string, locale: Locale, timezone: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso),
  );
}

export type ChatMessage = {
  id: string;
  author_id: string | null;
  body: string;
  attachments?: unknown;
  created_at: string;
};

type OptimisticMessage = ChatMessage & { pending?: boolean };

export type ChatRoomLabels = {
  placeholder: string;
  send: string;
  today: string;
  empty: string;
  emptyHint: string;
  offline: string;
  queued: string;
  syncingLabel: string;
};

function mergeById(existing: OptimisticMessage[], incoming: ChatMessage[]): OptimisticMessage[] {
  const seen = new Set(existing.map((m) => m.id));
  const fresh = incoming.filter((m) => !seen.has(m.id));
  return fresh.length === 0 ? existing : [...existing, ...fresh];
}

/**
 * COMPVSS chat thread island. Renders the kit `.bubbles` / `.bub` thread + a
 * sticky `.composer`, posts through the surviving `sendMessage` server action
 * (optimistic append, reconciled by the realtime INSERT), and mounts
 * `RealtimeRefresh` so peers' messages arrive without a manual reload.
 */
export function ChatRoom({
  roomId,
  userId,
  locale,
  timezone,
  initialMessages,
  refs,
  labels,
}: {
  roomId: string;
  userId: string;
  locale: Locale;
  timezone: string;
  initialMessages: ChatMessage[];
  /** Record-ref chip map (kit 21 R1) — token → shell-mapped href + label. */
  refs: Record<string, { href: string | null; label: string }>;
  labels: ChatRoomLabels;
}) {
  const [messages, setMessages] = useState<OptimisticMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [optimistic, addOptimistic] = useOptimistic(messages, (cur, next: OptimisticMessage) => [
    ...cur,
    next,
  ]);

  const listRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);

  // Offline outbox (kit 21 W8) — a send made with no signal is queued and
  // replays on reconnect. The pending bubble lives in `messages` (durable,
  // unlike useOptimistic which reverts) tagged `offline-`; once the queue
  // drains, realtime brings the real rows and we drop the offline stand-ins.
  const {
    online,
    pending: queued,
    syncing,
    submit: queueSubmit,
  } = useOfflineQueue<{ roomId: string; body: string }>(`chat:${roomId}`, async (p) => {
    const fd = new FormData();
    fd.set("roomId", p.roomId);
    fd.set("body", p.body);
    const res = await sendMessage(null, fd);
    return !res?.error;
  });
  useEffect(() => {
    if (queued === 0) setMessages((cur) => cur.filter((m) => !m.id.startsWith("offline-")));
  }, [queued]);

  const [formState, formAction, pending] = useActionState<State, FormData>(async (prev, fd) => {
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
    const result = await sendMessage(prev, fd);
    // On error restore the draft so the send is never silently swallowed.
    if (result?.error) setDraft(body);
    return result;
  }, null);

  // Realtime: append INSERTs for this room directly so the optimistic row is
  // reconciled (dedup by id) and peers' messages stream in.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`m-inbox-room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => setMessages((cur) => mergeById(cur, [payload.new as ChatMessage])),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Scroll to bottom whenever the newest message changes.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const lastId = optimistic[optimistic.length - 1]?.id ?? null;
    if (lastId === lastIdRef.current) return;
    const isMount = lastIdRef.current === null;
    lastIdRef.current = lastId;
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: isMount || reduce ? "auto" : "smooth" });
  }, [optimistic]);

  return (
    <>
      {/* Soft RSC refresh keeps the server-marked read-state + ordering fresh. */}
      <RealtimeRefresh
        table="chat_messages"
        filter={`room_id=eq.${roomId}`}
        channelName={`m-inbox-refresh-${roomId}`}
        event="INSERT"
      />

      <div className="bubbles chat-msgs" ref={listRef}>
        {optimistic.length === 0 ? (
          <div className="hint" style={{ textAlign: "center", padding: "24px 8px" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{labels.empty}</div>
            {labels.emptyHint}
          </div>
        ) : (
          <>
            {(() => {
              const todayKey = dayKeyOf(new Date().toISOString(), locale, timezone);
              let lastDay = "";
              return optimistic.map((m) => {
                const mine = m.author_id === userId;
                const key = dayKeyOf(m.created_at, locale, timezone);
                const divider = key !== lastDay ? key : null;
                lastDay = key;
                return (
                  <div key={m.id} className="contents">
                    {divider ? (
                      <div className="daysep">
                        {divider === todayKey ? labels.today : formatDate(m.created_at, { locale, timezone })}
                      </div>
                    ) : null}
                    <div className={`bub ${mine ? "me" : "them"}`} style={m.pending ? { opacity: 0.6 } : undefined}>
                      {(() => {
                        const atts = parseAttachments(m.attachments);
                        if (atts.length > 0) {
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {atts.map((a) => (
                                <AttachmentChip key={a.path} attachment={a} />
                              ))}
                            </div>
                          );
                        }
                        return <MobileMessageBody body={m.body} refs={refs} />;
                      })()}
                      <div className="bt">{formatTime(m.created_at, { locale, timezone })}</div>
                    </div>
                  </div>
                );
              });
            })()}
          </>
        )}
      </div>

      {formState?.error && (
        <div className="import-note" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "var(--p-danger)" }}>{formState.error}</span>
        </div>
      )}

      <OfflineSyncBanner
        online={online}
        pending={queued}
        syncing={syncing}
        labels={{
          offline: labels.offline,
          queued: labels.queued,
          syncing: labels.syncingLabel,
        }}
      />

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (!body || pending) return;
          if (online) {
            // Unchanged online path — useActionState optimistic + realtime.
            const fd = new FormData();
            fd.set("roomId", roomId);
            fd.set("body", body);
            startTransition(() => formAction(fd));
            return;
          }
          // Offline: durable optimistic bubble + enqueue for replay.
          const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          setMessages((cur) => [
            ...cur,
            { id, author_id: userId, body, created_at: new Date().toISOString(), pending: true },
          ]);
          void queueSubmit(id, { roomId, body });
          setDraft("");
        }}
      >
        {/* Attachments need connectivity (the file has to travel now); the
            offline outbox stays text-only, so the clip disables offline. */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: "none" }}
          aria-hidden
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file || attaching) return;
            setAttachError(null);
            setAttaching(true);
            startTransition(async () => {
              const fd = new FormData();
              fd.set("roomId", roomId);
              fd.set("revalidate", `/m/inbox/${roomId}`);
              fd.set("file", file);
              const res = await sendChatAttachment(null, fd);
              if (res?.error) setAttachError(res.error);
              setAttaching(false);
            });
          }}
        />
        <button
          type="button"
          disabled={!online || attaching}
          aria-label="Attach"
          onClick={() => fileRef.current?.click()}
          style={attaching ? { opacity: 0.5 } : undefined}
        >
          <Paperclip size={17} />
        </button>
        <input
          className="box"
          name="body"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={labels.placeholder}
          maxLength={4000}
          autoComplete="off"
          aria-label={labels.placeholder}
        />
        <button type="submit" disabled={pending || !draft.trim()} aria-label={labels.send}>
          <Send size={17} />
        </button>
      </form>
      {attachError && (
        <div className="import-note" style={{ marginTop: 6 }}>
          <span style={{ fontSize: 12, color: "var(--p-danger)" }}>{attachError}</span>
        </div>
      )}
    </>
  );
}

/**
 * Record-ref chips in a field message (kit 21 R1). Splits the body on the
 * resolved ref tokens and renders each as a chip — a Link when the record has
 * a route in this shell (href set), else an unlinked badge (still signals
 * "this is a record" without a broken cross-shell jump).
 */
function MobileMessageBody({
  body,
  refs,
}: {
  body: string;
  refs: Record<string, { href: string | null; label: string }>;
}) {
  const tokens = Object.keys(refs);
  if (tokens.length === 0) return <>{body}</>;
  const pattern = new RegExp(`(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = body.split(pattern);
  return (
    <>
      {parts.map((part, i) => {
        const ref = refs[part];
        if (!ref) return <span key={i}>{part}</span>;
        const cls = "refchip";
        return ref.href ? (
          <Link key={i} href={ref.href} className={cls}>
            {ref.label}
          </Link>
        ) : (
          <span key={i} className={cls}>
            {ref.label}
          </span>
        );
      })}
    </>
  );
}
