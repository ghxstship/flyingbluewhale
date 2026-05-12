"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { submitContact, type ContactState } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, null);

  if (state?.success) {
    return (
      <div className="surface mt-8 space-y-4 p-6 text-sm text-[var(--text-secondary)]">
        <p className="text-base font-semibold text-[var(--foreground)]">Message received.</p>
        <p>We'll be in touch within one business day — usually faster. Check your spam if you don't hear from us.</p>
        <div className="flex justify-end">
          <Button href="/signup" variant="secondary">
            Open the console instead
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="surface mt-8 space-y-4 p-6" action={action}>
      {state?.error && (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Name
          <input name="name" required className="input-base mt-1.5 w-full" />
        </label>
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Work email
          <input name="email" type="email" required className="input-base mt-1.5 w-full" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Company
          <input name="company" className="input-base mt-1.5 w-full" />
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
