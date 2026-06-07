"use client";

import * as React from "react";
import { useActionState, useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { type FormSchema, type PublicFormField, isFieldVisible, isSectionVisible } from "@/lib/forms/types";
import type { SubmitState } from "@/app/forms/[slug]/actions";
import { useT } from "@/lib/i18n/LocaleProvider";

type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/**
 * Forms v2 public renderer — Phase 6.2 of the SmartSuite parity roadmap.
 *
 * Per https://help.smartsuite.com/en/articles/6267415-form-view: section-grouped
 * fields, conditional visibility, prefill via URL params, captcha, redirect
 * after submit, custom thank-you copy. File upload is a placeholder hook —
 * persisting attachments needs Supabase Storage signed-URL upload, which lives
 * in the submission server action.
 *
 * Backwards-compatible with the legacy v1 schema (flat fields, no sections).
 */

export type PublicFormRendererProps = {
  slug: string;
  schema: FormSchema;
  /** Initial values from URL searchParams. Server-passed. */
  prefill?: Record<string, string>;
  /** Server action for submission. */
  submitAction: (slug: string, prev: SubmitState, fd: FormData) => Promise<SubmitState>;
  /** Cloudflare Turnstile site key. Required when schema.antiSpam.captcha. */
  turnstileSiteKey?: string;
  /** Embed mode hides marketing chrome. */
  embed?: boolean;
};

export function PublicFormRenderer({
  slug,
  schema,
  prefill,
  submitAction,
  turnstileSiteKey,
  embed,
}: PublicFormRendererProps) {
  const t = useT();
  const errId = useId();
  const captchaContainerId = useId();
  const [state, action, pending] = useActionState<SubmitState, FormData>(
    async (prev, fd) => submitAction(slug, prev, fd),
    null,
  );

  const initialValues = useMemo<Record<string, unknown>>(() => {
    const out: Record<string, unknown> = {};
    for (const field of schema.fields) {
      if (field.prefillFromUrl !== false && prefill && Object.hasOwn(prefill, field.key)) {
        out[field.key] = prefill[field.key];
      } else if (field.default !== undefined) {
        out[field.key] = field.default;
      }
    }
    return out;
  }, [schema.fields, prefill]);

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);

  const setValue = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const sections = useMemo(() => {
    const grouped = new Map<string | null, PublicFormField[]>();
    for (const field of schema.fields) {
      const sectionId = field.section ?? null;
      const list = grouped.get(sectionId) ?? [];
      list.push(field);
      grouped.set(sectionId, list);
    }
    return grouped;
  }, [schema.fields]);

  // Mount Turnstile when captcha is enabled.
  useEffect(() => {
    if (!schema.antiSpam?.captcha || !turnstileSiteKey) return;
    if (typeof window === "undefined") return;
    const existing = document.querySelector('script[data-turnstile="1"]');
    if (existing) return;
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.defer = true;
    s.dataset.turnstile = "1";
    document.head.appendChild(s);
  }, [schema.antiSpam?.captcha, turnstileSiteKey]);

  // Success state — handle redirect or render thank-you.
  if (state?.ok) {
    const redirect = schema.submit?.redirectUrl;
    if (redirect) {
      if (typeof window !== "undefined") {
        // Defer so React commits the render once before navigation.
        // `assign(...)` instead of `location.href = …` so the React Compiler's
        // immutability rule is satisfied (no field-write on a captured value).
        setTimeout(() => {
          window.location.assign(redirect);
        }, 50);
      }
      return (
        <div className="surface p-6 text-center text-sm text-[var(--p-text-2)]">
          {t("components.publicFormRenderer.redirecting", undefined, "Redirecting…")}
        </div>
      );
    }
    const title =
      schema.submit?.thankYouTitle ??
      t("components.publicFormRenderer.thankYouTitle", undefined, "Thanks — we received it.");
    const body =
      schema.submit?.thankYouBody ??
      t("components.publicFormRenderer.thankYouBody", undefined, "Your response was recorded. You can close this tab.");
    return (
      <div className="surface p-8 text-center">
        <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
          {t("components.publicFormRenderer.submitted", undefined, "Submitted")}
        </div>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">{body}</p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="surface space-y-6 p-6"
      aria-busy={pending || undefined}
      aria-describedby={errId}
      data-embed={embed ? "1" : undefined}
    >
      {/* Honeypot — hidden from real users via CSS, bots will fill it. */}
      <div className="absolute -start-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          {t("components.publicFormRenderer.leaveBlank", undefined, "Leave blank")}
          <input type="text" name="hp_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Hydrate values into hidden inputs so they post even when fields are conditionally hidden. */}
      {Object.entries(values).map(([k, v]) =>
        v === undefined || v === null ? null : (
          <input key={`hidden-${k}`} type="hidden" name={`__values_${k}`} value={String(v)} />
        ),
      )}

      {schema.sections && schema.sections.length > 0
        ? schema.sections.map((section) => {
            if (!isSectionVisible(section, values)) return null;
            const sectionFields = (sections.get(section.id) ?? []).filter((f) => isFieldVisible(f, values));
            if (sectionFields.length === 0) return null;
            return (
              <fieldset key={section.id} className="border-ink space-y-4 border-t-3 pt-4">
                <legend className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
                  {section.heading}
                </legend>
                {section.description ? <p className="text-xs text-[var(--p-text-2)]">{section.description}</p> : null}
                {sectionFields.map((f) => (
                  <FieldRenderer
                    key={f.key}
                    field={f}
                    value={values[f.key]}
                    onChange={(v) => setValue(f.key, v)}
                    t={t}
                  />
                ))}
              </fieldset>
            );
          })
        : null}

      {/* Unsectioned fields render outside the fieldset stack. */}
      {(sections.get(null) ?? [])
        .filter((f) => isFieldVisible(f, values))
        .map((f) => (
          <FieldRenderer key={f.key} field={f} value={values[f.key]} onChange={(v) => setValue(f.key, v)} t={t} />
        ))}

      {schema.antiSpam?.captcha && turnstileSiteKey ? (
        <div className="flex justify-center">
          <div id={captchaContainerId} className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />
        </div>
      ) : null}

      {state?.error && (
        <div id={errId}>
          <Alert kind="error">{state.error}</Alert>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={pending}>
          {pending
            ? t("components.publicFormRenderer.submitting", undefined, "Submitting")
            : (schema.submit?.submitLabel ?? t("components.publicFormRenderer.submit", undefined, "Submit"))}
        </Button>
      </div>
    </form>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  t,
}: {
  field: PublicFormField;
  value: unknown;
  onChange: (v: unknown) => void;
  t: Translator;
}) {
  const name = `f_${field.key}`;
  const labelEl = (
    <label className="text-xs font-medium text-[var(--p-text-2)]">
      {field.label}
      {field.required && <span className="ms-0.5 text-[var(--p-danger)]">*</span>}
      {field.help ? <span className="ms-2 text-[10px] font-normal text-[var(--p-text-2)]">{field.help}</span> : null}
    </label>
  );

  if (field.type === "textarea") {
    return (
      <div>
        {labelEl}
        <textarea
          name={name}
          required={field.required}
          placeholder={field.placeholder}
          minLength={field.minLength}
          maxLength={field.maxLength ?? 5000}
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="ps-input mt-1.5 w-full"
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        {labelEl}
        <select
          name={name}
          required={field.required}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="ps-input mt-1.5 w-full"
        >
          <option value="" disabled>
            {field.placeholder || t("components.publicFormRenderer.selectPlaceholder", undefined, "Select…")}
          </option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <div>
        {labelEl}
        <div className="mt-1.5 space-y-1.5">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name={name}
                value={opt}
                checked={value === opt}
                required={field.required}
                onChange={(e) => onChange(e.target.value)}
                className="accent-[var(--p-accent)]"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="surface hover-lift flex cursor-pointer items-start gap-3 p-3 text-sm">
        <input
          type="checkbox"
          name={name}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 accent-[var(--p-accent)]"
        />
        <div>
          <div className="font-medium">{field.label}</div>
          {field.placeholder && <div className="text-[11px] text-[var(--p-text-2)]">{field.placeholder}</div>}
          {field.help && <div className="text-[11px] text-[var(--p-text-2)]">{field.help}</div>}
        </div>
      </label>
    );
  }

  if (field.type === "file") {
    return (
      <div>
        {labelEl}
        <input
          name={name}
          type="file"
          required={field.required}
          accept="image/*,application/pdf"
          className="mt-1.5 block w-full text-sm"
        />
        <p className="mt-1 text-[11px] text-[var(--p-text-2)]">
          {t("components.publicFormRenderer.fileHelp", undefined, "Up to 10 MB. Images or PDF.")}
        </p>
      </div>
    );
  }

  const inputType =
    field.type === "url"
      ? "url"
      : field.type === "email"
        ? "email"
        : field.type === "tel"
          ? "tel"
          : field.type === "number"
            ? "number"
            : field.type === "date"
              ? "date"
              : "text";

  return (
    <Input
      label={field.label}
      name={name}
      type={inputType}
      required={field.required}
      placeholder={field.placeholder}
      value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      hint={field.help}
      minLength={field.minLength}
      maxLength={field.maxLength}
      min={field.min}
      max={field.max}
    />
  );
}
