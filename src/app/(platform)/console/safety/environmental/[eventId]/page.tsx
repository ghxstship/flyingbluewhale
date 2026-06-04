import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteEnvEvent } from "./edit/actions";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ eventId: string }> }) {
  const { t } = await getRequestT();
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.safety.environmental.detail.title", undefined, "Environmental Event")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.environmental.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("environmental_events", session.orgId, p.eventId);
  if (!row) notFound();
  const fields = row as Record<string, unknown>;
  const title = (fields["kind"] as string | undefined) ?? p.eventId;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.environmental.detail.eyebrow", undefined, "Safety · Environmental")}
        title={title}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/safety/environmental" variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
            <Button href={`/console/safety/environmental/${p.eventId}/edit`} size="sm">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteEnvEvent.bind(null, p.eventId)}
              confirm={t(
                "console.safety.environmental.detail.deleteConfirm",
                { title },
                `Delete environmental event "${title}"? This cannot be undone.`,
              )}
            />
          </div>
        }
      />
      <div className="page-content max-w-3xl">
        <dl className="surface grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {Object.entries(fields).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">{toTitle(k)}</dt>
              <dd className="font-mono text-xs break-all">
                {v === null || v === undefined
                  ? t("common.emDash", undefined, "—")
                  : typeof v === "object"
                    ? JSON.stringify(v)
                    : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
