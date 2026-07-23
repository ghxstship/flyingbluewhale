"use client";

import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { TiptapDoc } from "@/lib/collaborate";

/**
 * Browser-only Tiptap editor. MUST be loaded via next/dynamic({ ssr: false })
 * from a "use client" island (DocEditorIsland) so the prod Turbopack build
 * never tries to evaluate the ProseMirror browser globals during SSR.
 *
 * `onChange` reports the current document JSON upward; the island owns the
 * save server-action call. A simple AI-callout block calls the existing
 * Anthropic chat SSE endpoint and inserts the drafted paragraph at the
 * cursor.
 */
export default function TiptapEditor({
  initialContent,
  onChange,
}: {
  initialContent: TiptapDoc;
  onChange: (doc: TiptapDoc) => void;
}) {
  const editor = useEditor({
    // SSR is disabled by the dynamic boundary; this just silences the
    // hydration-mismatch warning Tiptap emits when it can't confirm.
    immediatelyRender: false,
    extensions: [StarterKit],
    // TiptapDoc keeps `content` loosely typed (unknown[]) since node attrs
    // vary; coerce to Tiptap's Content here.
    content: initialContent as Content,
    editorProps: {
      attributes: {
        class: "min-h-[24rem] focus:outline-none text-sm leading-relaxed text-[var(--p-text-1)]",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as TiptapDoc);
    },
  });

  if (!editor) {
    return <div className="skeleton h-96 w-full rounded-md" aria-hidden />;
  }

  return (
    <div className="space-y-3">
      <Toolbar editor={editor} />
      <AiCallout
        onInsert={(text) => {
          editor.chain().focus().insertContent(`<p>${escapeHtml(text)}</p>`).run();
        }}
      />
      <div className="surface-inset rounded-md p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function Toolbar({ editor }: { editor: any }) {
  const t = useT();
  const btn = (active: boolean) =>
    `nav-item press-scale text-xs px-2 py-1 ${active ? "text-[var(--p-text-1)] font-semibold" : "text-[var(--p-text-2)]"}`;
  return (
    <div className="surface flex flex-wrap items-center gap-1 rounded-md p-1.5">
      <button
        type="button"
        className={btn(editor.isActive("heading", { level: 1 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </button>
      <button
        type="button"
        className={btn(editor.isActive("heading", { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>
      <button
        type="button"
        className={btn(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        {t("console.collaborate.docs.toolbar.bold", undefined, "Bold")}
      </button>
      <button
        type="button"
        className={btn(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        {t("console.collaborate.docs.toolbar.italic", undefined, "Italic")}
      </button>
      <button
        type="button"
        className={btn(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        {t("console.collaborate.docs.toolbar.list", undefined, "List")}
      </button>
      <button
        type="button"
        className={btn(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        {t("console.collaborate.docs.toolbar.orderedList", undefined, "1. List")}
      </button>
      <button
        type="button"
        className={btn(editor.isActive("blockquote"))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        {t("console.collaborate.docs.toolbar.quote", undefined, "Quote")}
      </button>
      <button
        type="button"
        className={btn(editor.isActive("codeBlock"))}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        {t("console.collaborate.docs.toolbar.code", undefined, "Code")}
      </button>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * AI-callout block — drafts a paragraph from a prompt via the existing
 * Anthropic chat SSE endpoint (`/api/v1/ai/chat`) and inserts it at the
 * cursor. Consumes the server-sent `delta` events to accumulate text.
 */
function AiCallout({ onInsert }: { onInsert: (text: string) => void }) {
  const t = useT();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function draft() {
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Draft a single concise paragraph for a production document. Topic: ${trimmed}. Return only the paragraph prose, no preamble or markdown.`,
        }),
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(j?.error?.message ?? t("console.collaborate.docs.ai.requestFailed", undefined, "AI request failed"));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          if (!frame.includes("event: delta")) continue;
          try {
            const payload = JSON.parse(dataLine.slice(6)) as { text?: string };
            if (payload.text) text += payload.text;
          } catch {
            // ignore malformed frame
          }
        }
      }
      const drafted = text.trim();
      if (drafted) {
        onInsert(drafted);
        setPrompt("");
      } else {
        setError(t("console.collaborate.docs.ai.noContent", undefined, "No content was returned"));
      }
    } catch {
      setError(t("console.collaborate.docs.ai.requestFailed", undefined, "AI request failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-raised rounded-md p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--p-text-2)]">
        {t("console.collaborate.docs.ai.heading", undefined, "AI callout · draft a paragraph")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void draft();
            }
          }}
          placeholder={t(
            "console.collaborate.docs.ai.placeholder",
            undefined,
            "e.g. radio etiquette for load-in crew",
          )}
          className="ps-input flex-1 min-w-[16rem]"
          disabled={busy}
        />
        <Button type="button" size="sm" loading={busy} onClick={() => void draft()}>
          {busy
            ? t("console.collaborate.docs.ai.drafting", undefined, "Drafting")
            : t("console.collaborate.docs.ai.draft", undefined, "Draft")}
        </Button>
      </div>
      {error && <p className="mt-1.5 text-xs text-[var(--p-danger)]">{error}</p>}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
