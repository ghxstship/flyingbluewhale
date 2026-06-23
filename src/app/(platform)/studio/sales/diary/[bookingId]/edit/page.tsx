import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { getOrgScoped, listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { EditBookingForm } from "./EditBookingForm";
import type { Option } from "../../new/NewBookingForm";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type SpaceRow = Database["public"]["Tables"]["function_spaces"]["Row"];

export default async function EditBookingPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.diary.edit.title", undefined, "Edit Booking")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const booking = await getOrgScoped("function_bookings", session.orgId, bookingId);
  if (!booking) notFound();

  const [spacesRaw, projects, clients] = await Promise.all([
    listOrgScoped("function_spaces", session.orgId, { orderBy: "sort_order", ascending: true, limit: 0 }),
    listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true, limit: 0 }),
    listOrgScoped("clients", session.orgId, { orderBy: "name", ascending: true, limit: 0 }),
  ]);

  const spaces: Option[] = (spacesRaw as SpaceRow[]).map((s) => ({
    id: s.id,
    name: s.venue ? `${s.name} · ${s.venue}` : s.name,
  }));
  const projectOpts: Option[] = (projects as Array<{ id: string; name: string }>).map((p) => ({
    id: p.id,
    name: p.name,
  }));
  const clientOpts: Option[] = (clients as Array<{ id: string; name: string }>).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.diary.edit.eyebrow", undefined, "Booking")}
        title={t("console.diary.edit.title", undefined, "Edit Booking")}
      />
      <div className="page-content max-w-2xl">
        <EditBookingForm
          bookingId={bookingId}
          spaces={spaces}
          projects={projectOpts}
          clients={clientOpts}
          initial={{
            space_id: booking.space_id,
            project_id: booking.project_id,
            client_id: booking.client_id,
            title: booking.title,
            starts_at: booking.starts_at,
            ends_at: booking.ends_at,
            booking_state: booking.booking_state,
            headcount: booking.headcount,
            notes: booking.notes,
          }}
        />
      </div>
    </>
  );
}
