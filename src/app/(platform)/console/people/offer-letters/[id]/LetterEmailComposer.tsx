"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ComposedEmail } from "@/lib/offer-letters/compose";

export function LetterEmailComposer({ email }: { email: ComposedEmail }) {
  const [tab, setTab] = useState<"preview" | "plaintext" | "html">("preview");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (kind: "subject" | "plaintext" | "html" | "all") => {
    let text = "";
    if (kind === "subject") text = email.subject;
    else if (kind === "plaintext") text = email.plaintext;
    else if (kind === "html") text = email.html;
    else text = `To: ${email.to}\nSubject: ${email.subject}\n\n${email.plaintext}`;
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <section className="surface space-y-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase">Email Template</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Pre-composed for the recipient. Click <em>Open in mail client</em> to draft, or copy any block.
          </p>
        </div>
        <a
          href={email.mailto}
          className="rounded border border-[var(--border-default)] px-3 py-1.5 text-xs hover:border-[var(--org-primary)] hover:text-[var(--org-primary)]"
        >
          Open in mail client →
        </a>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-[80px_1fr_auto] sm:items-center">
        <div className="tracking-wider text-[var(--text-muted)] uppercase">To</div>
        <div className="font-mono text-xs">{email.to}</div>
        <div />
        <div className="tracking-wider text-[var(--text-muted)] uppercase">Subject</div>
        <div className="font-mono text-xs">{email.subject}</div>
        <Button size="sm" variant="ghost" onClick={() => copy("subject")}>
          {copied === "subject" ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-2 text-xs">
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`rounded px-2 py-1 ${tab === "preview" ? "bg-[var(--surface-inset)] font-medium" : "text-[var(--text-muted)]"}`}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setTab("plaintext")}
          className={`rounded px-2 py-1 ${tab === "plaintext" ? "bg-[var(--surface-inset)] font-medium" : "text-[var(--text-muted)]"}`}
        >
          Plain text
        </button>
        <button
          type="button"
          onClick={() => setTab("html")}
          className={`rounded px-2 py-1 ${tab === "html" ? "bg-[var(--surface-inset)] font-medium" : "text-[var(--text-muted)]"}`}
        >
          HTML source
        </button>
        <div className="ms-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => copy("plaintext")}>
            {copied === "plaintext" ? "Copied" : "Copy plain"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copy("html")}>
            {copied === "html" ? "Copied" : "Copy HTML"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => copy("all")}>
            {copied === "all" ? "Copied" : "Copy all"}
          </Button>
        </div>
      </div>

      {tab === "preview" && (
        <div
          className="prose-sm max-h-[480px] overflow-auto rounded border border-[var(--border-default)] bg-white p-4 text-black"
          dangerouslySetInnerHTML={{ __html: email.html }}
        />
      )}
      {tab === "plaintext" && (
        <pre className="max-h-[480px] overflow-auto rounded border border-[var(--border-default)] bg-[var(--surface-inset)] p-4 text-xs whitespace-pre-wrap">
          {email.plaintext}
        </pre>
      )}
      {tab === "html" && (
        <pre className="max-h-[480px] overflow-auto rounded border border-[var(--border-default)] bg-[var(--surface-inset)] p-4 font-mono text-[10px] whitespace-pre-wrap">
          {email.html}
        </pre>
      )}
    </section>
  );
}
