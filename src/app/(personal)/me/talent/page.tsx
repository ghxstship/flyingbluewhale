import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
  if (!hasSupabase) return <div>Configure Supabase.</div>;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
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
  const t = (data ?? null) as Talent | null;

  return (
    <div className="space-y-6">
      <header>
        <div className="text-label text-[var(--color-text-tertiary)]">My talent profile</div>
        <h1 className="text-display mt-1 text-3xl">EPK</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Public when toggled. Discovered via{" "}
          <Link className="text-[var(--brand-color)]" href="/marketplace/talent">
            /marketplace/talent
          </Link>
          .
          {t?.public_handle && t?.is_public && (
            <>
              {" "}
              Live at{" "}
              <Link className="font-mono text-[var(--brand-color)]" href={`/marketplace/talent/${t.public_handle}`}>
                /marketplace/talent/{t.public_handle}
              </Link>
            </>
          )}
        </p>
      </header>

      {t?.is_public && (
        <div className="card-elevated p-3">
          <Badge variant="success">live</Badge>
          <span className="ml-3 text-sm text-[var(--color-text-secondary)]">Your EPK is published.</span>
        </div>
      )}

      <FormShell action={upsertMyTalentAction} submitLabel="Save EPK">
        <Input label="Act Name" name="act_name" required maxLength={200} defaultValue={t?.act_name ?? ""} />
        <Input label="Tagline" name="tagline" maxLength={200} defaultValue={t?.tagline ?? ""} />
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Bio</label>
          <textarea
            name="bio"
            rows={6}
            maxLength={8000}
            className="input-base mt-1.5 w-full"
            defaultValue={t?.bio ?? ""}
          />
        </div>
        <Input label="Genre Tags (comma-separated)" name="genre_tags" defaultValue={t?.genre_tags.join(", ") ?? ""} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Fee Min" name="fee_min" defaultValue={t?.fee_min_cents ? String(t.fee_min_cents / 100) : ""} />
          <Input label="Fee Max" name="fee_max" defaultValue={t?.fee_max_cents ? String(t.fee_max_cents / 100) : ""} />
        </div>
        <Input label="Reel URL" name="video_reel_url" defaultValue={t?.video_reel_url ?? ""} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_public" defaultChecked={t?.is_public ?? false} />
          Publish to /marketplace/talent
        </label>
      </FormShell>
    </div>
  );
}
