import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Rider = {
  id: string;
  kind: string;
  version: number;
  is_current: boolean;
  title: string | null;
  file_url: string | null;
  created_at: string;
};

type Talent = { id: string; act_name: string };

export default async function Page({ params }: { params: Promise<{ talentId: string }> }) {
  const { talentId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();

  const [talentResp, ridersResp] = await Promise.all([
    supabase
      .from("talent_profiles")
      .select("id, act_name")
      .eq("id", talentId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("talent_riders")
      .select("id, kind, version, is_current, title, file_url, created_at")
      .eq("talent_profile_id", talentId)
      .eq("org_id", session.orgId)
      .order("kind")
      .order("version", { ascending: false }),
  ]);

  if (!talentResp.data) return notFound();
  const talent = talentResp.data as Talent;
  const riders = (ridersResp.data ?? []) as Rider[];

  const byKind = riders.reduce<Record<string, Rider[]>>((acc, r) => {
    (acc[r.kind] ??= []).push(r);
    return acc;
  }, {});
  const fmt = await getRequestFormatters();

  return (
    <>
      <ModuleHeader
        eyebrow={`Talent · ${talent.act_name}`}
        title="Riders"
        subtitle="Tech, hospitality, input list — versioned. New version supersedes the current one."
        action={
          <Button href={`/console/marketplace/talent/${talent.id}/riders/new`} size="sm">
            + New Rider
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {Object.keys(byKind).length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--text-secondary)]">
            No riders attached. Add a tech, hospitality, or input-list rider.
          </div>
        ) : (
          (["tech", "hospitality", "input_list"] as const).map((kind) => {
            const list = byKind[kind] ?? [];
            if (list.length === 0) return null;
            return (
              <section key={kind} className="surface p-5">
                <h2 className="mb-3 text-sm font-semibold tracking-wide capitalize uppercase">
                  {kind.replace("_", " ")}
                </h2>
                <ul className="divide-y divide-[var(--border-subtle)]">
                  {list.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                      <Link
                        href={`/console/marketplace/talent/${talent.id}/riders/${r.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="font-mono">v{r.version}</span>
                        <span>{r.title ?? "—"}</span>
                        {r.is_current && <Badge variant="success">current</Badge>}
                      </Link>
                      <span className="font-mono text-xs text-[var(--text-secondary)]">
                        {fmt.date(r.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
