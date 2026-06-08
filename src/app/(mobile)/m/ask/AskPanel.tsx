"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type Message = { role: "user" | "assistant"; text: string };

type Props = {
  guideContext: string;
};

export function AskPanel({ guideContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg: Message = { role: "user", text };
    setMessages((prev: Message[]) => [...prev, userMsg]);

    const assistantMsg: Message = { role: "assistant", text: "" };
    setMessages((prev: Message[]) => [...prev, assistantMsg]);
    setStreaming(true);

    try {
      const res = await fetch("/api/v1/ai/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, conversationId, guideContext }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev: Message[]) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", text: "Sorry, I couldn't reach the assistant. Please try again." };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.conversationId) setConversationId(evt.conversationId);
              if (evt.text) {
                setMessages((prev: Message[]) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = { role: "assistant", text: copy[copy.length - 1].text + evt.text };
                  return copy;
                });
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              }
            } catch {
              /* skip malformed events */
            }
          }
        }
      }
    } catch {
      setMessages((prev: Message[]) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", text: "Network error — please try again." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleKey(e: { key: string; shiftKey: boolean; preventDefault: () => void }) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-36">
        {messages.length === 0 && (
          <div className="pt-8 text-center text-sm text-[var(--p-text-2)]">
            <p className="font-medium text-[var(--p-text-1)]">Ask anything about this event.</p>
            <p className="mt-1">Schedules, contacts, credentials, SOPs, radio channels…</p>
          </div>
        )}
        {messages.map((m: Message, i: number) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-[var(--p-accent)] text-[var(--p-accent-fg)]"
                  : "surface text-[var(--p-text-1)]"
              }`}
            >
              {m.text || (streaming && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-16 inset-x-0 border-t border-[var(--p-border)] bg-[var(--p-surface)] px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask a question…"
            className="ps-input flex-1 resize-none"
            style={{ fieldSizing: "content" } as Record<string, string>}
          />
          <Button size="sm" onClick={() => void send()} disabled={streaming || !input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
