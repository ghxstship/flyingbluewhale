import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { getRequestT } from "@/lib/i18n/request";
import { NewReservationForm, type TableOption } from "./NewReservationForm";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ tableId?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.reservations.new.eyebrow", undefined, "Venue Ops")}
          title={t("console.reservations.new.title", undefined, "New Reservation")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const { tableId } = await searchParams;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data } = await supabase
    .from("venue_tables")
    .select("id, table_no, seats, zone")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("table_no", { ascending: true })
    .limit(500);

  const tables = (data ?? []) as unknown as TableOption[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.reservations.new.eyebrow", undefined, "Venue Ops")}
        title={t("console.reservations.new.title", undefined, "New Reservation")}
        breadcrumbs={[
          { label: t("console.reservations.title", undefined, "Reservations"), href: "/console/operations/reservations" },
          { label: t("console.reservations.new.title", undefined, "New Reservation") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewReservationForm tables={tables} defaultTableId={tableId ?? ""} />
      </div>
    </>
  );
}
