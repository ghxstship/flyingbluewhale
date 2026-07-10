"use client";

import { useId } from "react";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import type { FieldDescriptor } from "@/lib/automations/zod-form";

export type SchemaFormProps = {
  fields: FieldDescriptor[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  /** Show "{{...}}" hint chips above text inputs to remind users they can use templates. */
  showTemplateHints?: boolean;
};

/**
 * Renders a list of FieldDescriptors as form controls. Outputs a controlled
 * object via `onChange`. Supports Bermuda-Triangle aesthetic — no shadows on
 * inputs, primitives carry the 3px ink border.
 *
 * Template syntax (`{{trigger.foo}}` / `{{step.0.output.id}}`) is not validated
 * here — the runner does that. The form just shows a hint chip when
 * `showTemplateHints` is true.
 */
export function SchemaForm({ fields, value, onChange, showTemplateHints }: SchemaFormProps) {
  function setField(name: string, next: unknown) {
    onChange({ ...value, [name]: next });
  }

  return (
    <div className="grid gap-3">
      {fields.length === 0 && <p className="text-xs text-[var(--p-text-2)]">This action has no configurable fields.</p>}
      {fields.map((f) => (
        <FieldRow
          key={f.name}
          field={f}
          value={value[f.name]}
          onChange={(v) => setField(f.name, v)}
          showHints={showTemplateHints}
        />
      ))}
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
  showHints,
}: {
  field: FieldDescriptor;
  value: unknown;
  onChange: (next: unknown) => void;
  showHints?: boolean;
}) {
  const id = useId();
  const labelEl = (
    <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-[var(--p-text-2)]">
      <span>{field.label}</span>
      {field.required && (
        <span aria-hidden="true" className="text-[var(--p-danger)]">
          *
        </span>
      )}
      {showHints && (field.type === "text" || field.type === "textarea") && (
        <span className="ms-auto rounded border border-[var(--p-border)] bg-[var(--p-surface-2)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--p-text-2)]">
          {"{{trigger.field}}"}
        </span>
      )}
    </label>
  );

  if (field.type === "boolean") {
    return (
      <div className="flex items-start gap-2">
        <Checkbox id={id} checked={!!value} onCheckedChange={(v: boolean | "indeterminate") => onChange(v === true)} />
        <div className="flex flex-col gap-0.5">
          <label htmlFor={id} className="text-xs font-medium text-[var(--p-text-2)]">
            {field.label}
            {field.required && (
              <span aria-hidden="true" className="ms-0.5 text-[var(--p-danger)]">
                *
              </span>
            )}
          </label>
          {field.description && <span className="text-[11px] text-[var(--p-text-2)]">{field.description}</span>}
        </div>
      </div>
    );
  }

  if (field.type === "select" && field.options) {
    const v = typeof value === "string" ? value : ((field.default as string | undefined) ?? "");
    return (
      <div className="flex flex-col gap-1.5">
        {labelEl}
        <Select value={v} onValueChange={(next) => onChange(next)}>
          <SelectTrigger id={id} aria-label={field.label}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.description && <span className="text-[11px] text-[var(--p-text-2)]">{field.description}</span>}
      </div>
    );
  }

  if (field.type === "textarea") {
    const v = typeof value === "string" ? value : "";
    return (
      <div className="flex flex-col gap-1.5">
        {labelEl}
        <textarea
          id={id}
          required={field.required}
          minLength={field.min}
          maxLength={field.max}
          placeholder={field.placeholder}
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="ps-input focus-ring min-h-[88px] w-full resize-y font-mono text-xs"
        />
        {field.description && <span className="text-[11px] text-[var(--p-text-2)]">{field.description}</span>}
      </div>
    );
  }

  if (field.type === "number") {
    const v = typeof value === "number" ? String(value) : typeof value === "string" ? value : "";
    return (
      <div className="flex flex-col gap-1.5">
        {labelEl}
        <Input
          inputId={id}
          type="number"
          required={field.required}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          value={v}
          hint={field.description}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") onChange(undefined);
            else {
              const n = Number(raw);
              onChange(Number.isFinite(n) ? n : raw);
            }
          }}
        />
      </div>
    );
  }

  // text / email / url / uuid / date all render as <Input>
  const v = typeof value === "string" ? value : value == null ? "" : String(value);
  const inputType =
    field.type === "email" ? "email" : field.type === "url" ? "url" : field.type === "date" ? "datetime-local" : "text";
  return (
    <div className="flex flex-col gap-1.5">
      {labelEl}
      <Input
        inputId={id}
        type={inputType}
        required={field.required}
        minLength={field.min}
        maxLength={field.max}
        placeholder={field.placeholder ?? (field.type === "uuid" ? "00000000-0000-…" : undefined)}
        value={v}
        hint={field.description}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
