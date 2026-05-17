"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { revalidatePath } from "next/cache";

export async function applyToOpenShift(formData: FormData) {
  if (!hasSupabase) return;
  const openShiftId = formData.get("openShiftId") as string;
  if (!openShiftId) return;

  const session = await requireSession();
  const supabase = await createClient();

  await supabase.from("open_shift_applications").upsert(
    {
      open_shift_id: openShiftId,
      user_id: session.userId,
      org_id: session.orgId,
      application_state: "pending",
    },
    { onConflict: "open_shift_id,user_id", ignoreDuplicates: true },
  );

  revalidatePath("/m/open-shifts");
}
