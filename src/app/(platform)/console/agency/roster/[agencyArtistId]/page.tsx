import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { getRequestT } from "@/lib/i18n/request";
import { updateAgencyArtistAction, endAgencyArtistAction } from "./actions";

type Entry = {
  id: string;
  talent_profile_id: string;
  agency_id: string;
  commission_bps: number | null;
  exclusive: boolean;
  signed_at: string | null;
  ended_at: string | null;
  talent: { act_name: string } | null;
};

export default async function Page({ params }: { params: Promise<{ agencyArtistId: string }> }) {
  const { agencyArtistId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("agency_artists")
    .select("*, talent:talent_profile_id(act_name)")
    .eq("id", agencyArtistId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const e = data as Entry;
  const isEnded = !!e.ended_at;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.agency.roster.detail.eyebrow", undefined, "Agency · Roster")}
        title={e.talent?.act_name ?? t("console.agency.roster.detail.fallbackTitle", undefined, "Roster Entry")}
        subtitle={`${t("console.agency.roster.detail.signedPrefix", undefined, "Signed")} ${e.signed_at ?? "—"}${isEnded ? ` · ${t("console.agency.roster.detail.endedPrefix", undefined, "ended")} ${e.ended_at}` : ""}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={e.exclusive ? "success" : "muted"}>
              {e.exclusive
                ? t("console.agency.roster.detail.exclusive", undefined, "exclusive")
                : t("console.agency.roster.detail.nonExclusive", undefined, "non-exclusive")}
            </Badge>
            {isEnded && (
              <Badge variant="muted">{t("console.agency.roster.detail.endedBadge", undefined, "ended")}</Badge>
            )}
          </div>
        }
      />
      <div className="page-content max-w-xl space-y-5">
        <FormShell action={updateAgencyArtistAction} submitLabel={t("common.save", undefined, "Save")}>
          <input type="hidden" name="agency_artist_id" value={e.id} />
          <Input
            label={t("console.agency.roster.detail.commissionLabel", undefined, "Commission — bps · 1000 = 10%")}
            name="commission_bps"
            type="number"
            min={0}
            max={5000}
            defaultValue={e.commission_bps ?? ""}
          />
          <Input
            label={t("console.agency.roster.detail.signedDateLabel", undefined, "Signed date")}
            name="signed_at"
            type="date"
            defaultValue={e.signed_at ?? ""}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="exclusive" defaultChecked={e.exclusive} />
            {t("console.agency.roster.detail.exclusiveAgencyLabel", undefined, "Exclusive agency")}
          </label>
        </FormShell>

        {!isEnded && (
          <form
            action={async (fd) => {
              "use server";
              await endAgencyArtistAction(null, fd);
            }}
          >
            <input type="hidden" name="agency_artist_id" value={e.id} />
            <button type="submit" className="btn btn-ghost text-xs text-[var(--color-error)]">
              {t("console.agency.roster.detail.endRelationship", undefined, "End relationship")}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
