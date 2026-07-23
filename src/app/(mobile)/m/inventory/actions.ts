"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ASSET_CHECK_IN, ASSET_CHECK_OUT, transitionAssetState } from "@/lib/db/asset-transition";

export type State = { error?: string; ok?: boolean } | null;

const Input = z.object({
  assetId: z.string().uuid(),
  direction: z.enum(["out", "in"]),
});

/**
 * Take or return custody of an asset, from the field.
 *
 * Routes through the shared `transitionAssetState`, so the field moves an
 * asset through the identical FSM, TOCTOU guard, custodian-stamped
 * `asset_movements` ledger append, and audit emit the console uses. The
 * custody band (manager+ or an ADR-0015 `asset:custody` grant) is enforced
 * in the shared transition AND mirrored at the DB by migration
 * `20260723120000_asset_movements_field_write` (F1,
 * MOBILE_BEST_PRACTICES_2026-07): the state flip and the ledger row are
 * both RLS-sanctioned for the field band, both read back after the write.
 *
 * Queue compatibility: the signature stays `(prev, FormData) → State` — a
 * serializable form payload in, a serializable result out — so the outbox
 * can replay it unchanged.
 */
export async function moveAssetCustody(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const spec = parsed.data.direction === "out" ? ASSET_CHECK_OUT : ASSET_CHECK_IN;
  const result = await transitionAssetState(supabase, session, parsed.data.assetId, spec.to, spec.from);
  if (!result.ok) return { error: result.error };

  revalidatePath("/m/inventory");
  revalidatePath("/m/coc");
  return { ok: true };
}
