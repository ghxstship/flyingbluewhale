import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { getRequestT } from "@/lib/i18n/request";
import { createSavedSearchAction, deleteSavedSearchAction } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  kind: string;
  name: string;
  query: Record<string, unknown>;
  alert_email: boolean;
  alert_push: boolean;
  match_count: number;
  last_checked_at: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) return <div>{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_searches")
    .select("id, kind, name, query, alert_email, alert_push, match_count, last_checked_at")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <header>
        <div className="text-label text-[var(--color-text-tertiary)]">
          {t("me.savedSearches.eyebrow", undefined, "Saved searches")}
        </div>
        <h1 className="text-display mt-1 text-3xl">{t("me.savedSearches.title", undefined, "Saved Searches")}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {t(
            "me.savedSearches.subtitle",
            undefined,
            "Subscriptions across marketplace surfaces. Email + push alerts when new matches drop.",
          )}
        </p>
      </header>

      <section className="card-elevated p-4">
        <h2 className="text-label mb-3 text-[var(--color-text-tertiary)]">
          {t("me.savedSearches.add.title", undefined, "Add subscription")}
        </h2>
        <FormShell action={createSavedSearchAction} submitLabel={t("common.save", undefined, "Save")}>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("me.savedSearches.fields.kind", undefined, "Kind")}
            </label>
            <select name="kind" required className="ps-input mt-1.5 w-full">
              <option value="gig">{t("me.savedSearches.kinds.gig", undefined, "Gig")}</option>
              <option value="rfq">{t("me.savedSearches.kinds.rfq", undefined, "RFQ")}</option>
              <option value="talent_call">{t("me.savedSearches.kinds.talentCall", undefined, "Talent Call")}</option>
              <option value="talent">{t("me.savedSearches.kinds.talent", undefined, "Talent")}</option>
              <option value="crew">{t("me.savedSearches.kinds.crew", undefined, "Crew")}</option>
              <option value="vendor">{t("me.savedSearches.kinds.vendor", undefined, "Vendor")}</option>
            </select>
          </div>
          <Input
            label={t("me.savedSearches.fields.name", undefined, "Name")}
            name="name"
            required
            placeholder={t("me.savedSearches.fields.namePlaceholder", undefined, "A1 / Lighting Programmer · FL")}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("me.savedSearches.fields.query", undefined, "Query — JSON")}
            </label>
            <textarea
              name="query"
              rows={4}
              maxLength={4000}
              className="ps-input mt-1.5 w-full font-mono text-xs"
              placeholder='{"role":"A1","region":"FL"}'
            />
          </div>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="alert_email" />{" "}
              {t("me.savedSearches.fields.emailAlerts", undefined, "Email alerts")}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="alert_push" />{" "}
              {t("me.savedSearches.fields.pushAlerts", undefined, "Push alerts")}
            </label>
          </div>
        </FormShell>
      </section>

      <section>
        <h2 className="text-label mb-3 text-[var(--color-text-tertiary)]">
          {t("me.savedSearches.active.title", undefined, "Active subscriptions")}
        </h2>
        {rows.length === 0 ? (
          <div className="card-elevated p-6 text-sm text-[var(--color-text-secondary)]">
            {t("me.savedSearches.empty", undefined, "No saved searches yet.")}
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="card-elevated flex items-center justify-between p-3 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="muted">{toTitle(r.kind)}</Badge>
                  <span className="font-semibold">{r.name}</span>
                  {r.alert_email && (
                    <Badge variant="info">{t("me.savedSearches.badge.email", undefined, "email")}</Badge>
                  )}
                  {r.alert_push && <Badge variant="info">{t("me.savedSearches.badge.push", undefined, "push")}</Badge>}
                  <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                    {t("me.savedSearches.matches", { count: r.match_count }, `${r.match_count} matches`)}
                  </span>
                </div>
                <form
                  action={async (fd) => {
                    "use server";
                    await deleteSavedSearchAction(null, fd);
                  }}
                >
                  <input type="hidden" name="search_id" value={r.id} />
                  <button type="submit" className="ps-btn ps-btn--ghost text-xs">
                    {t("common.remove", undefined, "Remove")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
