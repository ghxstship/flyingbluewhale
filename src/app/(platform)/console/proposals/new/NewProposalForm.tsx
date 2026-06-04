"use client";

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
  return (
    <FormShell
      action={createProposalAction}
      cancelHref="/console/proposals"
      submitLabel={t("console.proposals.new.submit", undefined, "Create Proposal")}
    >
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
