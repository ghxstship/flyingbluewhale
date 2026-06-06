import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { TALENT_RIDER_KINDS } from "@/lib/marketplace";
import { createRiderAction } from "../../../new/actions";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ talentId: string }> }) {
  const { talentId } = await params;
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.talent.riders.new.eyebrow", undefined, "Talent · New Rider")}
        title={t("console.marketplace.talent.riders.new.title", undefined, "New Rider")}
        subtitle={t(
          "console.marketplace.talent.riders.new.subtitle",
          undefined,
          "Saving supersedes the current rider of this kind.",
        )}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createRiderAction}
          cancelHref={`/console/marketplace/talent/${talentId}/riders`}
          submitLabel={t("console.marketplace.talent.riders.new.submit", undefined, "Save Rider")}
        >
          <input type="hidden" name="talent_id" value={talentId} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.marketplace.talent.riders.new.kindLabel", undefined, "Kind")}
            </label>
            <select name="kind" required className="input-base mt-1.5 w-full">
              {TALENT_RIDER_KINDS.map((k) => (
                <option key={k} value={k}>
                  {toTitle(k)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("console.marketplace.talent.riders.new.titleLabel", undefined, "Title")}
            name="title"
            placeholder={t(
              "console.marketplace.talent.riders.new.titlePlaceholder",
              undefined,
              "Tech Rider v3 (Spring 2026)",
            )}
            maxLength={200}
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.marketplace.talent.riders.new.bodyLabel", undefined, "Body")}
            </label>
            <textarea name="content" rows={10} maxLength={20000} className="input-base mt-1.5 w-full" />
          </div>
          <Input
            label={t("console.marketplace.talent.riders.new.fileUrlLabel", undefined, "File URL · Optional")}
            name="file_url"
            placeholder="https://…/rider.pdf"
          />
        </FormShell>
      </div>
    </>
  );
}
