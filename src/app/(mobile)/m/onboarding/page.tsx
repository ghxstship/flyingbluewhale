import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Assignment = {
  id: string;
  flow_id: string;
  assignment_phase: string;
  assigned_at: string;
  completed_at: string | null;
};

type Flow = { id: string; name: string; description: string | null };

export default async function MobileOnboardingPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: assignments } = await supabase
    .from("new_hire_assignments")
    .select("id, flow_id, assignment_phase, assigned_at, completed_at")
    .eq("assignee_id", session.userId)
    .order("assigned_at", { ascending: false });

  const rows = (assignments ?? []) as Assignment[];
  const flowIds = rows.map((r) => r.flow_id);
  const { data: flows } = flowIds.length
    ? await supabase.from("new_hire_flows").select("id, name, description").in("id", flowIds)
    : { data: [] as Flow[] };
  const flowMap = new Map(((flows ?? []) as Flow[]).map((f) => [f.id, f]));

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">
        {t("m.onboarding.eyebrow", undefined, "Mobile")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.onboarding.title", undefined, "Onboarding")}</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {t(
          "m.onboarding.subtitle",
          undefined,
          "Read, sign, upload, complete. Your supervisor sees when each step finishes.",
        )}
      </p>

      <ul className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.onboarding.empty.title", undefined, "No Active Flows")}
              description={t(
                "m.onboarding.empty.description",
                undefined,
                "New-hire journeys assigned to you appear here.",
              )}
            />
          </li>
        ) : (
          rows.map((a) => {
            const flow = flowMap.get(a.flow_id);
            const tone =
              a.assignment_phase === "completed"
                ? "success"
                : a.assignment_phase === "abandoned"
                  ? "muted"
                  : a.assignment_phase === "in_progress"
                    ? "info"
                    : "warning";
            return (
              <li key={a.id}>
                <Link href={`/m/onboarding/${a.id}`} className="surface block p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={tone}>{a.assignment_phase}</Badge>
                    <span className="font-mono text-xs text-[var(--text-muted)]">{fmt.date(a.assigned_at)}</span>
                  </div>
                  <h2 className="mt-2 text-sm font-semibold">
                    {flow?.name ?? t("m.onboarding.fallbackFlowName", undefined, "Onboarding")}
                  </h2>
                  {flow?.description && <p className="mt-1 text-xs text-[var(--text-secondary)]">{flow.description}</p>}
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
