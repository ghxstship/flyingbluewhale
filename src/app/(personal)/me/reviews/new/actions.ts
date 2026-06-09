"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { REVIEW_SUBJECTS, REVIEW_TRANSACTIONS } from "@/lib/marketplace";
import type { FormState } from "@/components/FormShell";

const Schema = z.object({
  transaction_type: z.enum(REVIEW_TRANSACTIONS),
  transaction_id: z.string().uuid(),
  subject_kind: z.enum(REVIEW_SUBJECTS),
  subject_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  body: z.string().max(4000).optional().or(z.literal("")),
});

/**
 * Resolve the org that owns the transaction being reviewed. Doubles as the
 * access check: every transaction table's select RLS only admits parties to
 * the transaction (applicant/submitter/org member), so a reviewer who can't
 * read the row can't anchor a review to it.
 */
async function resolveTransactionOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  type: (typeof REVIEW_TRANSACTIONS)[number],
  id: string,
): Promise<string | null> {
  switch (type) {
    case "rfq": {
      const { data } = await supabase.from("rfqs").select("org_id").eq("id", id).maybeSingle();
      return data?.org_id ?? null;
    }
    case "purchase_order": {
      const { data } = await supabase.from("purchase_orders").select("org_id").eq("id", id).maybeSingle();
      return data?.org_id ?? null;
    }
    case "job_application": {
      const { data } = await supabase.from("job_applications").select("org_id").eq("id", id).maybeSingle();
      return data?.org_id ?? null;
    }
    case "talent_offer": {
      const { data } = await supabase.from("talent_offers").select("org_id").eq("id", id).maybeSingle();
      return data?.org_id ?? null;
    }
    case "open_call_submission": {
      const { data } = await supabase.from("open_call_submissions").select("org_id").eq("id", id).maybeSingle();
      return data?.org_id ?? null;
    }
    case "project": {
      const { data } = await supabase.from("projects").select("org_id").eq("id", id).maybeSingle();
      return data?.org_id ?? null;
    }
  }
}

export async function createReview(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const { transaction_type, transaction_id, subject_kind, subject_id, rating, body } = parsed.data;

  const supabase = await createClient();

  const orgId = await resolveTransactionOrg(supabase, transaction_type, transaction_id);
  if (!orgId) {
    return actionFail("We couldn't find that transaction, or you're not a party to it.", fd);
  }

  // Duplicate guard — one review per reviewer per transaction.
  const { data: existing, error: existingError } = await supabase
    .from("reviews")
    .select("id")
    .eq("transaction_type", transaction_type)
    .eq("transaction_id", transaction_id)
    .eq("reviewer_user_id", session.userId)
    .maybeSingle();
  if (existingError) return actionFail(existingError.message, fd);
  if (existing) return actionFail("You've already reviewed this transaction.", fd);

  const { error } = await supabase.from("reviews").insert({
    org_id: orgId,
    transaction_type,
    transaction_id,
    subject_kind,
    subject_vendor_id: subject_kind === "vendor" ? subject_id : null,
    subject_talent_profile_id: subject_kind === "talent" ? subject_id : null,
    subject_crew_member_id: subject_kind === "crew" ? subject_id : null,
    subject_org_id: subject_kind === "org" ? subject_id : null,
    subject_user_id: subject_kind === "user" ? subject_id : null,
    reviewer_user_id: session.userId,
    reviewer_org_id: session.orgId || null,
    rating,
    body: body || null,
  });
  if (error) {
    if (error.code === "23505") return actionFail("You've already reviewed this transaction.", fd);
    return actionFail(error.message, fd);
  }

  redirect("/me/reviews?reviewed=1");
}
