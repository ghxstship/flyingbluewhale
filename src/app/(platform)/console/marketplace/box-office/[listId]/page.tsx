import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MetricCard } from "@/components/ui/MetricCard";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { getRequestT } from "@/lib/i18n/request";
import { rollupAttendance, type GuestEntryState } from "@/lib/box_office";
import { addGuestEntryAction } from "../actions";
import { DoorScanner } from "./DoorScanner";
import { GuestRoster } from "./GuestRoster";

export const dynamic = "force-dynamic";

type GuestList = {
  id: string;
  name: string;
  notes: string | null;
  event_id: string | null;
};

type Entry = {
  id: string;
  guest_name: string;
  plus_ones: number | null;
  entry_state: GuestEntryState;
  scan_code: string | null;
  checked_in_at: string | null;
};

export default async function GuestListDetailPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data: listData } = await supabase
    .from("guest_lists" as never)
    .select("id, name, notes, event_id")
    .eq("id", listId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!listData) return notFound();
  const list = listData as GuestList;

  const { data: entryData } = await supabase
    .from("guest_list_entries" as never)
    .select("id, guest_name, plus_ones, entry_state, scan_code, checked_in_at")
    .eq("org_id", session.orgId)
    .eq("guest_list_id", listId)
    .is("deleted_at", null)
    .order("guest_name", { ascending: true });
  const entries = (entryData ?? []) as Entry[];

  const rollup = rollupAttendance(entries);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.boxOffice.detail.eyebrow", undefined, "Box Office")}
        title={list.name}
        subtitle={list.notes ?? undefined}
        action={
          <Button href="/console/marketplace/box-office" size="sm" variant="ghost">
            {t("console.boxOffice.detail.allLists", undefined, "All Lists")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.boxOffice.detail.metrics.entries", undefined, "Entries")}
            value={String(rollup.totalEntries)}
            accent
          />
          <MetricCard
            label={t("console.boxOffice.detail.metrics.expected", undefined, "Expected Heads")}
            value={String(rollup.expectedHeads)}
          />
          <MetricCard
            label={t("console.boxOffice.detail.metrics.arrived", undefined, "Arrived Heads")}
            value={String(rollup.arrivedHeads)}
          />
          <MetricCard
            label={t("console.boxOffice.detail.metrics.checkedIn", undefined, "Checked-In")}
            value={`${rollup.arrivedEntries} / ${rollup.totalEntries}`}
          />
        </div>

        <DoorScanner listId={list.id} />

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {t("console.boxOffice.detail.addGuest", undefined, "Add Guest")}
          </h2>
          <FormShell
            action={addGuestEntryAction}
            submitLabel={t("console.boxOffice.detail.addSubmit", undefined, "Add to List")}
            dirtyGuard={false}
            className="space-y-3"
          >
            <input type="hidden" name="guest_list_id" value={list.id} />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input
                label={t("console.boxOffice.detail.fields.guestName", undefined, "Guest Name")}
                name="guest_name"
                required
                maxLength={200}
              />
              <Input
                label={t("console.boxOffice.detail.fields.plusOnes", undefined, "Plus-Ones")}
                name="plus_ones"
                type="number"
                min={0}
                max={99}
                defaultValue="0"
              />
              <Input
                label={t("console.boxOffice.detail.fields.notes", undefined, "Notes")}
                name="notes"
                maxLength={1000}
              />
            </div>
          </FormShell>
        </section>

        <GuestRoster listId={list.id} entries={entries} />
      </div>
    </>
  );
}
