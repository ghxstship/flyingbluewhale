import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createTalentAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.talent.new.eyebrow", undefined, "Marketplace")}
        title={t("console.marketplace.talent.new.title", undefined, "New Talent Profile")}
        subtitle={t("console.marketplace.talent.new.subtitle", undefined, "Create the EPK. Publish when ready.")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createTalentAction}
          cancelHref="/console/marketplace/talent"
          submitLabel={t("console.marketplace.talent.new.submit", undefined, "Save Profile")}
        >
          <Input
            label={t("console.marketplace.talent.new.actName", undefined, "Act Name")}
            name="act_name"
            required
            maxLength={200}
          />
          <Input
            label={t("console.marketplace.talent.new.tagline", undefined, "Tagline")}
            name="tagline"
            maxLength={200}
            placeholder={t(
              "console.marketplace.talent.new.taglinePlaceholder",
              undefined,
              "L.A. four-piece. Dust and dance music.",
            )}
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.marketplace.talent.new.bio", undefined, "Bio")}
            </label>
            <textarea name="bio" rows={6} maxLength={8000} className="input-base mt-1.5 w-full" />
          </div>
          <Input
            label={t("console.marketplace.talent.new.genreTags", undefined, "Genre Tags — Comma-separated")}
            name="genre_tags"
            placeholder={t("console.marketplace.talent.new.genreTagsPlaceholder", undefined, "indie-rock, post-punk")}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t("console.marketplace.talent.new.feeMin", undefined, "Fee Min")}
              name="fee_min"
              placeholder="2500"
            />
            <Input
              label={t("console.marketplace.talent.new.feeMax", undefined, "Fee Max")}
              name="fee_max"
              placeholder="7500"
            />
            <Input
              label={t("console.marketplace.talent.new.currency", undefined, "Currency")}
              name="currency"
              defaultValue="USD"
              maxLength={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.marketplace.talent.new.travelRadius", undefined, "Travel Radius — km")}
              name="travel_radius_km"
              type="number"
            />
            <Input
              label={t("console.marketplace.talent.new.depositPct", undefined, "Deposit %")}
              name="deposit_pct"
              type="number"
              defaultValue="60"
              min={0}
              max={100}
            />
          </div>
          <Input
            label={t("console.marketplace.talent.new.reelUrl", undefined, "Reel URL")}
            name="video_reel_url"
            placeholder="https://youtube.com/watch?v=..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.marketplace.talent.new.agentName", undefined, "Agent Name")}
              name="agent_name"
              maxLength={120}
            />
            <Input
              label={t("console.marketplace.talent.new.agentEmail", undefined, "Agent Email")}
              name="agent_email"
              type="email"
            />
          </div>
        </FormShell>
      </div>
    </>
  );
}
