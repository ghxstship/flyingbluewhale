import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createContractTemplateAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Settings · Contracts" title="New Template" />
      <div className="page-content max-w-3xl">
        <FormShell
          action={createContractTemplateAction}
          cancelHref="/console/settings/contracts"
          submitLabel="Create Template"
        >
          <Input label="Template name" name="name" required maxLength={200} />
          <Input
            label="Default deposit %"
            name="deposit_pct"
            type="number"
            min="0"
            max="100"
            defaultValue="60"
            hint="Default for new contracts. Can be overridden per offer."
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Contract body (Markdown)</span>
            <p className="text-[11px] text-[var(--text-muted)]">
              Available variables: {`{{fee}}`} {`{{deposit_pct}}`} {`{{deposit_amount}}`} {`{{performance_date}}`}{" "}
              {`{{balance_terms}}`} {`{{slot_start}}`} {`{{slot_end}}`}
            </p>
            <textarea
              name="body_markdown"
              rows={20}
              maxLength={50000}
              className="input-base mt-1.5 w-full font-mono text-xs"
              placeholder={`# Performance Agreement\n\nThis agreement is entered into between [COMPANY] ("Presenter") and the Artist.\n\n## Compensation\n\nTotal fee: {{fee}}\nDeposit: {{deposit_pct}} due upon signing ({{deposit_amount}})\nBalance: due at {{balance_terms}}\n\n## Performance\n\nDate: {{performance_date}}\nCall time: {{slot_start}}\nEnd: {{slot_end}}\n\n## Rider\n\n*Add rider terms here.*`}
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="is_default" /> Set as org default template
          </label>
        </FormShell>
      </div>
    </>
  );
}
