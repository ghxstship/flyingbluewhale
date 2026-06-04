import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateProfile, updatePublicProfile } from "./actions";

export const dynamic = "force-dynamic";

type PublicProfile = {
  user_id: string;
  public_handle: string | null;
  display_name: string | null;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
  hero_url: string | null;
  links: Array<{ label?: string; url?: string }> | unknown;
  is_public: boolean;
  available_for_work: boolean;
  verified_email_at: string | null;
  verified_id_at: string | null;
  verified_payout_at: string | null;
  rating_avg: number | null;
  rating_count: number;
};

function linksToText(links: PublicProfile["links"]): string {
  if (!Array.isArray(links)) return "";
  return (links as Array<{ label?: string; url?: string }>)
    .filter((l) => l && typeof l.url === "string" && l.url)
    .map((l) => (l.label ? `${l.label}|${l.url}` : (l.url ?? "")))
    .join("\n");
}

export default async function ProfilePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">{t("me.profile.title", undefined, "Profile")}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {t("me.profile.configureSupabase", undefined, "Configure Supabase.")}
        </p>
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: user }, { data: profileData }] = await Promise.all([
    supabase.from("users").select("*").eq("id", session.userId).maybeSingle(),
    supabase
      .from("user_profiles")
      .select(
        "user_id, public_handle, display_name, tagline, bio, avatar_url, hero_url, links, is_public, available_for_work, verified_email_at, verified_id_at, verified_payout_at, rating_avg, rating_count",
      )
      .eq("user_id", session.userId)
      .maybeSingle(),
  ]);
  const profile = (profileData as PublicProfile | null) ?? null;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t("me.profile.title", undefined, "Profile")}</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {t(
          "me.profile.intro",
          undefined,
          "Display name + avatar are visible to teammates across all workspaces. The public profile below is what the marketplace shows to anonymous visitors (only when public).",
        )}
      </p>

      <div className="surface mt-6 p-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={profile?.display_name ?? user?.name ?? user?.email}
            src={profile?.avatar_url ?? user?.avatar_url ?? undefined}
            size="lg"
          />
          <div>
            <div className="text-sm font-semibold">
              {profile?.display_name ?? user?.name ?? t("me.profile.unnamed", undefined, "Unnamed")}
            </div>
            <div className="font-mono text-xs text-[var(--text-muted)]">{user?.email}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {profile?.is_public ? (
                <Badge variant="success">{t("me.profile.badges.public", undefined, "Public")}</Badge>
              ) : (
                <Badge variant="muted">{t("me.profile.badges.private", undefined, "Private")}</Badge>
              )}
              {profile?.available_for_work && (
                <Badge variant="info">{t("me.profile.badges.availableForWork", undefined, "Available for work")}</Badge>
              )}
              {profile?.verified_email_at && (
                <Badge variant="muted">{t("me.profile.badges.emailVerified", undefined, "Email verified")}</Badge>
              )}
              {profile?.verified_id_at && (
                <Badge variant="muted">{t("me.profile.badges.idVerified", undefined, "ID verified")}</Badge>
              )}
              {profile?.verified_payout_at && (
                <Badge variant="muted">{t("me.profile.badges.payoutVerified", undefined, "Payout verified")}</Badge>
              )}
            </div>
            {profile?.public_handle && (
              <div className="mt-1 text-xs">
                <Link
                  href={`/marketplace/talent/${profile.public_handle}`}
                  className="font-mono text-[var(--org-primary)] hover:underline"
                >
                  @{profile.public_handle}
                </Link>
                {profile.rating_count > 0 && (
                  <span className="ms-2 font-mono text-[var(--text-muted)]">
                    {profile.rating_avg?.toFixed(1) ?? "—"} ★ ({profile.rating_count})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="surface mt-6 p-6">
        <h2 className="text-sm font-semibold">{t("me.profile.workspace.title", undefined, "Workspace Identity")}</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {t("me.profile.workspace.subtitle", undefined, "Shown to teammates in every workspace you belong to.")}
        </p>
        <div className="mt-4 max-w-md">
          <FormShell
            action={updateProfile}
            submitLabel={t("me.profile.workspace.submit", undefined, "Save Workspace Profile")}
          >
            <Input
              label={t("me.profile.workspace.displayName", undefined, "Display Name")}
              name="name"
              maxLength={120}
              defaultValue={user?.name ?? ""}
              required
            />
            <Input
              label={t("me.profile.workspace.avatarUrl", undefined, "Avatar URL")}
              name="avatar_url"
              type="url"
              maxLength={500}
              defaultValue={user?.avatar_url ?? ""}
              placeholder="https://…"
            />
          </FormShell>
        </div>
      </div>

      <div className="surface mt-6 p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">{t("me.profile.public.title", undefined, "Public Profile")}</h2>
          <span className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">user_profiles</span>
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {t(
            "me.profile.public.intro.before",
            undefined,
            "Marketplace-facing EPK. Only visible to anonymous visitors when ",
          )}
          <strong>{t("me.profile.public.intro.toggle", undefined, "Make profile public")}</strong>
          {t(
            "me.profile.public.intro.after",
            undefined,
            " is checked. Verification badges are awarded by the platform — they don’t appear here as editable fields.",
          )}
        </p>
        <div className="mt-4 max-w-2xl">
          <FormShell
            action={updatePublicProfile}
            submitLabel={t("me.profile.public.submit", undefined, "Save Public Profile")}
          >
            <Input
              label={t("me.profile.public.handle.label", undefined, "Public handle")}
              name="public_handle"
              maxLength={64}
              defaultValue={profile?.public_handle ?? ""}
              placeholder="luna-rose"
              pattern="[a-z0-9_-]{3,64}"
              hint={t(
                "me.profile.public.handle.hint",
                undefined,
                "3–64 chars, lowercase letters / digits / underscore / hyphen. Unique across the platform.",
              )}
            />
            <Input
              label={t("me.profile.public.displayName.label", undefined, "Display name")}
              name="display_name"
              maxLength={120}
              defaultValue={profile?.display_name ?? ""}
              placeholder="Luna Rose"
              hint={t(
                "me.profile.public.displayName.hint",
                undefined,
                "Falls back to workspace display name when blank.",
              )}
            />
            <Input
              label={t("me.profile.public.tagline.label", undefined, "Tagline")}
              name="tagline"
              maxLength={140}
              defaultValue={profile?.tagline ?? ""}
              placeholder="Production designer · Festival circuit · Brooklyn → Mexico City"
              hint={t(
                "me.profile.public.tagline.hint",
                undefined,
                "One line. Shown under the name on /marketplace listings.",
              )}
            />
            <label className="block text-sm">
              <span className="text-label">{t("me.profile.public.bio.label", undefined, "Bio")}</span>
              <textarea
                name="bio"
                rows={5}
                maxLength={2000}
                className="input-base mt-1 w-full resize-y"
                defaultValue={profile?.bio ?? ""}
                placeholder={t("me.profile.public.bio.placeholder", undefined, "A few paragraphs about your practice.")}
              />
              <span className="text-[10px] text-[var(--text-muted)]">
                {t("me.profile.public.bio.hint", undefined, "Markdown not parsed — plain text only.")}
              </span>
            </label>
            <Input
              label={t("me.profile.public.avatarUrl.label", undefined, "Avatar URL")}
              name="avatar_url"
              type="url"
              maxLength={500}
              defaultValue={profile?.avatar_url ?? ""}
              placeholder="https://…"
              hint={t(
                "me.profile.public.avatarUrl.hint",
                undefined,
                "Shown as the round portrait. Square images render best.",
              )}
            />
            <Input
              label={t("me.profile.public.heroUrl.label", undefined, "Hero URL")}
              name="hero_url"
              type="url"
              maxLength={500}
              defaultValue={profile?.hero_url ?? ""}
              placeholder="https://…"
              hint={t(
                "me.profile.public.heroUrl.hint",
                undefined,
                "16:9 banner at the top of /marketplace/<role>/<handle>.",
              )}
            />
            <label className="block text-sm">
              <span className="text-label">{t("me.profile.public.links.label", undefined, "Links")}</span>
              <textarea
                name="links"
                rows={4}
                maxLength={2000}
                className="input-base mt-1 w-full resize-y font-mono text-xs"
                defaultValue={linksToText(profile?.links)}
                placeholder={"Website|https://lunarose.studio\nInstagram|https://instagram.com/lunarose"}
              />
              <span className="text-[10px] text-[var(--text-muted)]">
                {t("me.profile.public.links.hint.before", undefined, "One per line as ")}
                <code>Label|URL</code>
                {t("me.profile.public.links.hint.after", undefined, ". Label optional (defaults to the host).")}
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_public" value="true" defaultChecked={profile?.is_public ?? false} />
              {t("me.profile.public.isPublic", undefined, "Make profile public on /marketplace")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="available_for_work"
                value="true"
                defaultChecked={profile?.available_for_work ?? false}
              />
              {t("me.profile.public.availableForWork", undefined, "Currently available for work")}
            </label>
          </FormShell>
        </div>
      </div>
    </div>
  );
}
