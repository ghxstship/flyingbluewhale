export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/components/detail/DetailShell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteEvent } from "./edit/actions";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("events")
    .select("id, name, description, status, starts_at, ends_at, location_id, project_id")
    .eq("org_id", session.orgId)
    .eq("id", eventId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow={t("console.events.detail.eyebrow", undefined, "Operations")}
      title={(r) => r.name}
      subtitle={(r) => r.description}
      breadcrumbs={[
        { label: t("console.events.detail.breadcrumbs.operations", undefined, "Operations") },
        { label: t("console.events.detail.breadcrumbs.events", undefined, "Events"), href: "/console/events" },
        { label: row?.name ?? t("console.events.detail.breadcrumbs.fallback", undefined, "Event") },
      ]}
      fields={
        row
          ? [
              {
                label: t("console.events.detail.fields.status", undefined, "Status"),
                value: <StatusBadge status={row.status ?? "draft"} />,
              },
              {
                label: t("console.events.detail.fields.starts", undefined, "Starts"),
                value: fmtDateTime(row.starts_at),
              },
              { label: t("console.events.detail.fields.ends", undefined, "Ends"), value: fmtDateTime(row.ends_at) },
              {
                label: t("console.events.detail.fields.description", undefined, "Description"),
                value: row.description ?? "—",
              },
            ]
          : undefined
      }
      action={
        row ? (
          <div className="flex items-center gap-2">
            <Button href={`/console/events/${eventId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteEvent.bind(null, eventId)}
              confirm={t(
                "console.events.detail.deleteConfirm",
                { name: row.name },
                `Delete event "${row.name}"? This cannot be undone.`,
              )}
            />
          </div>
        ) : undefined
      }
    />
  );
}
