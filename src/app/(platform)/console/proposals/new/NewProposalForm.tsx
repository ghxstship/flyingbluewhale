"use client";

import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createProposalAction } from "../actions";

export function NewProposalForm({
  clients,
  projects,
  defaultClientId,
  template,
}: {
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  defaultClientId?: string;
  template?: { id: string; name: string; blockCount: number } | null;
}) {
  const t = useT();
  const [brief, setBrief] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function handleAiDraft() {
    if (!brief.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiDraft("");
    try {
      const res = await fetch("/api/v1/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "proposal", context: brief }),
      });
      const json = (await res.json()) as { ok: boolean; data?: { content: string }; error?: { message: string } };
      if (!json.ok) throw new Error(json.error?.message ?? "AI draft failed");
      setAiDraft(json.data?.content ?? "");
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI draft failed");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <FormShell
      action={createProposalAction}
      cancelHref="/console/proposals"
      submitLabel={t("console.proposals.new.submit", undefined, "Create Proposal")}
    >
      {/* AI Draft section — pre-fills context before the form fields */}
      <div className="surface-inset rounded-md p-4 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--p-text-2)]">
          Draft with AI
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">Project brief / context</label>
          <textarea
            id="ai_brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            className="input-base mt-1.5 w-full"
            placeholder="Describe the event, client goals, scope, and any key requirements…"
          />
        </div>
        <button
          type="button"
          onClick={handleAiDraft}
          disabled={aiLoading || !brief.trim()}
          className="ps-btn ps-btn--sm"
        >
          {aiLoading ? "Drafting…" : "Draft with AI →"}
        </button>
        {aiError && <p className="text-xs text-[var(--p-danger)]">{aiError}</p>}
        {aiDraft && (
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">AI Draft Preview</label>
            <textarea
              readOnly
              value={aiDraft}
              rows={8}
              className="input-base mt-1.5 w-full font-mono text-xs opacity-80"
            />
          </div>
        )}
      </div>

      {template && (
        <>
          <input type="hidden" name="template_id" value={template.id} />
          <div className="surface-inset rounded-md p-3 text-xs">
            <div className="font-semibold tracking-wide text-[var(--text-muted)] uppercase">
              {t("console.proposals.new.templateLabel", undefined, "Template")}
            </div>
            <div className="mt-1">
              {template.name} · {template.blockCount}{" "}
              {template.blockCount === 1
                ? t("console.proposals.new.block", undefined, "block")
                : t("console.proposals.new.blocks", undefined, "blocks")}
            </div>
          </div>
        </>
      )}
      <Input label={t("console.proposals.new.title", undefined, "Title")} name="title" required maxLength={200} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            {t("console.proposals.new.client", undefined, "Client")}
          </label>
          <select name="client_id" defaultValue={defaultClientId ?? ""} className="input-base mt-1.5 w-full">
            <option value="">{t("console.proposals.new.noClient", undefined, "— No client —")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            {t("console.proposals.new.project", undefined, "Project")}
          </label>
          <select name="project_id" className="input-base mt-1.5 w-full">
            <option value="">{t("console.proposals.new.noProject", undefined, "— No project —")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.proposals.new.amount", undefined, "Amount (USD)")}
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
        />
        <Input label={t("console.proposals.new.expires", undefined, "Expires")} name="expires_at" type="date" />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          {t("console.proposals.new.notes", undefined, "Notes / scope")}
        </label>
        <textarea name="notes" rows={5} className="input-base mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
