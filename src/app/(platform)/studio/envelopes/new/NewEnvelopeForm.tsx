"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createEnvelopeAction } from "../actions";

const PROVIDERS = ["docusign", "adobe_sign", "hellosign", "pandadoc", "manual"] as const;
const TARGET_TYPES = [
  "proposal",
  "offer_letter",
  "msa",
  "prime_contract",
  "sub_contract",
  "change_order",
  "lien_waiver",
  "nda",
  "other",
] as const;

export function NewEnvelopeForm({
  projects,
  defaultProjectId,
  defaultTargetType,
  defaultTargetId,
}: {
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
  defaultTargetType?: string;
  defaultTargetId?: string;
}) {
  const t = useT();
  const providerLabel: Record<(typeof PROVIDERS)[number], string> = {
    docusign: t("console.envelopes.provider.docusign", undefined, "DocuSign"),
    adobe_sign: t("console.envelopes.provider.adobeSign", undefined, "Adobe Sign"),
    hellosign: t("console.envelopes.provider.hellosign", undefined, "HelloSign"),
    pandadoc: t("console.envelopes.provider.pandadoc", undefined, "PandaDoc"),
    manual: t("console.envelopes.provider.manual", undefined, "Manual"),
  };
  const targetLabel: Record<(typeof TARGET_TYPES)[number], string> = {
    proposal: t("console.envelopes.target.proposal", undefined, "Proposal"),
    offer_letter: t("console.envelopes.target.offerLetter", undefined, "Offer Letter"),
    msa: t("console.envelopes.target.msa", undefined, "MSA"),
    prime_contract: t("console.envelopes.target.primeContract", undefined, "Prime Contract"),
    sub_contract: t("console.envelopes.target.subContract", undefined, "Sub Contract"),
    change_order: t("console.envelopes.target.changeOrder", undefined, "Change Order"),
    lien_waiver: t("console.envelopes.target.lienWaiver", undefined, "Lien Waiver"),
    nda: t("console.envelopes.target.nda", undefined, "NDA"),
    other: t("console.envelopes.target.other", undefined, "Other"),
  };
  return (
    <FormShell
      action={createEnvelopeAction}
      cancelHref="/studio/envelopes"
      submitLabel={t("console.envelopes.new.submit", undefined, "Create Envelope")}
    >
      <Input
        label={t("console.envelopes.new.subject", undefined, "Subject")}
        name="subject"
        required
        maxLength={300}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="provider" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.envelopes.column.provider", undefined, "Provider")}
          </label>
          <select id="provider" name="provider" defaultValue="docusign" className="ps-input mt-1.5 w-full">
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {providerLabel[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="target_type" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.envelopes.column.target", undefined, "Target")}
          </label>
          <select id="target_type"
            name="target_type"
            defaultValue={defaultTargetType ?? "other"}
            className="ps-input mt-1.5 w-full"
          >
            {TARGET_TYPES.map((tt) => (
              <option key={tt} value={tt}>
                {targetLabel[tt]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Input
        label={t("console.envelopes.new.targetId", undefined, "Target record ID")}
        name="target_id"
        required
        defaultValue={defaultTargetId}
        placeholder="00000000-0000-0000-0000-000000000000"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="project_id" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.envelopes.column.project", undefined, "Project")}
          </label>
          <select id="project_id" name="project_id" defaultValue={defaultProjectId ?? ""} className="ps-input mt-1.5 w-full">
            <option value="">{t("console.envelopes.new.noProject", undefined, "No project")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={t("console.envelopes.new.expires", undefined, "Expires")}
          name="expires_at"
          type="date"
        />
      </div>
      <div>
        <label htmlFor="body_md" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.envelopes.new.body", undefined, "Body / notes")}
        </label>
        <textarea id="body_md" name="body_md" rows={5} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
