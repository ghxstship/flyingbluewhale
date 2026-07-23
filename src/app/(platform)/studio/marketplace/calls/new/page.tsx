import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createCallAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.calls.new.eyebrow", undefined, "Marketplace")}
        title={t("console.marketplace.calls.new.title", undefined, "New Open Call")}
        subtitle={t("console.marketplace.calls.new.subtitle", undefined, "Casting, RFP, or audition.")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createCallAction}
          cancelHref="/studio/marketplace/calls"
          submitLabel={t("console.marketplace.calls.new.submit", undefined, "Save Draft")}
        >
          <Input
            label={t("console.marketplace.calls.new.fields.title", undefined, "Title")}
            name="title"
            required
            maxLength={200}
          />
          <div>
            <label htmlFor="kind" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.marketplace.calls.new.fields.kind", undefined, "Kind")}
            </label>
            <select id="kind" name="kind" className="ps-input mt-1.5 w-full" defaultValue="talent_call">
              <option value="talent_call">
                {t("console.marketplace.calls.new.kind.talentCall", undefined, "Talent Call")}
              </option>
              <option value="audition">
                {t("console.marketplace.calls.new.kind.audition", undefined, "Audition")}
              </option>
              <option value="gig">{t("console.marketplace.calls.new.kind.gig", undefined, "Gig")}</option>
              <option value="rfq">{t("console.marketplace.calls.new.kind.rfq", undefined, "Public RFQ")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.marketplace.calls.new.fields.description", undefined, "Description")}
            </label>
            <textarea id="description" name="description" rows={6} maxLength={8000} className="ps-input mt-1.5 w-full" />
          </div>
          <Input
            label={t("console.marketplace.calls.new.fields.genreTags", undefined, "Genre Tags (Comma-separated)")}
            name="genre_tags"
            placeholder={t(
              "console.marketplace.calls.new.placeholders.genreTags",
              undefined,
              "house, techno, indie-rock",
            )}
          />
          <Input
            label={t(
              "console.marketplace.calls.new.fields.tradeCategories",
              undefined,
              "Trade Categories (Comma-separated)",
            )}
            name="trade_categories"
            placeholder={t(
              "console.marketplace.calls.new.placeholders.tradeCategories",
              undefined,
              "lighting, audio, fabrication",
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.marketplace.calls.new.fields.region", undefined, "Region")}
              name="region"
              maxLength={80}
            />
            <Input
              label={t("console.marketplace.calls.new.fields.venueType", undefined, "Venue Type")}
              name="venue_type"
              maxLength={80}
              placeholder={t("console.marketplace.calls.new.placeholders.venueType", undefined, "Festival mainstage")}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t("console.marketplace.calls.new.fields.performanceDate", undefined, "Performance Date")}
              name="performance_date"
              type="date"
            />
            <Input
              label={t("console.marketplace.calls.new.fields.slotMin", undefined, "Slot (Min)")}
              name="slot_length_min"
              type="number"
            />
            <Input
              label={t("console.marketplace.calls.new.fields.deadline", undefined, "Deadline")}
              name="deadline_at"
              type="datetime-local"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t("console.marketplace.calls.new.fields.feeMin", undefined, "Fee Min")}
              name="fee_min"
              placeholder="2500"
            />
            <Input
              label={t("console.marketplace.calls.new.fields.feeMax", undefined, "Fee Max")}
              name="fee_max"
              placeholder="7500"
            />
            <Input
              label={t("console.marketplace.calls.new.fields.currency", undefined, "Currency")}
              name="currency"
              maxLength={3}
              defaultValue="USD"
            />
          </div>
        </FormShell>
      </div>
    </>
  );
}
