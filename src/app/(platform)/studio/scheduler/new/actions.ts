"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  duration_minutes: z.coerce.number().int().min(5).max(480),
  buffer_before_minutes: z.coerce.number().int().min(0).max(120).default(0),
  buffer_after_minutes: z.coerce.number().int().min(0).max(120).default(0),
  min_notice_minutes: z.coerce.number().int().min(0).max(20160).default(240),
  // Optional numeric: an untouched input posts "" — coerce would turn that
  // into 0 and trip min(1). Empty means "no cap".
  max_per_day: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(1).max(48).optional(),
  ),
  location_kind: z.enum(["call", "on_site"]).default("call"),
  timezone: z.string().min(1).max(64).default("UTC"),
  redirect_url: z.string().url().max(500).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createEventTypeAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-event-types", "Only manager+ can create event types") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  // Validate the IANA timezone before it poisons slot math.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: parsed.data.timezone });
  } catch {
    return { error: actionErrorMessage("unknown-timezone-use-an-iana-name-like-america-new", "Unknown timezone. Use an IANA name like America/New_York") };
  }

  const supabase = await createClient();
  // soft-delete-exempt: insert returning id, not a read
  const { data, error } = await supabase
    .from("scheduler_event_types")
    .insert({
      org_id: session.orgId,
      owner_id: session.userId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      duration_minutes: parsed.data.duration_minutes,
      buffer_before_minutes: parsed.data.buffer_before_minutes,
      buffer_after_minutes: parsed.data.buffer_after_minutes,
      min_notice_minutes: parsed.data.min_notice_minutes,
      max_per_day: parsed.data.max_per_day ?? null,
      location_kind: parsed.data.location_kind,
      timezone: parsed.data.timezone,
      redirect_url: parsed.data.redirect_url || null,
    } as never)
    .select("id")
    .single();
  if (error || !data) return actionFail(error?.message ?? "Insert failed", fd);

  // Default weekday availability (Mon–Fri 09:00–17:00 in the event tz) so a
  // fresh event type is immediately bookable; adjust on the detail page.
  await supabase.from("scheduler_availability").insert(
    [1, 2, 3, 4, 5].map((weekday) => ({
      org_id: session.orgId,
      event_type_id: data.id,
      weekday,
      start_minute: 540,
      end_minute: 1020,
    })) as never,
  );

  revalidatePath("/studio/scheduler");
  redirect(`/studio/scheduler/${data.id}`);
}
