"use client";

import { useActionState, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { BookState } from "./actions";

/**
 * Slot confirmation form. Timezone auto-detects from the browser
 * (Calendly parity) and rides a hidden field; the slot itself was chosen
 * on the server-rendered grid.
 */
export function BookingForm({
  slotIso,
  slotLabel,
  recipientToken,
  rescheduleToken,
  action,
}: {
  slotIso: string;
  slotLabel: string;
  recipientToken?: string;
  rescheduleToken?: string;
  action: (prev: BookState, fd: FormData) => Promise<BookState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [timezone, setTimezone] = useState("");
  const t = useT();

  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
    } catch {
      // keep the event type's timezone as the server-side fallback
    }
  }, []);

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <p className="text-sm font-semibold">{slotLabel}</p>
      <input type="hidden" name="slot" value={slotIso} />
      <input type="hidden" name="invitee_timezone" value={timezone} />
      {recipientToken && <input type="hidden" name="recipient_token" value={recipientToken} />}
      {rescheduleToken && <input type="hidden" name="reschedule_token" value={rescheduleToken} />}
      <Input name="invitee_name" label={t("book.name", undefined, "Your Name")} required />
      <Input name="invitee_email" type="email" label={t("book.email", undefined, "Email")} required />
      <Input name="notes" label={t("book.notes", undefined, "Anything the team should know?")} />
      <Button type="submit" disabled={pending}>
        {pending ? t("book.confirming", undefined, "Confirming…") : t("book.confirm", undefined, "Confirm Booking")}
      </Button>
    </form>
  );
}
