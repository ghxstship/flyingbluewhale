"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { ZodTypeAny } from "zod";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SchemaForm } from "./SchemaForm";
import { zodToFormFields } from "@/lib/automations/zod-form";

export type StepCardProps = {
  id: string;
  index: number;
  type: string;
  label: string;
  description?: string;
  schema?: ZodTypeAny;
  config: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  onDelete: () => void;
};

/**
 * Single step in the automation pipeline. Renders the action label, the
 * schema-driven config form, and a delete button. The drag handle is wired
 * up via `useSortable` from dnd-kit.
 */
export function StepCard({ id, index, type, label, description, schema, config, onChange, onDelete }: StepCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const fields = schema ? zodToFormFields(schema) : [];

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="surface flex flex-col gap-3 p-4"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag step ${index + 1} to reorder`}
          className="mt-0.5 inline-flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-md border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--surface-inset)] active:cursor-grabbing"
        >
          <GripVertical size={14} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="muted">{`Step ${index + 1}`}</Badge>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">{type}</span>
          </div>
          {description && <p className="mt-1 text-[11px] text-[var(--text-muted)]">{description}</p>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete step ${index + 1}`}
          onClick={() => {
            if (typeof window !== "undefined") {
              const ok = window.confirm(`Delete step ${index + 1} (${label})?`);
              if (!ok) return;
            }
            onDelete();
          }}
        >
          <Trash2 size={14} aria-hidden="true" />
        </Button>
      </div>

      {fields.length > 0 ? (
        <div className="border-t border-[var(--border-color)] pt-3">
          <SchemaForm fields={fields} value={config} onChange={onChange} showTemplateHints />
        </div>
      ) : schema ? (
        <p className="text-[11px] text-[var(--text-muted)]">This action has no configurable fields.</p>
      ) : (
        <div className="rounded-md border border-dashed border-[var(--border-color)] bg-[var(--surface-inset)] p-3 text-[11px] text-[var(--text-muted)]">
          Unknown action type <span className="font-mono">{type}</span>. The runner will fail until it is registered.
        </div>
      )}
    </div>
  );
}
