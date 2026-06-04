import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createReview } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.reviews.new.eyebrow", undefined, "Programs · Reviews")}
        title={t("console.programs.reviews.new.title", undefined, "New Review")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createReview}
          cancelHref="/console/programs/reviews"
          submitLabel={t("console.programs.reviews.new.submit", undefined, "Schedule Review")}
        >
          <Input
            label={t("console.programs.reviews.new.fields.title", undefined, "Title")}
            name="title"
            maxLength={200}
            placeholder={t(
              "console.programs.reviews.new.fields.titlePlaceholder",
              undefined,
              "e.g. Mid-event ops sync",
            )}
            required
          />
          <Input
            label={t("console.programs.reviews.new.fields.scheduledAt", undefined, "Scheduled At")}
            name="scheduled_at"
            type="datetime-local"
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.programs.reviews.new.fields.notes", undefined, "Notes")}
            </label>
            <textarea name="notes" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
