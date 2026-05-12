"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const name = (fd.get("name") as string) || "";
    const email = (fd.get("email") as string) || "";
    const company = (fd.get("company") as string) || "";
    const scale = (fd.get("scale") as string) || "";
    const vertical = (fd.get("vertical") as string) || "";
    const message = (fd.get("message") as string) || "";
    const wantsDemo = fd.get("demo") === "on";

    const subject = encodeURIComponent(`Studio inquiry — ${company || name}`);
    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company}`,
        `Productions per year: ${scale}`,
        `Vertical: ${vertical}`,
        `Message:\n${message}`,
        wantsDemo ? "Requested: live walkthrough" : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );

    window.location.href = `mailto:sales@lytehaus.live?subject=${subject}&body=${body}`;
    setSubmitted(true);
    formRef.current?.reset();
  }

  if (submitted) {
    return (
      <div className="surface mt-8 p-6 text-center">
        <p className="text-sm font-medium">Your email client should have opened.</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          If nothing happened,{" "}
          <a href="mailto:sales@lytehaus.live" className="underline">
            email us directly
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 text-xs text-[var(--text-muted)] underline"
        >
          Send another note
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} className="surface mt-8 space-y-4 p-6" onSubmit={handleSubmit} noValidate>
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
        <Button type="submit">Send to the Studio</Button>
      </div>
    </form>
  );
}
