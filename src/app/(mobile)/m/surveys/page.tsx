import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Survey = {
  id: string;
  title: string;
  description: string | null;
  anonymous: boolean;
  closes_at: string | null;
};

export default async function MobileSurveysPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [{ data: surveys }, { data: responses }] = await Promise.all([
    supabase
      .from("surveys")
      .select("id, title, description, anonymous, closes_at")
      .eq("org_id", session.orgId)
      .eq("publish_state", "published")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase.from("survey_responses").select("survey_id").eq("respondent_id", session.userId),
  ]);

  const responded = new Set<string>(((responses ?? []) as Array<{ survey_id: string }>).map((r) => r.survey_id));
  const list = (surveys ?? []) as Survey[];

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("m.common.eyebrow", undefined, "Mobile")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.surveys.title", undefined, "Surveys")}</h1>

      <ul className="mt-5 space-y-3">
        {list.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.surveys.empty.title", undefined, "No Active Surveys")}
              description={t("m.surveys.empty.description", undefined, "Open surveys will appear here.")}
            />
          </li>
        ) : (
          list.map((s) => {
            const done = responded.has(s.id);
            return (
              <li key={s.id}>
                <Link
                  href={done ? "#" : `/m/surveys/${s.id}`}
                  className={`surface block p-4 ${done ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    {done ? (
                      <Badge variant="success">{t("m.surveys.badge.submitted", undefined, "Submitted")}</Badge>
                    ) : (
                      <Badge variant="info">{t("m.surveys.badge.open", undefined, "Open")}</Badge>
                    )}
                    {s.anonymous && (
                      <Badge variant="muted">{t("m.surveys.badge.anonymous", undefined, "Anonymous")}</Badge>
                    )}
                  </div>
                  <h2 className="mt-2 text-sm font-semibold">{s.title}</h2>
                  {s.description && <p className="mt-1 text-xs text-[var(--p-text-2)]">{s.description}</p>}
                  {s.closes_at && (
                    <p className="mt-1 font-mono text-xs text-[var(--p-text-2)]">
                      {t("m.surveys.closesAt", { date: fmt.date(s.closes_at) }, `closes ${fmt.date(s.closes_at)}`)}
                    </p>
                  )}
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
