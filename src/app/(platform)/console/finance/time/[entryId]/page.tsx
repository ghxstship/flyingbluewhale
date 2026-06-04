export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell } from "@/components/detail/DetailShell";
import { fmtDateTime } from "@/components/detail/DetailShell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { getRequestT } from "@/lib/i18n/request";
import { deleteTimeEntry } from "./edit/actions";

export default async function Page({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("time_entries")
    .select("id, description, started_at, ended_at, duration_minutes, billable, project_id, user_id")
    .eq("org_id", session.orgId)
    .eq("id", entryId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow={t("console.finance.time.entry.eyebrow", undefined, "Finance")}
      title={(r) => r.description ?? t("console.finance.time.entry.fallbackTitle", undefined, "Time entry")}
      subtitle={(r) => (r.duration_minutes ? `${Math.round((r.duration_minutes / 60) * 10) / 10} hr` : null)}
      breadcrumbs={[
        { label: t("console.finance.time.entry.breadcrumbs.finance", undefined, "Finance"), href: "/console/finance" },
        { label: t("console.finance.time.entry.breadcrumbs.time", undefined, "Time"), href: "/console/finance/time" },
        { label: row?.description ?? t("console.finance.time.entry.breadcrumbs.entry", undefined, "Entry") },
      ]}
      fields={
        row
          ? [
              {
                label: t("console.finance.time.entry.fields.started", undefined, "Started"),
                value: fmtDateTime(row.started_at),
              },
              {
                label: t("console.finance.time.entry.fields.ended", undefined, "Ended"),
                value: fmtDateTime(row.ended_at),
              },
              {
                label: t("console.finance.time.entry.fields.duration", undefined, "Duration"),
                value: row.duration_minutes != null ? `${Math.round((row.duration_minutes / 60) * 100) / 100} hr` : "—",
              },
              {
                label: t("console.finance.time.entry.fields.billable", undefined, "Billable"),
                value: row.billable ? t("common.yes", undefined, "Yes") : t("common.no", undefined, "No"),
              },
              {
                label: t("console.finance.time.entry.fields.description", undefined, "Description"),
                value: row.description ?? "—",
              },
            ]
          : undefined
      }
      action={
        row ? (
          <div className="flex items-center gap-2">
            <Button href={`/console/finance/time/${entryId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteTimeEntry.bind(null, entryId)}
              confirm={t(
                "console.finance.time.entry.deleteConfirm",
                undefined,
                "Delete this time entry? This cannot be undone.",
              )}
            />
          </div>
        ) : undefined
      }
    />
  );
}
