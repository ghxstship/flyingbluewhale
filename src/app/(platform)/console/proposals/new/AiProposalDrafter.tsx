"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type DraftResult = {
  id: string;
  draft_content: string;
};

export function AiProposalDrafter({
  onDraftReady,
}: {
  onDraftReady: (draft: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const clientRef = useRef<HTMLInputElement>(null);
  const eventTypeRef = useRef<HTMLInputElement>(null);
  const datesRef = useRef<HTMLInputElement>(null);
  const scopeRef = useRef<HTMLTextAreaElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);

  async function generate() {
    const client_name = clientRef.current?.value?.trim() ?? "";
    const event_type = eventTypeRef.current?.value?.trim() ?? "";
    const scope_summary = scopeRef.current?.value?.trim() ?? "";
    if (!client_name || !event_type || scope_summary.length < 10) {
      setError("Fill in client name, event type, and at least 10 characters of scope.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name,
          event_type,
          event_dates: datesRef.current?.value || undefined,
          scope_summary,
          budget_range: budgetRef.current?.value || undefined,
        }),
      });
      const json = (await res.json()) as { data?: DraftResult; message?: string; error?: string };
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Request failed");
      setPreview(json.data?.draft_content ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (preview) {
      onDraftReady(preview);
      setOpen(false);
      setPreview(null);
    }
  }

  return (
    <div className="surface-inset rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Generate with AI</p>
          <p className="text-xs text-[var(--text-muted)]">
            Describe the engagement — Claude drafts the proposal narrative.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Open"}
        </Button>
      </div>

      {open && (
        <div className="space-y-3 pt-1 border-t border-[var(--border)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input ref={clientRef} label="Client Name" placeholder="Acme Corp" required />
            <Input ref={eventTypeRef} label="Event Type" placeholder="Corporate summit, music festival…" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input ref={datesRef} label="Event Dates (optional)" placeholder="July 4–6, 2026" />
            <Input ref={budgetRef} label="Budget Range (optional)" placeholder="$50K–$80K" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Scope Summary <span className="text-[var(--error)]">*</span>
            </label>
            <textarea
              ref={scopeRef}
              rows={4}
              placeholder="Describe the production scope: venue size, technical requirements, crew needs, key deliverables…"
              className="input-base mt-1.5 w-full text-sm"
            />
          </div>

          {error && <p className="text-xs text-[var(--error)]">{error}</p>}

          <Button onClick={() => void generate()} disabled={loading} size="sm">
            {loading ? "Generating…" : "Generate Draft"}
          </Button>

          {preview && (
            <div className="space-y-3">
              <div className="surface rounded-lg p-4 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed text-[var(--text-primary)]">
                {preview}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={apply}>
                  Apply to Notes Field
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void generate()}>
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
