import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRequestT } from "@/lib/i18n/request";

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
        {t("me.organizations.subtitle", undefined, "Every org you're a member of")}
      </p>
      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t("me.organizations.empty.title", undefined, "No memberships yet")}
            description={t(
              "me.organizations.empty.description",
              undefined,
              "Create an organization from the console to get started.",
            )}
          />
        </div>
      ) : (
        <div className="surface mt-6 divide-y divide-[var(--p-border)]">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-5">
              <div>
                <div className="text-sm font-semibold">{r.orgs?.name ?? "—"}</div>
                <div className="font-mono text-xs text-[var(--p-text-2)]">{r.orgs?.slug}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="cyan">{r.orgs?.tier}</Badge>
                <Badge variant="brand">{r.role}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
