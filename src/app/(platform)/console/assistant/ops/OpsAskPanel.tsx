"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

type Message = { role: "user" | "assistant"; content: string };

type Props = {
  contextSummary: string;
  quickPrompts: string[];
};

export function OpsAskPanel({ contextSummary, quickPrompts }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [pending, start] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    setMessages((prev: Message[]) => [...prev, { role: "user" as const, content: trimmed }]);

    start(async () => {
      try {
        const res = await fetch("/api/v1/ai/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            conversationId,
            message: trimmed,
            model: "claude-sonnet-4-6",
          }),
        });
        if (!res.ok || !res.body) {
          setMessages((prev: Message[]) => [
            ...prev,
            { role: "assistant" as const, content: "(Error — please retry)" },
          ]);
          return;
        }
        const newConvId = res.headers.get("x-conversation-id");
        if (newConvId && !conversationId) setConversationId(newConvId);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        setMessages((prev: Message[]) => [
          ...prev,
          { role: "assistant" as const, content: "" },
        ]);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              const token = line.slice(6);
              if (token === "[DONE]") continue;
              accumulated += token;
              setMessages((prev: Message[]) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant" as const, content: accumulated };
                return copy;
              });
            }
          }
        }
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      } catch {
        setMessages((prev: Message[]) => [
          ...prev,
          { role: "assistant" as const, content: "(Network error — please retry)" },
        ]);
      }
    });
  }

  return (
    <div className="surface flex flex-col" style={{ minHeight: "28rem" }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Ask anything about your operations — crew coverage, overdue work, budget health, or next steps.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {quickPrompts.slice(0, 3).map((p: string) => (
                <button
                  key={p}
                  type="button"
                  className="surface hover-lift rounded px-3 py-1.5 text-xs text-left"
                  onClick={() => send(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m: Message, i: number) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[var(--org-primary)] text-white"
                    : "surface text-[var(--text-primary)]"
                }`}
              >
                {m.content || (pending ? "…" : "")}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--border-color)] p-3">
        <form
          className="flex gap-2"
          onSubmit={(e: { preventDefault: () => void }) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e: { target: { value: string } }) => setInput(e.target.value)}
            placeholder="Ask about crew gaps, overdue deliverables, budget health…"
            className="input-base flex-1 text-sm"
            disabled={pending}
          />
          <Button type="submit" size="sm" disabled={pending || !input.trim()}>
            {pending ? "…" : "Ask"}
          </Button>
        </form>
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">Context: {contextSummary}</p>
      </div>
    </div>
  );
}
