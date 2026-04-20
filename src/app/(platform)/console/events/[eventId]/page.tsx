export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/components/detail/DetailShell";

export default async function Page({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await requireSession();
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
      eyebrow="Operations"
      title={(r) => r.name}
      subtitle={(r) => r.description}
      breadcrumbs={[{ label: "Operations" }, { label: "Events", href: "/console/events" }, { label: row?.name ?? "Event" }]}
      fields={row ? [
        { label: "Status", value: <StatusBadge status={row.status ?? "draft"} /> },
        { label: "Starts", value: fmtDateTime(row.starts_at) },
        { label: "Ends", value: fmtDateTime(row.ends_at) },
        { label: "Description", value: row.description ?? "—" },
      ] : undefined}
    />
  );
}
