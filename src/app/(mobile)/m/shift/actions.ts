"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ShiftConfirmState = { error?: string } | null;

export async function confirmShiftAction(
  _prev: ShiftConfirmState,
  formData: FormData,
): Promise<ShiftConfirmState> {
  await requireSession();
  const supabase = await createClient();
  const shiftId = formData.get("shift_id") as string;
  const state = formData.get("confirmation_state") as string;
  const note = (formData.get("note") as string | null) ?? null;

  if (!shiftId || !["confirmed", "declined"].includes(state)) {
    return { error: "Invalid request." };
  }

  const { error } = await supabase.rpc("confirm_shift", {
    p_shift_id: shiftId,
    p_state: state as "confirmed" | "declined",
    p_note: note || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/m/shift");
  return null;
}
