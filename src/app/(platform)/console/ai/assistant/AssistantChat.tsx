"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Message = { role: "user" | "assistant"; content: string };

export function AssistantChat({
  conversationId: initialConversationId,
  initialMessages,
}: {
  conversationId: string | null;
  initialMessages: Message[];
}) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset when the conversation context changes (sidebar nav).
  useEffect(() => {
    setConversationId(initialConversationId);
    setMessages(initialMessages);
    setError(null);
  }, [initialConversationId, initialMessages]);

  // Pin the scroll to bottom on new content.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    setInput("");
    const next: Message[] = [...messages, { role: "user", content: text }, { role: "assistant", content: "" }];
    setMessages(next);
    setStreaming(true);

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId: conversationId ?? undefined, message: text }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let newConversationId: string | null = conversationId;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // Parse SSE event blocks separated by blank lines.
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";
        for (const block of blocks) {
          const eventLine = block.split("\n").find((l) => l.startsWith("event:"));
          const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
          if (!eventLine || !dataLine) continue;
          const event = eventLine.slice(6).trim();
          let data: { conversationId?: string; text?: string; message?: string } = {};
          try {
            data = JSON.parse(dataLine.slice(5).trim());
          } catch {
            /* ignore */
          }
          if (event === "start" && data.conversationId) {
            newConversationId = data.conversationId;
          } else if (event === "delta" && typeof data.text === "string") {
            assistantText += data.text;
            setMessages((prev) => {
              const out = prev.slice();
              out[out.length - 1] = { role: "assistant", content: assistantText };
              return out;
            });
          } else if (event === "error") {
            setError(data.message ?? "AI stream error");
          }
        }
      }

      if (newConversationId && newConversationId !== conversationId) {
        setConversationId(newConversationId);
        // Refresh server-side conversation list in the sidebar.
        startTransition(() => {
          router.replace(`/console/ai/assistant?c=${newConversationId}`);
          router.refresh();
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      // Remove the empty placeholder assistant message on hard failure.
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="surface flex h-[calc(100vh-220px)] min-h-[420px] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text)]">Start a conversation</p>
            <p className="mt-1">
              Ask about your projects, deliverables, invoices, or anything operational. The assistant has read access to
              your org via your session and can pull context as needed.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-[var(--accent-subtle)] text-[var(--text)]" : "surface text-[var(--text)]"
              }`}
            >
              {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="border-t border-[var(--border)] bg-[var(--danger-subtle)] px-4 py-2 text-xs text-[var(--danger)]"
        >
          {error}
        </div>
      )}

      <form
        className="flex gap-2 border-t border-[var(--border)] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          className="input flex-1 resize-none"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Ask the assistant…  (Enter to send, Shift+Enter for newline)"
          disabled={streaming}
          aria-label="Message"
        />
        <button type="submit" className="btn btn-primary self-end" disabled={streaming || !input.trim()}>
          {streaming ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
