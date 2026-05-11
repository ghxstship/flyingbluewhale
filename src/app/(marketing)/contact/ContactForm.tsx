"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { submitContact } from "./actions";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, null);

  if (state?.ok) {
    return (
      <div className="surface mt-8 space-y-3 p-6 text-sm">
        <p className="font-semibold">Message received.</p>
        <p className="text-[var(--text-secondary)]">
          Studio will be in touch within one business day. Check your spam folder if you don&apos;t hear back.
        </p>
      </div>
    );
  }

  return (
    <form className="surface mt-8 space-y-4 p-6" action={formAction}>
      {state?.error && (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Name <span aria-hidden="true">*</span>
          <input
            name="name"
            required
            autoComplete="name"
            className="input-base mt-1.5 w-full"
            aria-describedby={state?.fieldErrors?.name ? "err-name" : undefined}
          />
          {state?.fieldErrors?.name && (
            <span id="err-name" role="alert" className="mt-1 text-xs text-[var(--color-error)]">
              {state.fieldErrors.name}
            </span>
          )}
        </label>
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Work email <span aria-hidden="true">*</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input-base mt-1.5 w-full"
            aria-describedby={state?.fieldErrors?.email ? "err-email" : undefined}
          />
          {state?.fieldErrors?.email && (
            <span id="err-email" role="alert" className="mt-1 text-xs text-[var(--color-error)]">
              {state.fieldErrors.email}
            </span>
          )}
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Company
          <input name="company" autoComplete="organization" className="input-base mt-1.5 w-full" />
        </label>
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Productions per year
          <select name="scale" className="input-base mt-1.5 w-full">
            <option>1–5</option>
            <option>6–20</option>
            <option>21–50</option>
            <option>50+</option>
          </select>
        </label>
      </div>
      <label className="block text-xs font-medium text-[var(--text-secondary)]">
        What do you run?
        <select name="vertical" className="input-base mt-1.5 w-full">
          <option>Live events / festivals</option>
          <option>Touring / artist management</option>
          <option>Corporate / activations</option>
          <option>Fabrication / shop</option>
          <option>Other</option>
        </select>
      </label>
      <label className="block text-xs font-medium text-[var(--text-secondary)]">
        What are you running?
        <textarea name="message" rows={4} className="input-base mt-1.5 w-full" />
      </label>
      <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <input type="checkbox" name="demo" /> I&apos;d rather walk it through live than trade emails.
      </label>
      <div className="flex items-center justify-end gap-2">
        <Button href="/signup" variant="secondary">
          Open the console instead
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send to the Studio"}
        </Button>
      </div>
    </form>
  );
}
