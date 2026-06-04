import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { upsertMyCrewAction } from "./actions";

export const dynamic = "force-dynamic";

type Crew = {
  id: string;
  public_handle: string | null;
  name: string;
  tagline: string | null;
  bio: string | null;
  roles: string[];
  unions: string[];
  certifications: string[];
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  travel_radius_km: number | null;
  reel_url: string | null;
  is_public_profile: boolean;
  availability_open: boolean;
};

const dollars = (cents: number | null) => (cents == null ? "" : (cents / 100).toFixed(0));

export default async function Page() {
  if (!hasSupabase) return <div>Configure Supabase.</div>;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("crew_members")
    .select("*")
    .eq("user_id", session.userId)
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const c = (data ?? null) as Crew | null;

  return (
    <div className="space-y-6">
      <header>
        <div className="text-label text-[var(--color-text-tertiary)]">My crew profile</div>
        <h1 className="text-display mt-1 text-3xl">Crew Profile</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Public when toggled. Discovered via{" "}
          <Link className="text-[var(--brand-color)]" href="/marketplace/crew">
            /marketplace/crew
          </Link>
          .
          {c?.public_handle && c?.is_public_profile && (
            <>
              {" "}
              Live at{" "}
              <Link className="font-mono text-[var(--brand-color)]" href={`/marketplace/crew/${c.public_handle}`}>
                /marketplace/crew/{c.public_handle}
              </Link>
            </>
          )}
        </p>
      </header>

      {c?.is_public_profile && (
        <div className="card-elevated p-3">
          <Badge variant="success">live</Badge>
          <span className="ms-3 text-sm text-[var(--color-text-secondary)]">Profile published.</span>
        </div>
      )}

      <FormShell action={upsertMyCrewAction} submitLabel="Save Profile">
        <Input label="Name" name="name" required maxLength={200} defaultValue={c?.name ?? ""} />
        <Input label="Tagline" name="tagline" maxLength={200} defaultValue={c?.tagline ?? ""} />
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Bio</label>
          <textarea
            name="bio"
            rows={6}
            maxLength={8000}
            className="input-base mt-1.5 w-full"
            defaultValue={c?.bio ?? ""}
          />
        </div>
        <Input
          label="Roles (comma-separated)"
          name="roles"
          defaultValue={c?.roles.join(", ") ?? ""}
          placeholder="A1, A2, Lighting Programmer"
        />
        <Input label="Unions" name="unions" defaultValue={c?.unions.join(", ") ?? ""} placeholder="IATSE Local 500" />
        <Input
          label="Certifications"
          name="certifications"
          defaultValue={c?.certifications.join(", ") ?? ""}
          placeholder="ETCP Rigging, OSHA-30"
        />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Day Rate Min" name="day_rate_min" defaultValue={dollars(c?.day_rate_min_cents ?? null)} />
          <Input label="Day Rate Max" name="day_rate_max" defaultValue={dollars(c?.day_rate_max_cents ?? null)} />
          <Input
            label="Travel Radius (km)"
            name="travel_radius_km"
            type="number"
            defaultValue={c?.travel_radius_km ?? ""}
          />
        </div>
        <Input label="Reel URL" name="reel_url" defaultValue={c?.reel_url ?? ""} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="availability_open" defaultChecked={c?.availability_open ?? false} />
          Available for work
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_public_profile" defaultChecked={c?.is_public_profile ?? false} />
          Publish to /marketplace/crew
        </label>
      </FormShell>
    </div>
  );
}
