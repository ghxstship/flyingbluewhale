"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { RecordCombobox } from "@/components/RecordCombobox";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createProposalAction } from "../actions";

export function NewProposalForm({
  defaultClientId,
  defaultClientName,
  template,
}: {
  defaultClientId?: string;
  defaultClientName?: string;
  template?: { id: string; name: string; blockCount: number } | null;
}) {
  const t = useT();
  return (
    <FormShell
      action={createProposalAction}
      cancelHref="/studio/proposals"
      submitLabel={t("console.proposals.new.submit", undefined, "Create Proposal")}
    >
      {template && (
        <>
          <input type="hidden" name="template_id" value={template.id} />
          <div className="surface-inset rounded-md p-3 text-xs">
            <div className="font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
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
        <RecordCombobox
          table="clients"
          name="client_id"
          label={t("console.proposals.new.client", undefined, "Client")}
          noneLabel={t("console.proposals.new.noClientOption", undefined, "No client")}
          defaultValue={defaultClientId}
          defaultLabel={defaultClientName}
          searchPlaceholder={t("console.proposals.new.searchClients", undefined, "Search clients…")}
          emptyLabel={t("console.proposals.new.noClientMatches", undefined, "No matching clients")}
        />
        <RecordCombobox
          table="projects"
          name="project_id"
          label={t("console.proposals.new.project", undefined, "Project")}
          noneLabel={t("console.proposals.new.noProjectOption", undefined, "No project")}
          searchPlaceholder={t("console.proposals.new.searchProjects", undefined, "Search projects…")}
          emptyLabel={t("console.proposals.new.noProjectMatches", undefined, "No matching projects")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyInput label={t("console.proposals.new.amount", undefined, "Amount")} name="amount_cents" />
        <Input label={t("console.proposals.new.expires", undefined, "Expires")} name="expires_at" type="date" />
      </div>
      <div>
        <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.proposals.new.notes", undefined, "Notes / scope")}
        </label>
        <textarea id="notes" name="notes" rows={5} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
