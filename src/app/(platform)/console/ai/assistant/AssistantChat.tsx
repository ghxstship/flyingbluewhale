"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Square, RefreshCw, Copy, User, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Hint } from "@/components/ui/Tooltip";
import { useAnnounce } from "@/components/ui/LiveRegion";

type Message = { role: "user" | "assistant"; content: string };
type Model = "claude-sonnet-4-6" | "claude-opus-4-7";

const MODELS: Array<{ id: Model; label: string; cost: string }> = [
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6", cost: "Fast · low cost" },
  { id: "claude-opus-4-7", label: "Opus 4.7", cost: "Deep reasoning" },
];

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [model, setModel] = useState<Model>("claude-sonnet-4-6");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const announce = useAnnounce();

  // Auto-scroll on new content unless user has scrolled up
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function streamMessage(text: string) {
    const abort = new AbortController();
    abortRef.current = abort;
    setStreaming(true);
    announce("Generating response", "polite");

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId, message: text, model }),
        signal: abort.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const lines = part.split("\n");
          const event = lines.find((l) => l.startsWith("event:"))?.slice(6).trim();
          const dataLine = lines.find((l) => l.startsWith("data:"))?.slice(5).trim();
          if (!dataLine) continue;
          const data = JSON.parse(dataLine) as Record<string, unknown>;
          if (event === "start" && typeof data.conversationId === "string") {
            setConversationId(data.conversationId);
          }
          if (event === "delta" && typeof data.text === "string") {
            const chunk = data.text;
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                copy[copy.length - 1] = { ...last, content: last.content + chunk };
              }
              return copy;
            });
          }
          if (event === "error" && typeof data.message === "string") toast.error(data.message);
        }
      }
      announce("Response complete", "polite");
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        announce("Stopped", "polite");
        return;
      }
      toast.error(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    await streamMessage(text);
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function regenerate() {
    if (streaming) return;
    // Find last user turn
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const idx = messages.length - 1 - lastUserIdx;
    const text = messages[idx].content;
    // Truncate everything after the last user message, then re-stream
    setMessages((m) => [...m.slice(0, idx + 1), { role: "assistant", content: "" }]);
    await streamMessage(text);
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const lastIsAssistant = messages[messages.length - 1]?.role === "assistant";

  return (
    <div className="surface-raised flex h-[70vh] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Sparkles size={12} className="text-[var(--org-primary)]" aria-hidden="true" />
          AI assistant
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="model-select">Model</label>
          <select
            id="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value as Model)}
            className="rounded border border-[var(--border-color)] bg-[var(--surface)] px-2 py-1 text-xs"
            disabled={streaming}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label} — {m.cost}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <EmptyHints onPick={(s) => { setInput(s); }} />
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-inset)] text-[var(--org-primary)]">
                  <Sparkles size={12} />
                </div>
              )}
              <div
                className={`group max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-[var(--org-primary)] text-[var(--background)]"
                    : "bg-[var(--surface-inset)] text-[var(--foreground)]"
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {m.content || (
                    <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                      <span className="motion-safe:animate-pulse">●</span>
                      <span className="motion-safe:animate-pulse" style={{ animationDelay: "150ms" }}>●</span>
                      <span className="motion-safe:animate-pulse" style={{ animationDelay: "300ms" }}>●</span>
                    </span>
                  )}
                </div>
                {m.role === "assistant" && m.content && (
                  <div className="mt-2 hidden items-center gap-1 text-[var(--text-muted)] group-hover:flex">
                    <Hint label="Copy">
                      <button
                        type="button"
                        onClick={() => copy(m.content)}
                        aria-label="Copy message"
                        className="rounded p-1 hover:text-[var(--text-primary)]"
                      >
                        <Copy size={11} />
                      </button>
                    </Hint>
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-inset)] text-[var(--text-muted)]">
                  <User size={12} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stop / regenerate row */}
      {(streaming || (messages.length > 0 && lastIsAssistant && !streaming)) && (
        <div className="flex items-center justify-center gap-2 border-t border-[var(--border-color)] py-2 text-xs">
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-1 rounded border border-[var(--border-color)] px-2.5 py-1 hover:bg-[var(--surface-inset)]"
            >
              <Square size={11} aria-hidden="true" /> Stop generating
            </button>
          ) : (
            <button
              type="button"
              onClick={regenerate}
              className="inline-flex items-center gap-1 rounded border border-[var(--border-color)] px-2.5 py-1 hover:bg-[var(--surface-inset)]"
            >
              <RefreshCw size={11} aria-hidden="true" /> Regenerate
            </button>
          )}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-[var(--border-color)] p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={streaming}
            placeholder="Ask anything about your operations… (⏎ to send, ⇧⏎ for newline)"
            rows={2}
            className="input-base flex-1 resize-none"
            aria-label="Message input"
          />
          <Button type="submit" disabled={streaming || !input.trim()} aria-label="Send message">
            <Send size={14} />
          </Button>
        </div>
      </form>
    </div>
  );
}

function EmptyHints({ onPick }: { onPick: (s: string) => void }) {
  const hints = [
    "Draft an advancing email for the Hialeah load-in",
    "Summarize this week's open invoices",
    "Generate a vendor RFP for camera packages",
    "What deliverables are slipping?",
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="text-sm text-[var(--text-muted)]">Ask about a project, invoice, or advancing submission.</div>
      <div className="grid w-full max-w-md gap-2 sm:grid-cols-2">
        {hints.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => onPick(h)}
            className="rounded-md border border-[var(--border-color)] bg-[var(--surface-inset)] px-3 py-2 text-start text-xs text-[var(--text-secondary)] transition hover:bg-[var(--surface)]"
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}
