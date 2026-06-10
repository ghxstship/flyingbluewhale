"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import type { FormState } from "@/components/FormShell";
import { INQUIRY_SUBJECT_KINDS, type InquirySubjectKind } from "@/lib/marketplace";

const Schema = z.object({
  message: z.string().min(10, "Tell them what you need — at least 10 characters").max(4000),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Event date must be a valid date")
    .optional()
    .or(z.literal("")),
  contact_email: z.string().email("Contact email must be a valid address").max(200).optional().or(z.literal("")),
  contact_phone: z.string().max(40).optional().or(z.literal("")),
});

/**
 * Shared submit path for all five marketplace inquire surfaces
 * (vendor / crew / agency / talent / rfq). The subject is resolved
 * server-side by the submit_marketplace_inquiry RPC — the public
 * directory views omit org_id by design, so the RPC is the only
 * caller-safe way to attach the inquiry to the right org while
 * re-validating that the handle is actually public.
 */
export async function submitMarketplaceInquiry(
  kind: InquirySubjectKind,
  handle: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!INQUIRY_SUBJECT_KINDS.includes(kind)) return actionFail("Unknown inquiry subject.", fd);
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  // Default the reply address to the account email so the operator always
  // has a way to respond, even when the optional contact fields are blank.
  const contactEmail = parsed.data.contact_email || session.email;
  const { error } = await supabase.rpc("submit_marketplace_inquiry", {
    p_subject_kind: kind,
    p_handle: handle,
    p_message: parsed.data.message,
    ...(parsed.data.event_date ? { p_event_date: parsed.data.event_date } : {}),
    ...(contactEmail ? { p_contact_email: contactEmail } : {}),
    ...(parsed.data.contact_phone ? { p_contact_phone: parsed.data.contact_phone } : {}),
  });
  if (error) {
    if (error.code === "23505") {
      return actionFail("You already have an open inquiry here. Track it under My Inquiries.", fd);
    }
    if (error.code === "P0002") {
      return actionFail("This listing is no longer accepting inquiries.", fd);
    }
    return actionFail(error.message, fd);
  }

  redirect("/me/inquiries?sent=1");
}
