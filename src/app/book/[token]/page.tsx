export const dynamic = "force-dynamic";

import Link from "next/link";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { computeSlots } from "@/lib/scheduler/slots";
import { formatDateParts } from "@/lib/i18n/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { createBookingAction, cancelBookingAction } from "./actions";
import { BookingForm } from "./BookingForm";

/**
 * Public booking page (kit 27, Phase 4) — /book/[token], no auth, like
 * /offer/[token]. Renders the next two weeks of open slots in the event
 * type's timezone; picking a slot reveals the confirm form. `?cancel=` and
 * `?reschedule=` service the links carried in every booking email.
 */

type SearchParams = {
  slot?: string;
  r?: string;
  reschedule?: string;
  cancel?: string;
  booked?: string;
  cancelled?: string;
};

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const { t } = await getRequestT();

  if (!isServiceClientAvailable()) {
    return <p className="ps-body">{t("book.unavailable", undefined, "Booking is unavailable right now.")}</p>;
  }
  const svc = createServiceClient() as unknown as LooseSupabase;
  const { data: eventType } = (await svc
    .from("scheduler_event_types")
    .select(
      "id, org_id, name, description, duration_minutes, buffer_before_minutes, buffer_after_minutes, min_notice_minutes, max_per_day, location_kind, timezone, is_active, public_token, orgs(name)",
    )
    .eq("public_token", token)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle()) as {
    data:
      | {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          buffer_before_minutes: number;
          buffer_after_minutes: number;
          min_notice_minutes: number;
          max_per_day: number | null;
          location_kind: string;
          timezone: string;
          orgs: { name: string } | null;
        }
      | null;
  };

  if (!eventType) {
    return (
      <div className="space-y-2">
        <h1>{t("book.goneTitle", undefined, "This Booking Link Is Not Active")}</h1>
        <p className="ps-body text-[var(--p-text-2)]">
          {t("book.goneBody", undefined, "The event type was paused or removed. Reach back out to the team that sent it.")}
        </p>
      </div>
    );
  }

  if (sp.booked) {
    return (
      <div className="space-y-2">
        <p className="eyebrow">{eventType.orgs?.name ?? "ATLVS"}</p>
        <h1>{t("book.confirmedTitle", undefined, "You're Booked")}</h1>
        <p className="ps-body text-[var(--p-text-2)]">
          {t(
            "book.confirmedBody",
            undefined,
            "A confirmation with a calendar invite is on its way to your inbox. Reschedule and cancel links are in that email.",
          )}
        </p>
      </div>
    );
  }

  if (sp.cancelled) {
    return (
      <div className="space-y-2">
        <p className="eyebrow">{eventType.orgs?.name ?? "ATLVS"}</p>
        <h1>{t("book.cancelledTitle", undefined, "Booking Cancelled")}</h1>
        <p className="ps-body text-[var(--p-text-2)]">
          {t("book.cancelledBody", undefined, "All set. Book a new time below whenever you're ready.")}
          {" "}
          <Link href={`/book/${token}`} className="underline">
            {t("book.rebook", undefined, "Pick a new time")}
          </Link>
        </p>
      </div>
    );
  }

  if (sp.cancel) {
    return (
      <div className="space-y-4">
        <p className="eyebrow">{eventType.orgs?.name ?? "ATLVS"}</p>
        <h1>{t("book.cancelTitle", undefined, "Cancel This Booking?")}</h1>
        <p className="ps-body text-[var(--p-text-2)]">
          {t("book.cancelBody", undefined, "The team will be notified and the slot reopens for others.")}
        </p>
        <form action={cancelBookingAction.bind(null, token, sp.cancel)}>
          <button type="submit" className="ps-btn ps-btn--cta">
            {t("book.cancelConfirm", undefined, "Cancel Booking")}
          </button>
        </form>
      </div>
    );
  }

  const [{ data: windows }, { data: bookings }] = (await Promise.all([
    svc
      .from("scheduler_availability")
      .select("weekday, override_date, start_minute, end_minute, is_open")
      .eq("event_type_id", eventType.id)
      .is("deleted_at", null)
      .limit(200),
    svc
      .from("scheduler_bookings")
      .select("starts_at, ends_at, booking_state")
      .eq("event_type_id", eventType.id)
      .gte("starts_at", new Date(Date.now() - 86400000).toISOString())
      .is("deleted_at", null)
      .limit(1000),
  ])) as [
    { data: Array<{ weekday: number | null; override_date: string | null; start_minute: number; end_minute: number; is_open: boolean }> | null },
    { data: Array<{ starts_at: string; ends_at: string; booking_state: string }> | null },
  ];

  const slots = computeSlots({
    eventType,
    windows: windows ?? [],
    bookings: bookings ?? [],
    from: new Date(),
    days: 14,
  });

  const dayLabel = (d: Date) =>
    formatDateParts(d, { weekday: "short", month: "short", day: "numeric" }, { timezone: eventType.timezone });
  const timeLabel = (d: Date) =>
    formatDateParts(d, { hour: "2-digit", minute: "2-digit" }, { timezone: eventType.timezone });
  const byDay = new Map<string, Date[]>();
  for (const slot of slots) {
    const key = dayLabel(slot);
    const bucket = byDay.get(key) ?? [];
    bucket.push(slot);
    byDay.set(key, bucket);
  }

  const selected = sp.slot ? new Date(sp.slot) : null;
  const selectedValid = selected && !Number.isNaN(selected.getTime()) && slots.some((s) => s.getTime() === selected.getTime());
  const carry = new URLSearchParams();
  if (sp.r) carry.set("r", sp.r);
  if (sp.reschedule) carry.set("reschedule", sp.reschedule);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="eyebrow">{eventType.orgs?.name ?? "ATLVS"}</p>
        <h1>{eventType.name}</h1>
        <p className="ps-body text-[var(--p-text-2)]">
          {eventType.description ??
            t("book.defaultDescription", undefined, "Pick a time that works. Times are shown in the host timezone.")}
        </p>
        <p className="font-mono text-xs text-[var(--p-text-3)]">
          {eventType.duration_minutes} min · {eventType.timezone}
          {sp.reschedule ? ` · ${t("book.rescheduling", undefined, "rescheduling")}` : ""}
        </p>
      </header>

      {selectedValid && selected ? (
        <BookingForm
          slotIso={selected.toISOString()}
          slotLabel={`${dayLabel(selected)} · ${timeLabel(selected)} (${eventType.timezone})`}
          recipientToken={sp.r}
          rescheduleToken={sp.reschedule}
          action={createBookingAction.bind(null, token)}
        />
      ) : slots.length === 0 ? (
        <p className="ps-body text-[var(--p-text-2)]">
          {t("book.noSlots", undefined, "No open times in the next two weeks. Check back, or reply to the team.")}
        </p>
      ) : (
        <div className="space-y-4">
          {Array.from(byDay.entries()).map(([day, daySlots]) => (
            <section key={day} className="space-y-2">
              <h2>{day}</h2>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((slot) => {
                  const qs = new URLSearchParams(carry);
                  qs.set("slot", slot.toISOString());
                  return (
                    <Link key={slot.toISOString()} href={`/book/${token}?${qs.toString()}`} className="ps-btn ps-btn--sm">
                      {timeLabel(slot)}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
