"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export async function deleteContract(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  // SOFT delete — contracts carries a deleted_at tombstone (see
  // SOFT_DELETABLE_TABLES). RLS pins the write to the session org.
  const { error } = await supabase
    .from("contracts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not archive contract: ${error.message}`);
  revalidatePath("/studio/contracts");
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}
