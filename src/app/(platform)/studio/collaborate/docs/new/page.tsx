import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { DOC_STATES, DOC_STATE_LABEL } from "@/lib/collaborate";
import { createDoc } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.collaborate.docs.new.eyebrow", undefined, "Pages")}
        title={t("console.collaborate.docs.new.title", undefined, "New Document")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createDoc}
          cancelHref="/studio/collaborate/docs"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <Input
            label={t("console.collaborate.docs.new.titleLabel", undefined, "Title")}
            name="title"
            required
            maxLength={200}
            placeholder="Load-in runbook"
          />
          <div>
            <label htmlFor="doc_state" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.collaborate.docs.new.stateLabel", undefined, "State")}
            </label>
            <select id="doc_state" name="doc_state" required className="ps-input mt-1.5 w-full" defaultValue="draft">
              {DOC_STATES.map((s) => (
                <option key={s} value={s}>
                  {DOC_STATE_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
