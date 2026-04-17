'use client';

/**
 * PhaseNarrativeEditor — Rich text editor for phase narratives.
 *
 * Uses Tiptap with a minimal toolbar (bold, italic, lists, undo/redo).
 * Outputs plain text for storage (narratives are rendered in DOCX as plain text blocks).
 * The rich formatting here is for the editing experience; the engine normalizes on export.
 *
 * @module components/admin/builder/PhaseNarrativeEditor
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo2,
  Redo2,
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface PhaseNarrativeEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded transition-colors
        ${active
          ? 'bg-org-primary/10 text-org-primary'
          : 'text-text-muted hover:text-foreground hover:bg-bg-secondary'
        }
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </Button>
  );
}

export default function PhaseNarrativeEditor({
  value,
  onChange,
  placeholder = 'Tell the story of this phase…',
}: PhaseNarrativeEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none px-4 py-3 min-h-[140px] focus:outline-none text-foreground',
      },
    },
    onUpdate: ({ editor: ed }) => {
      // Store as plain text — the DOCX engine renders body text, not HTML
      onChange(ed.getText());
    },
  });

  // Sync external value changes (e.g., content library insertion)
  useEffect(() => {
    if (editor && value !== editor.getText() && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [editor, value]);

  const toggle = useCallback(
    (command: string) => {
      if (!editor) return;
      switch (command) {
        case 'bold':
          editor.chain().focus().toggleBold().run();
          break;
        case 'italic':
          editor.chain().focus().toggleItalic().run();
          break;
        case 'bulletList':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'orderedList':
          editor.chain().focus().toggleOrderedList().run();
          break;
        case 'undo':
          editor.chain().focus().undo().run();
          break;
        case 'redo':
          editor.chain().focus().redo().run();
          break;
      }
    },
    [editor],
  );

  if (!editor) {
    return (
      <div className="rounded-lg border border-border bg-bg-secondary/30 min-h-[180px] animate-pulse" />
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden focus-within:ring-1 focus-within:ring-org-primary/30 focus-within:border-org-primary/50 transition-shadow">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-bg-secondary/40">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => toggle('bold')}
          title="Bold (⌘B)"
        >
          <Bold size={15} />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => toggle('italic')}
          title="Italic (⌘I)"
        >
          <Italic size={15} />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => toggle('bulletList')}
          title="Bullet List"
        >
          <List size={15} />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => toggle('orderedList')}
          title="Numbered List"
        >
          <ListOrdered size={15} />
        </ToolbarButton>

        <div className="flex-1" />

        <ToolbarButton
          disabled={!editor.can().undo()}
          onClick={() => toggle('undo')}
          title="Undo (⌘Z)"
        >
          <Undo2 size={15} />
        </ToolbarButton>

        <ToolbarButton
          disabled={!editor.can().redo()}
          onClick={() => toggle('redo')}
          title="Redo (⌘⇧Z)"
        >
          <Redo2 size={15} />
        </ToolbarButton>

        {/* Character count */}
        <span className="text-[10px] text-text-muted tabular-nums ml-2">
          {editor.storage.characterCount?.characters?.() ?? editor.getText().length}
        </span>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
