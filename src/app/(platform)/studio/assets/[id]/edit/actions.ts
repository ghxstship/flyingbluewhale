"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  display_name: z.string().min(1).max(200),
  asset_kind: z.string().min(1).max(64),
  asset_class: z.enum(["gear", "fleet", "lot"]),
  qty: z.coerce.number().int().min(1).max(1_000_000),
  disposition: z.enum(["ship_to_site", "return_to_vendor", "hold"]).optional().or(z.literal("")),
  location_id: z.string().uuid().optional().or(z.literal("")),
  asset_tag: z.string().max(120).optional().or(z.literal("")),
  serial: z.string().max(120).optional().or(z.literal("")),
  daily_rate_usd: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateAsset(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const dailyRate = parsed.data.daily_rate_usd ? Math.round(Number(parsed.data.daily_rate_usd) * 100) : null;
  if (parsed.data.daily_rate_usd && !Number.isFinite(dailyRate)) return { error: "Bad daily rate" };
  // Optimistic concurrency (Sea Trial FINDING-022 pattern).
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("assets", session.orgId, id, expectedUpdatedAt, {
    display_name: parsed.data.display_name,
    asset_kind: parsed.data.asset_kind,
    asset_class: parsed.data.asset_class,
    qty: parsed.data.qty,
    disposition: parsed.data.disposition || null,
    location_id: parsed.data.location_id || null,
    asset_tag: parsed.data.asset_tag || null,
    serial: parsed.data.serial || null,
    daily_rate_minor: dailyRate,
    daily_rate_currency: dailyRate != null ? "USD" : null,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Asset not found." };
  }
  revalidatePath(`/studio/assets/${id}`);
  revalidatePath("/studio/assets");
  redirect(`/studio/assets/${id}`);
}
