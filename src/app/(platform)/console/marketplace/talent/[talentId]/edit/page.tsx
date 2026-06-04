import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { updateTalentAction } from "./actions";
import { getRequestT } from "@/lib/i18n/request";

type Talent = {
  id: string;
  act_name: string;
  tagline: string | null;
  bio: string | null;
  genre_tags: string[];
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  travel_radius_km: number | null;
  deposit_pct: number;
  agent_email: string | null;
  agent_name: string | null;
  video_reel_url: string | null;
};

const dollars = (cents: number | null) => (cents == null ? "" : (cents / 100).toFixed(0));

export default async function Page({ params }: { params: Promise<{ talentId: string }> }) {
  const { talentId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("talent_profiles")
    .select("*")
    .eq("id", talentId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const talent = data as Talent;
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.talent.edit.eyebrow", undefined, "Marketplace · Talent")}
        title={t("console.marketplace.talent.edit.title", { actName: talent.act_name }, `Edit · ${talent.act_name}`)}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateTalentAction}
          cancelHref={`/console/marketplace/talent/${talent.id}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          <input type="hidden" name="talent_id" value={talent.id} />
          <Input
            label={t("console.marketplace.talent.edit.actName", undefined, "Act Name")}
            name="act_name"
            required
            maxLength={200}
            defaultValue={talent.act_name}
          />
          <Input
            label={t("console.marketplace.talent.edit.tagline", undefined, "Tagline")}
            name="tagline"
            maxLength={200}
            defaultValue={talent.tagline ?? ""}
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.marketplace.talent.edit.bio", undefined, "Bio")}
            </label>
            <textarea
              name="bio"
              rows={6}
              maxLength={8000}
              className="input-base mt-1.5 w-full"
              defaultValue={talent.bio ?? ""}
            />
          </div>
          <Input
            label={t("console.marketplace.talent.edit.genreTags", undefined, "Genre Tags (comma-separated)")}
            name="genre_tags"
            defaultValue={talent.genre_tags.join(", ")}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t("console.marketplace.talent.edit.feeMin", undefined, "Fee Min")}
              name="fee_min"
              defaultValue={dollars(talent.fee_min_cents)}
            />
            <Input
              label={t("console.marketplace.talent.edit.feeMax", undefined, "Fee Max")}
              name="fee_max"
              defaultValue={dollars(talent.fee_max_cents)}
            />
            <Input
              label={t("console.marketplace.talent.edit.currency", undefined, "Currency")}
              name="currency"
              maxLength={3}
              defaultValue={talent.currency}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.marketplace.talent.edit.travelRadius", undefined, "Travel Radius (km)")}
              name="travel_radius_km"
              type="number"
              defaultValue={talent.travel_radius_km ?? ""}
            />
            <Input
              label={t("console.marketplace.talent.edit.depositPct", undefined, "Deposit %")}
              name="deposit_pct"
              type="number"
              min={0}
              max={100}
              defaultValue={talent.deposit_pct}
            />
          </div>
          <Input
            label={t("console.marketplace.talent.edit.reelUrl", undefined, "Reel URL")}
            name="video_reel_url"
            defaultValue={talent.video_reel_url ?? ""}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.marketplace.talent.edit.agentName", undefined, "Agent Name")}
              name="agent_name"
              defaultValue={talent.agent_name ?? ""}
            />
            <Input
              label={t("console.marketplace.talent.edit.agentEmail", undefined, "Agent Email")}
              name="agent_email"
              type="email"
              defaultValue={talent.agent_email ?? ""}
            />
          </div>
        </FormShell>
      </div>
    </>
  );
}
