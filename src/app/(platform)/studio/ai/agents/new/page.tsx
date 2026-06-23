import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { AGENT_OUTPUT_TYPES, AGENT_TARGET_TABLES } from "../constants";
import { createAgentAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ai.agents.new.eyebrow", undefined, "Field Agents")}
        title={t("console.ai.agents.new.title", undefined, "New Field Agent")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createAgentAction}
          cancelHref="/studio/ai/agents"
          submitLabel={t("console.ai.agents.new.submit", undefined, "Create Agent")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.ai.agents.new.targetTable", undefined, "Target Table")}
            </label>
            <select name="target_table" defaultValue={AGENT_TARGET_TABLES[0]} className="ps-input mt-1.5 w-full">
              {AGENT_TARGET_TABLES.map((table) => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("console.ai.agents.new.targetColumn", undefined, "Target Column")}
            name="target_column"
            required
            maxLength={120}
            placeholder="summary"
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.ai.agents.new.sourceColumns", undefined, "Source Columns")}
            </label>
            <textarea
              name="source_columns"
              rows={2}
              maxLength={2000}
              className="ps-input mt-1.5 w-full"
              placeholder="title, description"
            />
            <p className="mt-1 text-[11px] text-[var(--p-text-2)]">
              {t(
                "console.ai.agents.new.sourceColumnsHelp",
                undefined,
                "Comma- or newline-separated column names available to the prompt as {{column}} placeholders.",
              )}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.ai.agents.new.promptTemplate", undefined, "Prompt Template")}
            </label>
            <textarea
              name="prompt_template"
              rows={5}
              required
              maxLength={8000}
              className="ps-input mt-1.5 w-full font-mono"
              placeholder="Summarize the following incident in one sentence: {{description}}"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.ai.agents.new.outputType", undefined, "Output Type")}
            </label>
            <select name="output_type" defaultValue="text" className="ps-input mt-1.5 w-full">
              {AGENT_OUTPUT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="enabled" value="true" defaultChecked />
            {t("console.ai.agents.new.enabled", undefined, "Enabled")}
          </label>
        </FormShell>
      </div>
    </>
  );
}
