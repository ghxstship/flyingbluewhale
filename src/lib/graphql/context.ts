import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { requireSession, type Session } from "@/lib/auth";

export type GqlContext = {
  session: Session;
  supabase: LooseSupabase;
};

export async function buildGqlContext(): Promise<GqlContext> {
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  return { session, supabase };
}
