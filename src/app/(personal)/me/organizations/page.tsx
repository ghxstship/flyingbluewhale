import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { SetActiveButton } from "./SetActiveButton";

type Row = { id: string; role: string; orgs: { id: string; name: string; slug: string; tier: string } | null };

export const dynamic = "force-dynamic";

export default async function OrgsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">{t("me.organizations.title", undefined, "Organizations")}</h1>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">
          {t("me.organizations.configureSupabase", undefined, "Configure Supabase.")}
        </p>
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("id,role,orgs(id,name,slug,tier)")
    .eq("user_id", session.userId)
    .is("deleted_at", null);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("me.organizations.title", undefined, "Organizations")}
      </h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t(
          "me.organizations.switcherSubtitle",
          undefined,
          "Every organization you belong to. The active one decides which workspace your console, portals, and notifications resolve to.",
        )}
      </p>
      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t("me.organizations.empty.title", undefined, "No memberships yet")}
            description={t(
              "me.organizations.empty.memberDescription",
              undefined,
              "You'll join an organization when a production team invites you. In the meantime, your marketplace profile and applications work without one.",
            )}
            action={
              <Link href="/marketplace" className="ps-btn ps-btn--sm">
                {t("me.organizations.empty.browseMarketplace", undefined, "Browse the Marketplace")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="surface mt-6 divide-y divide-[var(--p-border)]">
          {rows.map((r) => {
            const isActive = r.orgs?.id === session.orgId;
            return (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {r.orgs?.name ?? t("me.organizations.unknownOrg", undefined, "Unknown organization")}
                    {isActive && (
                      <Badge variant="success">{t("me.organizations.activeBadge", undefined, "Active")}</Badge>
                    )}
                  </div>
                  <div className="font-mono text-xs text-[var(--p-text-2)]">{r.orgs?.slug}</div>
                </div>
                <div className="flex items-center gap-3">
                  {r.orgs?.tier && <Badge variant="cyan">{toTitle(r.orgs.tier)}</Badge>}
                  <Badge variant="brand">{toTitle(r.role)}</Badge>
                  {!isActive && r.orgs && <SetActiveButton orgId={r.orgs.id} orgName={r.orgs.name} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
