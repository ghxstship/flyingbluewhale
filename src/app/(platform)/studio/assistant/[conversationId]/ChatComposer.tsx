"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";

type ChatTurn = {
  id: string;
  role: string;
  content: string;
};

type Model = "claude-opus-4-7" | "claude-sonnet-4-6";

const MODEL_OPTIONS: ReadonlyArray<{ value: Model; label: string }> = [
  { value: "claude-sonnet-4-6", label: "Sonnet 4.6 (fast)" },
  { value: "claude-opus-4-7", label: "Opus 4.7 (deep)" },
];

/**
 * Client composer for the AI co-pilot conversation detail. POSTs to the
 * existing /api/v1/ai/chat SSE route and renders the streamed reply live,
 * appending to the server-rendered transcript. RLS + the route's per-user
 * conversation pin are the authorization boundary — this island only
 * carries the conversationId the server already authorized.
 */
export function ChatComposer({
  conversationId,
  initialTurns,
}: {
  conversationId: string;
  initialTurns: ChatTurn[];
}) {
  const router = useRouter();
  const [turns, setTurns] = useState<ChatTurn[]>(initialTurns);
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState<Model>("claude-sonnet-4-6");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollToEnd() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function send() {
    const message = draft.trim();
    if (!message || busy) return;
    setError(null);
    setBusy(true);
    setDraft("");
    setTurns((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", content: message }]);
    setStreaming("");
    scrollToEnd();

    let acc = "";
    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId, message, model }),
      });

      if (!res.ok || !res.body) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error?.message ?? detail?.message ?? "The assistant could not respond.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line; each frame is one or
        // more `field: value` lines. Parse complete frames, keep the tail.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          let eventName = "message";
          let dataLine = "";
          for (const line of frame.split("\n")) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
          }
          if (!dataLine) continue;
          let payload: { text?: string; message?: string } = {};
          try {
            payload = JSON.parse(dataLine);
          } catch {
            continue;
          }
          if (eventName === "delta" && payload.text) {
            acc += payload.text;
            setStreaming(acc);
            scrollToEnd();
          } else if (eventName === "error") {
            throw new Error(payload.message ?? "Stream failed.");
          }
        }
      }

      setTurns((prev) => [...prev, { id: `local-a-${Date.now()}`, role: "assistant", content: acc }]);
      setStreaming("");
      // Re-sync the server transcript (persisted rows, real ids, title).
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The assistant could not respond.");
      if (acc) {
        setTurns((prev) => [...prev, { id: `local-a-${Date.now()}`, role: "assistant", content: acc }]);
        setStreaming("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        ref={scrollRef}
        className="surface-inset max-h-[60vh] space-y-3 overflow-y-auto rounded-lg p-4"
        aria-live="polite"
      >
        {turns.length === 0 && !streaming ? (
          <EmptyState
            size="compact"
            title="No messages yet"
            description="Ask the assistant about your projects, invoices, deliverables, or crew."
          />
        ) : null}
        {turns.map((turn) => (
          <ChatBubble key={turn.id} messageRole={turn.role} content={turn.content} />
        ))}
        {streaming ? <ChatBubble messageRole="assistant" content={streaming} streaming /> : null}
        {busy && !streaming ? (
          /* kit-ai.css thinking indicator (W5, F-28) — tool-running dots */
          <p className="ai-think" role="status" aria-label="Thinking">
            <i />
            <i />
            <i />
          </p>
        ) : null}
      </div>

      {error ? <Alert kind="error">{error}</Alert> : null}

      <div className="flex items-end gap-2">
        <textarea
          className="ps-input min-h-[2.75rem] flex-1 resize-y"
          rows={2}
          placeholder="Message the assistant…"
          value={draft}
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void send();
            }
          }}
          aria-label="Message the assistant"
        />
        <div className="flex flex-col gap-2">
          <select
            className="ps-input"
            value={model}
            disabled={busy}
            onChange={(e) => setModel(e.target.value as Model)}
            aria-label="Model"
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <Button onClick={() => void send()} disabled={busy || draft.trim().length === 0} size="sm">
            {busy ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
      <p className="font-mono text-[11px] text-[var(--p-text-3)]">⌘/Ctrl + Enter to send</p>
    </div>
  );
}

function ChatBubble({
  messageRole,
  content,
  streaming = false,
}: {
  messageRole: string;
  content: string;
  streaming?: boolean;
}) {
  const isUser = messageRole === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg bg-[var(--p-accent)] px-3 py-2 text-sm whitespace-pre-wrap text-[var(--p-accent-contrast,white)]">
          {content}
        </div>
      </div>
    );
  }
  // kit-ai.css adoption (W5, F-28): assistant turns are `.ai-msg` agentic
  // answer cards; a live reply shimmers via `.ai-stream` until the frame
  // settles into the persisted transcript.
  return (
    <div className="flex justify-start">
      <div className="ai-msg max-w-[80%]">
        <div className="ai-msg__head">{messageRole}</div>
        <div className="ai-msg__body whitespace-pre-wrap">
          {streaming ? <span className="ai-stream">{content}</span> : content}
        </div>
      </div>
    </div>
  );
}
