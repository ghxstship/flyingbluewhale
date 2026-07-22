import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { getRequestT } from "@/lib/i18n/request";
import { upsertMyTalentAction } from "./actions";

export const dynamic = "force-dynamic";

type Talent = {
  id: string;
  public_handle: string | null;
  act_name: string;
  tagline: string | null;
  bio: string | null;
  genre_tags: string[];
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  monthly_listeners: number | null;
  follower_count: number | null;
  is_public: boolean;
  video_reel_url: string | null;
  photo_url: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) return <div>{t("me.talent.configureSupabase", undefined, "Configure Supabase.")}</div>;
  const session = await requireSession();
  const supabase = await createClient();
  // Scope to the active org. A user may belong to multiple orgs and have
  // a talent_profile per org — `maybeSingle()` would error otherwise.
  const { data } = await supabase
    .from("talent_profiles")
    .select(
      "id, public_handle, act_name, tagline, bio, genre_tags, fee_min_cents, fee_max_cents, monthly_listeners, follower_count, is_public, video_reel_url, photo_url",
    )
    .eq("user_id", session.userId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const talent = (data ?? null) as Talent | null;

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">
          {t("me.talent.eyebrow", undefined, "My talent profile")}
        </div>
        <h1 className="mt-1">{t("me.talent.title", undefined, "EPK")}</h1>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">
          {t(
            "me.talent.humanDescription",
            undefined,
            "Your electronic press kit. When published, buyers can find you in the",
          )}{" "}
          <Link className="text-[var(--p-accent-text)] underline" href="/marketplace/talent">
            {t("me.talent.marketplaceLink", undefined, "talent marketplace")}
          </Link>
          .
          {talent?.public_handle && talent?.is_public && (
            <>
              {" "}
              <Link
                className="font-medium text-[var(--p-accent-text)] underline"
                href={`/marketplace/talent/${talent.public_handle}`}
              >
                {t("me.talent.viewPublicPage", undefined, "View your public page")}
              </Link>
            </>
          )}
        </p>
      </header>

      {talent?.is_public && (
        <div className="surface-raised p-3">
          <Badge variant="success">{t("me.talent.liveBadge", undefined, "live")}</Badge>
          <span className="ms-3 text-sm text-[var(--p-text-2)]">
            {t("me.talent.publishedNotice", undefined, "Your EPK is published.")}
          </span>
        </div>
      )}

      <FormShell action={upsertMyTalentAction} submitLabel={t("me.talent.submit", undefined, "Save EPK")}>
        <Input
          label={t("me.talent.fields.actName", undefined, "Act Name")}
          name="act_name"
          required
          maxLength={200}
          defaultValue={talent?.act_name ?? ""}
        />
        <Input
          label={t("me.talent.fields.publicHandle", undefined, "Public Handle")}
          name="public_handle"
          maxLength={64}
          defaultValue={talent?.public_handle ?? ""}
          placeholder="luna-rose"
          pattern="[a-zA-Z0-9_-]{3,64}"
          hint={t(
            "me.talent.fields.publicHandleHint",
            undefined,
            "Your public page address. 3 to 64 characters: lowercase letters, digits, hyphen, underscore. Must be unique.",
          )}
        />
        <Input
          label={t("me.talent.fields.tagline", undefined, "Tagline")}
          name="tagline"
          maxLength={200}
          defaultValue={talent?.tagline ?? ""}
        />
        <div>
          <label htmlFor="talent-bio" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("me.talent.fields.bio", undefined, "Bio")}
          </label>
          <textarea
            id="talent-bio"
            name="bio"
            rows={6}
            maxLength={8000}
            className="ps-input mt-1.5 w-full"
            defaultValue={talent?.bio ?? ""}
          />
        </div>
        <div>
          <label htmlFor="talent-photo" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("me.talent.fields.photo", undefined, "Press Photo")}
          </label>
          {talent?.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              loading="lazy"
              decoding="async"
              src={talent.photo_url}
              alt={t("me.talent.fields.photoCurrentAlt", { actName: talent.act_name }, `Current press photo for ${talent.act_name}`)}
              className="mt-2 h-28 w-28 rounded-md object-cover"
            />
          )}
          <input
            id="talent-photo"
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="ps-input mt-1.5 w-full"
          />
          <p className="mt-1 text-[11px] text-[var(--p-text-2)]">
            {t(
              "me.talent.fields.photoHint",
              undefined,
              "JPG, PNG, WebP, or GIF up to 5 MB. Shown on your public page and in marketplace listings.",
            )}
          </p>
        </div>
        <Input
          label={t("me.talent.fields.genreTagsLabel", undefined, "Genre Tags")}
          name="genre_tags"
          defaultValue={talent?.genre_tags.join(", ") ?? ""}
          hint={t("me.talent.fields.genreTagsHint", undefined, "Comma-separated, like: house, disco, live band")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("me.talent.fields.feeMin", undefined, "Fee Min")}
            name="fee_min"
            inputMode="decimal"
            placeholder="2500"
            hint={t("me.talent.fields.feeHint", undefined, "In dollars, numbers only")}
            defaultValue={talent?.fee_min_cents ? String(talent.fee_min_cents / 100) : ""}
          />
          <Input
            label={t("me.talent.fields.feeMax", undefined, "Fee Max")}
            name="fee_max"
            inputMode="decimal"
            placeholder="7500"
            hint={t("me.talent.fields.feeHint", undefined, "In dollars, numbers only")}
            defaultValue={talent?.fee_max_cents ? String(talent.fee_max_cents / 100) : ""}
          />
        </div>
        {/* Audience stats — these columns had no writer anywhere (2026-07-17
            FK/3NF audit), so the public directory rendered permanent dashes.
            Self-reported EPK numbers, like the rest of this form. */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("me.talent.fields.monthlyListeners", undefined, "Monthly Listeners")}
            name="monthly_listeners"
            inputMode="numeric"
            placeholder="120000"
            hint={t("me.talent.fields.countHint", undefined, "Whole number, commas OK")}
            defaultValue={talent?.monthly_listeners != null ? String(talent.monthly_listeners) : ""}
          />
          <Input
            label={t("me.talent.fields.followerCount", undefined, "Followers")}
            name="follower_count"
            inputMode="numeric"
            placeholder="45000"
            hint={t("me.talent.fields.countHint", undefined, "Whole number, commas OK")}
            defaultValue={talent?.follower_count != null ? String(talent.follower_count) : ""}
          />
        </div>
        <Input
          label={t("me.talent.fields.reelUrl", undefined, "Reel URL")}
          name="video_reel_url"
          defaultValue={talent?.video_reel_url ?? ""}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_public" defaultChecked={talent?.is_public ?? false} />
          {t("me.talent.fields.publishToMarketplaceHuman", undefined, "Publish to the talent marketplace")}
        </label>
      </FormShell>
    </div>
  );
}
