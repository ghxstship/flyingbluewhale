import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createBadgeAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.badges.new.eyebrow", undefined, "Badges")}
        title={t("console.workforce.badges.new.title", undefined, "New Badge")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createBadgeAction}
          cancelHref="/studio/workforce/badges"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <Input
            label={t("console.workforce.badges.new.codeLabel", undefined, "Code")}
            name="code"
            required
            maxLength={40}
            hint={t("console.workforce.badges.new.codeHint", undefined, "Short identifier — lowercase, dashes ok.")}
            placeholder="safety-star"
          />
          <Input
            label={t("console.workforce.badges.new.nameLabel", undefined, "Name")}
            name="name"
            required
            maxLength={80}
            placeholder="Safety Star"
          />
          <Input
            label={t("console.workforce.badges.new.iconLabel", undefined, "Icon — Emoji")}
            name="icon"
            maxLength={4}
            placeholder="🛡️"
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.workforce.badges.new.descriptionLabel", undefined, "Description")}
            </label>
            <textarea name="description" rows={3} maxLength={400} className="ps-input mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
