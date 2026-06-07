import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  public_handle: string;
  display_name: string;
  bio: string | null;
  logo_url: string | null;
  website_url: string | null;
  default_commission_bps: number;
  is_verified: boolean;
  artist_count: number;
};

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!hasSupabase) return notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("public_agency_directory").select("*").eq("public_handle", handle).maybeSingle();
  if (!data) return notFound();
  const a = data as Row;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Agencies", href: "/marketplace/agencies" },
          { label: a.display_name },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">@{a.public_handle}</div>
        <div className="mt-4 flex items-start gap-3">
          <h1 className="hed-2xl">{a.display_name}</h1>
          {a.is_verified && <Badge variant="success">verified</Badge>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 pb-16">
        {a.bio && (
          <div className="surface p-5">
            <h2 className="hed-md mb-3">About</h2>
            <div className="text-sm whitespace-pre-wrap">{a.bio}</div>
          </div>
        )}

        <div className="surface p-5">
          <h2 className="hed-md mb-3">Profile</h2>
          <dl className="space-y-1 text-sm">
            <div>
              <span className="text-[var(--p-text-2)]">Roster size:</span> {a.artist_count}
            </div>
            <div>
              <span className="text-[var(--p-text-2)]">Default commission:</span>{" "}
              {(a.default_commission_bps / 100).toFixed(2)}%
            </div>
            <div>
              <span className="text-[var(--p-text-2)]">Web:</span>{" "}
              {a.website_url ? (
                <a href={a.website_url} target="_blank" rel="noopener" className="font-mono text-[var(--p-accent)]">
                  {a.website_url} ↗
                </a>
              ) : (
                "—"
              )}
            </div>
          </dl>
        </div>

        <div className="flex items-center gap-3">
          <Button href={`/login?redirect=/marketplace/agencies/${a.public_handle}/inquire`}>Send Inquiry</Button>
          <Button href="/signup" variant="ghost">
            Need an account?
          </Button>
        </div>
      </section>
    </>
  );
}
