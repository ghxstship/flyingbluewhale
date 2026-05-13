"use client";

import { useActionState, useRef } from "react";
import type { State } from "./actions";

const INPUT = "rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1.5 text-xs";
const LBL = "text-[10px] uppercase tracking-wide text-[var(--text-muted)]";

type SelectOption = { value: string; label: string };

export type InlineField = {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "number";
  maxLength?: number;
  mono?: boolean;
  defaultValue?: string;
} & ({ kind?: "input"; options?: never } | { kind: "select"; options: SelectOption[] });

type Props = {
  action: (prev: State, fd: FormData) => Promise<State>;
  sheetId: string;
  submitLabel: string;
  fields: InlineField[];
};

export function InlineAddForm({ action, sheetId, submitLabel, fields }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<State, FormData>(async (prev, fd) => {
    const result = await action(prev, fd);
    if (result?.ok) formRef.current?.reset();
    return result;
  }, null);

  return (
    <form ref={formRef} action={formAction} className="mt-3 border-t border-[var(--border-color)] pt-3">
      <div className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="sheet_id" value={sheetId} />
        {fields.map((f) => (
          <FieldInput key={f.name} field={f} />
        ))}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--bg-hover)] disabled:opacity-60"
        >
          {pending ? "…" : submitLabel}
        </button>
        {state?.error && (
          <span className="text-[11px] text-[var(--color-error)]" role="alert">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}

function FieldInput({ field }: { field: InlineField }) {
  const klass = `${INPUT} ${field.mono ? "font-mono uppercase tracking-wide" : ""}`;
  return (
    <label className="flex min-w-[120px] flex-col gap-1">
      <span className={LBL}>{field.label}</span>
      {field.kind === "select" ? (
        <select name={field.name} required={field.required} defaultValue={field.defaultValue ?? ""} className={klass}>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={field.name}
          required={field.required}
          placeholder={field.placeholder}
          type={field.type ?? "text"}
          maxLength={field.maxLength}
          defaultValue={field.defaultValue}
          className={klass}
        />
      )}
    </label>
  );
}
