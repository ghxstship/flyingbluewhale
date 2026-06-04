import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Rider = {
  id: string;
  talent_profile_id: string;
  kind: string;
  version: number;
  title: string | null;
  content: { body?: string } | Record<string, unknown>;
  file_url: string | null;
  is_current: boolean;
  created_at: string;
};

export default async function Page({ params }: { params: Promise<{ talentId: string; riderId: string }> }) {
  const { talentId, riderId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("talent_riders")
    .select("*")
    .eq("id", riderId)
    .eq("talent_profile_id", talentId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const r = data as Rider;
  const body = (r.content as { body?: string })?.body ?? null;
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t(
          "console.marketplace.talent.riders.detail.eyebrow",
          { kind: toTitle(r.kind), version: r.version },
          `Rider · ${toTitle(r.kind)} v${r.version}`,
        )}
        title={r.title ?? `${r.kind} v${r.version}`}
        action={
          <div className="flex items-center gap-2">
            {r.is_current && (
              <Badge variant="success">
                {t("console.marketplace.talent.riders.detail.currentBadge", undefined, "current")}
              </Badge>
            )}
            <Button href={`/console/marketplace/talent/${talentId}/riders`} size="sm" variant="ghost">
              {t("common.back", undefined, "Back")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.talent.riders.detail.bodyHeading", undefined, "Body")}
          </h2>
          <div className="text-sm whitespace-pre-wrap">{body ?? "—"}</div>
        </section>
        {r.file_url && (
          <section className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.talent.riders.detail.attachedFileHeading", undefined, "Attached File")}
            </h2>
            <a href={r.file_url} target="_blank" rel="noopener" className="font-mono text-sm text-[var(--org-primary)]">
              {r.file_url} ↗
            </a>
          </section>
        )}
      </div>
    </>
  );
}
