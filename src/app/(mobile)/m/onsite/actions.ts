"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listFollowedPresence } from "@/lib/gvteway";

/**
 * Onsite gamification + order-to-seat actions (design_handoff §3). Points are
 * awarded ONLY through the `award_onsite_points` SECURITY DEFINER RPC (fixed
 * value per reason — a client can't mint points). Each action revalidates
 * `/m/onsite` so the tier/achievements/passes refresh.
 */
export async function checkInAction(): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.rpc("award_onsite_points", { p_reason: "check_in" });

  // Squad-up: award once if a followed friend is already in a venue zone.
  const zones = await listFollowedPresence(supabase, session.userId);
  if (zones.some((z) => z.friends.length > 0)) {
    await supabase.rpc("award_onsite_points", { p_reason: "friend_found" });
  }
  await supabase
    .from("activity")
    .insert({ actor_id: session.userId, verb: "attended", object_kind: "event", object_ref: "Onsite check-in" });
  revalidatePath("/m/onsite");
}

export async function catchSetAction(formData: FormData): Promise<void> {
  const performer = String(formData.get("performer") ?? "").trim();
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.rpc("award_onsite_points", { p_reason: "set_caught" });
  if (performer) {
    await supabase
      .from("activity")
      .insert({ actor_id: session.userId, verb: "attended", object_kind: "set", object_ref: performer });
  }
  revalidatePath("/m/onsite");
}

export async function placeOrderAction(formData: FormData): Promise<void> {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("venue_menu_item")
    .select("id, name, price_cents, project_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return;

  await supabase.from("onsite_order").insert({
    user_id: session.userId,
    project_id: item.project_id,
    items: [{ menu_item_id: item.id, name: item.name, price_cents: item.price_cents, qty: 1 }],
    total_cents: item.price_cents,
    order_state: "placed",
  });
  await supabase.rpc("award_onsite_points", {
    p_reason: "order_placed",
    p_project_id: item.project_id ?? undefined,
  });
  revalidatePath("/m/onsite");
}
