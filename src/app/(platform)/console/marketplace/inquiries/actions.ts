"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { InquiryState } from "@/lib/marketplace";

// Org-side triage transitions. `new` is insert-only and `withdrawn`
// belongs to the inquirer, so the console only ever moves forward.
const ORG_TRIAGE_STATES: InquiryState[] = ["responded", "closed"];

export async function setInquiryState(id: string, state: InquiryState): Promise<void> {
  if (!ORG_TRIAGE_STATES.includes(state)) return;
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("marketplace_inquiries")
    .update({ inquiry_state: state })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(error.message);
  revalidatePath("/console/marketplace/inquiries");
}
