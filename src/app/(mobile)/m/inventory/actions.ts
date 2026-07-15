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
 * COMPVSS shipped an "Assets" primary tab that could read the unified
 * `assets` store and never write it — `asset_movements`, the custody
 * ledger, was unwritable from the one place custody physically changes
 * hands. Everything that looked like it closed the loop pointed at the
 * assignment domain instead.
 *
 * Routes through the shared `transitionAssetState`, so the field moves an
 * asset through the identical FSM, TOCTOU guard, ledger write and audit
 * emit the console uses — including its manager+ gate, unchanged. Whether
 * crew may take their own gear is a separate product decision (audit G3);
 * this closes the parity half without inventing an authorization model.
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
