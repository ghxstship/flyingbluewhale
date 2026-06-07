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
  is_public: boolean;
  video_reel_url: string | null;
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
      "id, public_handle, act_name, tagline, bio, genre_tags, fee_min_cents, fee_max_cents, is_public, video_reel_url",
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
        <div className="text-label text-[var(--color-text-tertiary)]">
          {t("me.talent.eyebrow", undefined, "My talent profile")}
        </div>
        <h1 className="text-display mt-1 text-3xl">{t("me.talent.title", undefined, "EPK")}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {t("me.talent.descriptionPrefix", undefined, "Public when toggled. Discovered via")}{" "}
          <Link className="text-[var(--brand-color)]" href="/marketplace/talent">
            /marketplace/talent
          </Link>
          .
          {talent?.public_handle && talent?.is_public && (
            <>
              {" "}
              {t("me.talent.liveAt", undefined, "Live at")}{" "}
              <Link
                className="font-mono text-[var(--brand-color)]"
                href={`/marketplace/talent/${talent.public_handle}`}
              >
                /marketplace/talent/{talent.public_handle}
              </Link>
            </>
          )}
        </p>
      </header>

      {talent?.is_public && (
        <div className="card-elevated p-3">
          <Badge variant="success">{t("me.talent.liveBadge", undefined, "live")}</Badge>
          <span className="ms-3 text-sm text-[var(--color-text-secondary)]">
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
          label={t("me.talent.fields.tagline", undefined, "Tagline")}
          name="tagline"
          maxLength={200}
          defaultValue={talent?.tagline ?? ""}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("me.talent.fields.bio", undefined, "Bio")}
          </label>
          <textarea
            name="bio"
            rows={6}
            maxLength={8000}
            className="ps-input mt-1.5 w-full"
            defaultValue={talent?.bio ?? ""}
          />
        </div>
        <Input
          label={t("me.talent.fields.genreTags", undefined, "Genre Tags — Comma-separated")}
          name="genre_tags"
          defaultValue={talent?.genre_tags.join(", ") ?? ""}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("me.talent.fields.feeMin", undefined, "Fee Min")}
            name="fee_min"
            defaultValue={talent?.fee_min_cents ? String(talent.fee_min_cents / 100) : ""}
          />
          <Input
            label={t("me.talent.fields.feeMax", undefined, "Fee Max")}
            name="fee_max"
            defaultValue={talent?.fee_max_cents ? String(talent.fee_max_cents / 100) : ""}
          />
        </div>
        <Input
          label={t("me.talent.fields.reelUrl", undefined, "Reel URL")}
          name="video_reel_url"
          defaultValue={talent?.video_reel_url ?? ""}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_public" defaultChecked={talent?.is_public ?? false} />
          {t("me.talent.fields.publishToMarketplace", undefined, "Publish to /marketplace/talent")}
        </label>
      </FormShell>
    </div>
  );
}
