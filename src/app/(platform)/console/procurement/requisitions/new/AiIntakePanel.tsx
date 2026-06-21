"use client";

import { useState, useTransition } from "react";

/** AI Smart Intake panel — Coupa Navi / SAP Ariba Joule pattern.
 *
 * Renders above the requisition form. User describes their procurement need
 * in natural language; AI enhances the description and suggests a title.
 * Results are written directly into the form's named inputs via DOM mutation
 * so the server action picks them up on submit. */
export function AiIntakePanel() {
  const [open, setOpen] = useState(false);
  const [needText, setNeedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const analyze = () => {
    if (!needText.trim()) return;
    setError(null);
    start(async () => {
      try {
        const res = await fetch("/api/v1/ai/enhance-text", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: needText, context: "requisition" }),
        });
        const json = (await res.json()) as {
          ok: boolean;
          data?: { enhanced: string };
          error?: { message: string };
        };
        if (!json.ok || !json.data) {
          setError(json.error?.message ?? "Enhancement failed; please try again.");
          return;
        }
        // Fill description field with enhanced text. Title gets the first line
        // of the natural-language input (trimmed to 200 chars).
        const enhanced = json.data.enhanced;
        const titleEl = document.querySelector<HTMLInputElement>('[name="title"]');
        const descEl = document.querySelector<HTMLTextAreaElement>('[name="description"]');
        const firstLine = needText.split(/[\n.!?]/)[0]?.trim().slice(0, 200) ?? "";
        if (titleEl && !titleEl.value) titleEl.value = firstLine;
        if (descEl) descEl.value = enhanced;
        setOpen(false);
      } catch {
        setError("Network error; please try again.");
      }
    });
  };

  return (
    <div className="surface-inset rounded-xl border border-[var(--p-border)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-[var(--p-surface-raised)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-[var(--p-accent)] text-base">✦</span>
          Describe your need
        </span>
        <span className="font-mono text-xs text-[var(--p-text-2)]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-[var(--p-border)] p-4 space-y-3">
          <p className="text-xs text-[var(--p-text-2)]">
            Describe what you need in plain language — AI will turn it into a professional procurement description.
          </p>
          <textarea
            value={needText}
            onChange={(e) => setNeedText(e.target.value)}
            placeholder="e.g. We need 50 Motorola radios with chargers for the MMW26 Hialeah show in July, around $8,000 budget. Essential for field crew coordination across 3 stages."
            rows={4}
            maxLength={2000}
            className="ps-input w-full resize-none text-sm"
          />
          <button
            type="button"
            className="ps-btn"
            disabled={pending || !needText.trim()}
            onClick={analyze}
          >
            {pending ? "Analyzing…" : "Fill form with AI"}
          </button>
          {error && (
            <p className="text-xs text-[var(--p-danger-text)]">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
