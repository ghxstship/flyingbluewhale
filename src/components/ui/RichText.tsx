"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";

/**
 * RichText v2 — Tiptap editor with slash menu + link insertion.
 * Benchmark: Notion slash menu, Linear comment editor.
 */
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
      Placeholder.configure({
        placeholder: placeholder ?? "Write something, or press / for commands…",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "underline text-[var(--org-primary)] underline-offset-4",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-24 px-3 py-2",
      },
    },
  });

  React.useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  // Slash menu state
  const [slashOpen, setSlashOpen] = React.useState(false);
  const [slashQuery, setSlashQuery] = React.useState("");

  React.useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        setSlashOpen(false);
        return;
      }
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 30), from);
      const m = textBefore.match(/(^|\s)\/([\w-]*)$/);
      if (m) {
        setSlashOpen(true);
        setSlashQuery(m[2]);
      } else {
        setSlashOpen(false);
      }
    };
    editor.on("selectionUpdate", handleUpdate);
    editor.on("update", handleUpdate);
    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  const runSlashCommand = React.useCallback(
    (fn: (e: NonNullable<typeof editor>) => void) => {
      if (!editor) return;
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 30), from);
      const m = textBefore.match(/(^|\s)\/([\w-]*)$/);
      if (m) {
        const pos = from - m[0].length + (m[1] === "" ? 0 : m[1].length);
        editor.commands.deleteRange({ from: pos, to: from });
      }
      fn(editor);
      setSlashOpen(false);
    },
    [editor],
  );

  const slashCommands = React.useMemo(
    () => [
      {
        label: "Heading 2",
        keywords: "h2 title",
        run: (e: NonNullable<typeof editor>) => e.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        label: "Heading 3",
        keywords: "h3 subheading",
        run: (e: NonNullable<typeof editor>) => e.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        label: "Bulleted list",
        keywords: "ul bullets",
        run: (e: NonNullable<typeof editor>) => e.chain().focus().toggleBulletList().run(),
      },
      {
        label: "Numbered list",
        keywords: "ol ordered",
        run: (e: NonNullable<typeof editor>) => e.chain().focus().toggleOrderedList().run(),
      },
      {
        label: "Quote",
        keywords: "blockquote citation",
        run: (e: NonNullable<typeof editor>) => e.chain().focus().toggleBlockquote().run(),
      },
      {
        label: "Link",
        keywords: "url hyperlink",
        run: (e: NonNullable<typeof editor>) => {
          const url = window.prompt("URL:");
          if (!url) return;
          e.chain().focus().setLink({ href: url }).run();
        },
      },
    ],
    [],
  );

  const filteredSlash = React.useMemo(() => {
    const q = slashQuery.toLowerCase();
    if (!q) return slashCommands;
    return slashCommands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords.includes(q),
    );
  }, [slashCommands, slashQuery]);

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL:", prev ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  if (!editor) return null;

  return (
    <div className={`input-base relative !p-0 ${className}`}>
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex items-center gap-0.5 border-b border-[var(--border-color)] px-2 py-1 text-xs text-[var(--text-muted)]"
      >
        <ToolbarButton
          label="Bold"
          pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={12} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={12} />
        </ToolbarButton>
        <div aria-hidden="true" className="mx-1 h-4 w-px bg-[var(--border-color)]" />
        <ToolbarButton
          label="Heading 2"
          pressed={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={12} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          pressed={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={12} />
        </ToolbarButton>
        <div aria-hidden="true" className="mx-1 h-4 w-px bg-[var(--border-color)]" />
        <ToolbarButton
          label="Bulleted list"
          pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={12} />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          pressed={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={12} />
        </ToolbarButton>
        <ToolbarButton
          label="Block quote"
          pressed={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={12} />
        </ToolbarButton>
        <div aria-hidden="true" className="mx-1 h-4 w-px bg-[var(--border-color)]" />
        <ToolbarButton label="Link" pressed={editor.isActive("link")} onClick={setLink}>
          <LinkIcon size={12} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      {slashOpen && filteredSlash.length > 0 && (
        <div className="absolute left-3 z-20 mt-1 w-60 rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] p-1 shadow-lg">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Insert
          </div>
          {filteredSlash.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => runSlashCommand(c.run)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-start text-sm hover:bg-[var(--surface-inset)]"
            >
              {c.label.includes("Link") ? <ExternalLink size={12} /> : <span className="w-3" />}
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded p-1 hover:bg-[var(--surface-inset)] ${
        pressed ? "bg-[var(--surface-inset)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"
      }`}
    >
      {children}
    </button>
  );
}
