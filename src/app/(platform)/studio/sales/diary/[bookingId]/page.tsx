import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import {
  BOOKING_STATE_LABELS,
  NEXT_BOOKING_STATES,
  timeLabel,
  type BookingState,
} from "@/lib/function_diary";
import type { Database } from "@/lib/supabase/types";
import { deleteBooking, transitionBookingAction } from "../actions";

export const dynamic = "force-dynamic";

type SpaceRow = Database["public"]["Tables"]["function_spaces"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

export default async function BookingDetail({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const booking = await getOrgScoped("function_bookings", session.orgId, bookingId);
  if (!booking) notFound();
  const { t } = await getRequestT();

  const [space, project, client] = await Promise.all([
    getOrgScoped("function_spaces", session.orgId, booking.space_id),
    booking.project_id
      ? getOrgScoped("projects", session.orgId, booking.project_id)
      : Promise.resolve(null),
    booking.client_id
      ? getOrgScoped("clients", session.orgId, booking.client_id)
      : Promise.resolve(null),
  ]);

  const state = booking.booking_state as BookingState;
  const nextStates = NEXT_BOOKING_STATES[state];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.diary.detail.eyebrow", undefined, "Booking")}
        title={booking.title}
        subtitle={(space as SpaceRow | null)?.name ?? t("console.diary.detail.noSpace", undefined, "Space")}
        breadcrumbs={[
          { label: t("console.diary.detail.breadcrumb.sales", undefined, "Sales"), href: "/studio/sales/diary" },
          { label: t("console.diary.detail.breadcrumb.diary", undefined, "Function Diary"), href: "/studio/sales/diary" },
          { label: booking.title },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href={`/studio/sales/diary/${bookingId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteBooking.bind(null, bookingId)}
              confirm={t(
                "console.diary.detail.deleteConfirm",
                { title: booking.title },
                `Delete booking "${booking.title}"?`,
              )}
              undo={{ table: "function_bookings", id: bookingId, redirectTo: "/studio/sales/diary" }}
            />
          </div>
        }
      />
      <div className="page-content space-y-8">
        <div className="flex items-center gap-3">
          <StatusBadge status={booking.booking_state} />
          {nextStates.length > 0 && (
            <form action={transitionBookingAction.bind(null, bookingId)} className="flex items-center gap-2">
              <select name="booking_state" defaultValue={nextStates[0]} className="ps-input">
                {nextStates.map((s) => (
                  <option key={s} value={s}>
                    {BOOKING_STATE_LABELS[s]}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm">
                {t("console.diary.detail.transition", undefined, "Move")}
              </Button>
            </form>
          )}
        </div>

        <div className="metric-grid">
          <Field label={t("console.diary.detail.field.space", undefined, "Space")}>
            {(space as SpaceRow | null)?.name ?? "—"}
          </Field>
          <Field label={t("console.diary.detail.field.window", undefined, "Window")}>
            {timeLabel(booking.starts_at)}–{timeLabel(booking.ends_at)}
          </Field>
          <Field label={t("console.diary.detail.field.starts", undefined, "Starts")}>
            {new Date(booking.starts_at).toLocaleString()}
          </Field>
          <Field label={t("console.diary.detail.field.ends", undefined, "Ends")}>
            {new Date(booking.ends_at).toLocaleString()}
          </Field>
          <Field label={t("console.diary.detail.field.headcount", undefined, "Headcount")}>
            {booking.headcount ?? "—"}
          </Field>
          <Field label={t("console.diary.detail.field.project", undefined, "Project")}>
            {(project as ProjectRow | null)?.name ?? "—"}
          </Field>
          <Field label={t("console.diary.detail.field.client", undefined, "Client")}>
            {(client as ClientRow | null)?.name ?? "—"}
          </Field>
          <Field label={t("console.diary.detail.field.created", undefined, "Created")}>
            {timeAgo(booking.created_at)}
          </Field>
        </div>

        {booking.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">{t("console.diary.detail.notes", undefined, "Notes")}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{booking.notes}</p>
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
