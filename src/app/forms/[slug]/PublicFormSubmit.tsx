"use client";

import { useActionState, useId } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { submitFormAction, type SubmitState } from "./actions";

export type PublicFormField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "email" | "url" | "number" | "date" | "select" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

export function PublicFormSubmit({ slug, fields }: { slug: string; fields: PublicFormField[] }) {
  const errId = useId();
  const [state, action, pending] = useActionState<SubmitState, FormData>(
    async (prev, fd) => submitFormAction(slug, prev, fd),
    null,
  );

  if (state?.ok) {
    return (
      <div className="surface p-8 text-center">
        <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Submitted</div>
        <h2 className="mt-2 text-2xl font-semibold">Thanks — we received it.</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Your response was recorded. You can close this tab.</p>
      </div>
    );
  }

  return (
    <form action={action} className="surface space-y-4 p-6" aria-busy={pending || undefined} aria-describedby={errId}>
      {/* Honeypot — hidden from real users via CSS, bots will fill it. */}
      <div className="absolute -start-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Leave blank
          <input type="text" name="hp_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {fields.map((f) => {
        const name = `f_${f.key}`;
        if (f.type === "textarea") {
          return (
            <div key={f.key}>
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                {f.label}
                {f.required && <span className="ms-0.5 text-[var(--color-error)]">*</span>}
              </label>
              <textarea
                name={name}
                required={f.required}
                placeholder={f.placeholder}
                rows={4}
                maxLength={5000}
                className="input-base mt-1.5 w-full"
              />
            </div>
          );
        }
        if (f.type === "select") {
          return (
            <div key={f.key}>
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                {f.label}
                {f.required && <span className="ms-0.5 text-[var(--color-error)]">*</span>}
              </label>
              <select name={name} required={f.required} className="input-base mt-1.5 w-full" defaultValue="">
                <option value="" disabled>
                  {f.placeholder || "Select…"}
                </option>
                {(f.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (f.type === "checkbox") {
          return (
            <label key={f.key} className="surface hover-lift flex cursor-pointer items-start gap-3 p-3 text-sm">
              <input type="checkbox" name={name} className="mt-0.5 accent-[var(--org-primary)]" />
              <div>
                <div className="font-medium">{f.label}</div>
                {f.placeholder && <div className="text-[11px] text-[var(--text-muted)]">{f.placeholder}</div>}
              </div>
            </label>
          );
        }
        const inputType =
          f.type === "url"
            ? "url"
            : f.type === "email"
              ? "email"
              : f.type === "number"
                ? "number"
                : f.type === "date"
                  ? "date"
                  : "text";
        return (
          <Input
            key={f.key}
            label={f.label}
            name={name}
            type={inputType}
            required={f.required}
            placeholder={f.placeholder}
          />
        );
      })}

      {state?.error && (
        <div id={errId}>
          <Alert kind="error">{state.error}</Alert>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={pending}>
          {pending ? "Submitting" : "Submit"}
        </Button>
      </div>
    </form>
  );
}
