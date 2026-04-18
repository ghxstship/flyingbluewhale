"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

export function RichText({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder: placeholder ?? "Write something…" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-24 px-3 py-2",
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={`input-base !p-0 ${className}`}>
      <div role="toolbar" aria-label="Text formatting" className="flex items-center gap-1 border-b border-[var(--border-color)] px-2 py-1 text-xs text-[var(--text-muted)]">
        <button type="button" aria-label="Bold" aria-pressed={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "font-semibold text-[var(--foreground)]" : ""}><b>B</b></button>
        <button type="button" aria-label="Italic" aria-pressed={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "text-[var(--foreground)]" : ""}><i>I</i></button>
        <span aria-hidden="true" className="text-[var(--border-color)]">·</span>
        <button type="button" aria-label="Heading 2" aria-pressed={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? "text-[var(--foreground)]" : ""}>H2</button>
        <button type="button" aria-label="Heading 3" aria-pressed={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive("heading", { level: 3 }) ? "text-[var(--foreground)]" : ""}>H3</button>
        <span aria-hidden="true" className="text-[var(--border-color)]">·</span>
        <button type="button" aria-label="Bulleted list" aria-pressed={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "text-[var(--foreground)]" : ""}>•</button>
        <button type="button" aria-label="Numbered list" aria-pressed={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "text-[var(--foreground)]" : ""}>1.</button>
        <button type="button" aria-label="Block quote" aria-pressed={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive("blockquote") ? "text-[var(--foreground)]" : ""}>&ldquo; &rdquo;</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
