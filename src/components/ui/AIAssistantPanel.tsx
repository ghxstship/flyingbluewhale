"use client";

// Console AI assistant panel — inspired by Momentus "Ask Mo" and Connecteam
// AI Agent. Floats over the platform shell so it's always one click away
// from any /console page. Uses the existing /api/v1/ai/chat SSE endpoint.

import { useEffect, useRef, useState, useTransition } from "react";

type Message = { role: "user" | "assistant"; text: string };

export function AIAssistantPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send() {
    const text = draft.trim();
    if (!text || streaming) return;
    setDraft("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Something went wrong — please try again." },
        ]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data:")) {
            try {
              const payload = JSON.parse(line.slice(5).trim());
              if (payload.conversationId) setConversationId(payload.conversationId);
              if (payload.text) {
                assistantText += payload.text;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", text: assistantText };
                  return next;
                });
              }
            } catch {
              // non-JSON event line
            }
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Network error — check your connection." },
      ]);
    } finally {
      setStreaming(false);
      startTransition(() => inputRef.current?.focus());
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        aria-label="Open ATLVS AI assistant"
        onClick={() => setOpen((v) => !v)}
        className={[
          "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg",
          "bg-[#FF2E88] text-white transition-transform hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2E88] focus-visible:ring-offset-2",
        ].join(" ")}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3.5a1 1 0 110 2 1 1 0 010-2zm0 3.5a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0v-4A.75.75 0 0110 9z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="ATLVS AI assistant"
          className={[
            "fixed bottom-20 right-6 z-50 flex w-[360px] flex-col",
            "rounded-2xl border border-[var(--p-border)] bg-[var(--p-surface)] shadow-2xl",
            "max-h-[520px] overflow-hidden",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--p-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF2E88] text-[10px] font-black text-white">
                A
              </span>
              <span className="text-sm font-semibold">ATLVS AI</span>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => { setMessages([]); setConversationId(undefined); }}
                className="text-[10px] text-[var(--p-text-2)] underline underline-offset-2 hover:text-[var(--p-text)]"
              >
                New chat
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-xs text-[var(--p-text-2)] text-center py-6">
                <p className="font-medium">Ask anything about your projects, pipeline, or crew.</p>
                <p className="mt-1 opacity-70">Try: "Summarise my open leads" or "What's due this week?"</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={[
                    "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                    m.role === "user"
                      ? "bg-[#FF2E88] text-white"
                      : "bg-[var(--p-surface-raised)] text-[var(--p-text)] border border-[var(--p-border)]",
                  ].join(" ")}
                >
                  {m.text || (streaming && i === messages.length - 1 ? "▍" : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[var(--p-border)] p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask ATLVS AI…"
                rows={2}
                disabled={streaming}
                className="flex-1 resize-none rounded-lg border border-[var(--p-border)] bg-[var(--p-surface-raised)] px-3 py-2 text-xs placeholder:text-[var(--p-text-2)] focus:outline-none focus:ring-1 focus:ring-[#FF2E88] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={send}
                disabled={streaming || !draft.trim()}
                aria-label="Send message"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF2E88] text-white transition-opacity disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--p-text-2)]">Enter to send · Shift+Enter for newline</p>
          </div>
        </div>
      )}
    </>
  );
}
