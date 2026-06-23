import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteMetric } from "./edit/actions";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ metricId: string }> }) {
  const { t } = await getRequestT();
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.sustainability.carbon.detail.title", undefined, "Carbon Metric")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.sustainability.carbon.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("sustainability_metrics", session.orgId, p.metricId);
  if (!row) notFound();
  const fields = row as Record<string, unknown>;
  const title = (fields["period"] as string | undefined) ?? p.metricId;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.sustainability.carbon.detail.eyebrow", undefined, "Sustainability · Metric")}
        title={title}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/sustainability/carbon" variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
            <Button href={`/studio/sustainability/carbon/${p.metricId}/edit`} size="sm">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteMetric.bind(null, p.metricId)}
              confirm={t(
                "console.sustainability.carbon.detail.deleteConfirm",
                { title },
                `Delete measurement "${title}"? This cannot be undone.`,
              )}
            />
          </div>
        }
      />
      <div className="page-content max-w-3xl">
        <dl className="surface grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {Object.entries(fields).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs tracking-wide text-[var(--p-text-2)] uppercase">{toTitle(k)}</dt>
              <dd className="font-mono text-xs break-all">
                {v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
