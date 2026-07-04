import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DeleteForm } from "@/components/DeleteForm";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toneFor } from "@/lib/tones";
import { RESERVATION_STATE_LABELS, type ReservationState } from "@/lib/reservations";
import { RecordActionButton } from "@/components/RecordActionButton";
import { confirmReservationCreateEventAction, deleteReservation } from "../actions";
import { TransitionControl } from "./TransitionControl";

export const dynamic = "force-dynamic";

type ReservationDetail = {
  id: string;
  guest_name: string;
  party_size: number;
  reserved_for: string;
  reservation_state: ReservationState;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
  table: { table_no: string; zone: string | null; seats: number } | null;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("reservations")
    .select(
      "id, guest_name, party_size, reserved_for, reservation_state, contact_phone, contact_email, notes, created_at, table:table_id(table_no, zone, seats)",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();

  const res = data as unknown as ReservationDetail | null;
  if (!res) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.reservations.detail.eyebrow", undefined, "Reservation")}
        title={res.guest_name}
        subtitle={fmt.dateParts(res.reserved_for, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
        breadcrumbs={[
          {
            label: t("console.reservations.title", undefined, "Reservations"),
            href: "/studio/operations/reservations",
          },
          { label: res.guest_name },
        ]}
        action={
          <div className="flex items-center gap-2">
            {isManagerPlus(session) && res.reservation_state === "booked" && (
              <RecordActionButton
                action={confirmReservationCreateEventAction.bind(null, res.id)}
                label={t("console.reservations.detail.createEvent", undefined, "Confirm → Create Event")}
                pendingLabel={t("console.reservations.detail.creatingEvent", undefined, "Creating…")}
              />
            )}
            <DeleteForm
              action={deleteReservation.bind(null, res.id)}
              confirm={t(
                "console.reservations.detail.deleteConfirm",
                { name: res.guest_name },
                `Delete reservation for "${res.guest_name}"?`,
              )}
            />
          </div>
        }
      />
      <div className="page-content space-y-8">
        <div className="metric-grid">
          <Field label={t("console.reservations.detail.field.state", undefined, "State")}>
            <Badge variant={toneFor(res.reservation_state)}>{RESERVATION_STATE_LABELS[res.reservation_state]}</Badge>
          </Field>
          <Field label={t("console.reservations.detail.field.party", undefined, "Party size")}>
            {fmt.number(res.party_size)}
          </Field>
          <Field label={t("console.reservations.detail.field.table", undefined, "Table")}>
            {res.table
              ? res.table.zone
                ? `${res.table.table_no} · ${res.table.zone}`
                : res.table.table_no
              : t("console.reservations.detail.unassigned", undefined, "Unassigned")}
          </Field>
          <Field label={t("console.reservations.detail.field.phone", undefined, "Phone")}>
            {res.contact_phone ?? "—"}
          </Field>
          <Field label={t("console.reservations.detail.field.email", undefined, "Email")}>
            {res.contact_email ?? "—"}
          </Field>
          <Field label={t("console.reservations.detail.field.created", undefined, "Created")}>
            {fmt.dateParts(res.created_at, { month: "short", day: "numeric", year: "numeric" })}
          </Field>
        </div>

        <div className="surface p-5">
          <h3 className="mb-3 text-sm font-semibold">
            {t("console.reservations.detail.lifecycle", undefined, "Lifecycle")}
          </h3>
          <TransitionControl reservationId={res.id} current={res.reservation_state} />
        </div>

        {res.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">{t("console.reservations.detail.notes", undefined, "Notes")}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{res.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
