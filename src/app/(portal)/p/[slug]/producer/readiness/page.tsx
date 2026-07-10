import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { XPMS_PHASES } from "@/lib/xpms";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

/**
 * Producer readiness — portfolio-level go/no-go snapshot: how many projects
 * sit in each XPMS lifecycle gate. The detailed per-project readiness review
 * lives on the console (/studio/programs/readiness); this is the producer's
 * portfolio roll-up.
 */

type Project = { id: string; xpms_phase: string | null };

export default async function ProducerReadiness({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("p.producer.readiness.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select("id, xpms_phase")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .limit(500);
  const rows = (data ?? []) as Project[];

  const counts = new Map<string, number>();
  for (const p of rows) {
    const k = p.xpms_phase ?? "unphased";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "producer")} />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">{t("p.producer.readiness.title", undefined, "Readiness")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t("p.producer.readiness.subtitle", undefined, "Portfolio go/no-go by lifecycle gate.")}
        </p>

        {rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={t("p.producer.readiness.empty.title", undefined, "No Projects")}
              description={t(
                "p.producer.readiness.empty.description",
                undefined,
                "Readiness rolls up across the projects you have producer visibility on.",
              )}
            />
          </div>
        ) : (
          <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...XPMS_PHASES.map((p) => p.id), "unphased"]
              .filter((phase) => counts.has(phase))
              .map((phase) => (
                <div key={phase} className="surface p-4">
                  <div className="text-[11px] tracking-wider text-[var(--p-text-2)] uppercase">{toTitle(phase)}</div>
                  <div className="mt-1 font-mono text-2xl font-semibold">{counts.get(phase)}</div>
                </div>
              ))}
          </section>
        )}

        <p className="mt-5 text-xs text-[var(--p-text-2)]">
          {t("p.producer.readiness.detailOn", undefined, "Per-project readiness review on")}{" "}
          <a className="underline" href={urlFor("platform", "/programs/readiness")}>
            /studio/programs/readiness
          </a>
          .
        </p>
      </div>
    </div>
  );
}
