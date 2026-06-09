"use client";

import * as React from "react";
import { Sparkles, Send, RotateCcw } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AiAgentChat() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [conversationId, setConversationId] = React.useState<string | undefined>();
  const [streaming, setStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const reset = () => {
    setMessages([]);
    setConversationId(undefined);
    setError(null);
    setInput("");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setStreaming(true);

    let assistantText = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
          model: "claude-sonnet-4-6",
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          let event = "";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) event = line.slice(7);
            if (line.startsWith("data: ")) data = line.slice(6);
          }
          if (event === "start") {
            const { conversationId: cid } = JSON.parse(data);
            setConversationId(cid);
          } else if (event === "delta") {
            assistantText += JSON.parse(data).text;
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", content: assistantText };
              return next;
            });
          } else if (event === "error") {
            throw new Error(JSON.parse(data).message ?? "Stream error");
          }
        }
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.content !== ""));
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setStreaming(false);
      textareaRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--p-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--p-accent)]" aria-hidden />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
            aria-label="Start new conversation"
          >
            <RotateCcw size={12} aria-hidden />
            New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="py-10 text-center text-sm text-[var(--p-text-2)]">
            <Sparkles size={28} className="mx-auto mb-3 text-[var(--p-accent)] opacity-60" aria-hidden />
            <p className="font-medium mb-1">Ask me anything</p>
            <p className="text-xs max-w-xs mx-auto">
              I can help with projects, schedules, assignments, deliverables, and more.
            </p>
            <div className="mt-5 flex flex-col gap-2 text-left">
              {[
                "What assignments are due this week?",
                "Summarise my open tasks",
                "What are the check-in requirements for my current project?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="rounded border border-[var(--p-border)] px-3 py-2 text-xs text-left hover:bg-[var(--p-surface)] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--p-accent)] text-white rounded-br-sm"
                  : "surface rounded-bl-sm"
              }`}
            >
              {m.content || (
                <span className="inline-flex items-center gap-1 text-[var(--p-text-2)]">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse delay-100">●</span>
                  <span className="animate-pulse delay-200">●</span>
                </span>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div className="text-xs text-[var(--color-error)] text-center px-4 py-2 rounded border border-[var(--color-error)]/30 bg-[var(--color-error)]/5">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--p-border)] p-3">
        <div className="flex items-end gap-2 rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 focus-within:border-[var(--p-accent)]">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question…"
            disabled={streaming}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-[var(--p-text-2)] disabled:opacity-50"
            style={{ maxHeight: "6rem", overflowY: "auto" }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="flex-shrink-0 rounded-lg p-1.5 text-[var(--p-accent)] disabled:opacity-30 hover:bg-[var(--p-accent)]/10 transition-colors"
            aria-label="Send"
          >
            <Send size={16} aria-hidden />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[0.6rem] text-[var(--p-text-2)]">
          Shift+Enter for new line · AI can make mistakes
        </p>
      </div>
    </div>
  );
}
