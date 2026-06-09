import "server-only";

import { GraphQLError } from "graphql";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getSession, type Session } from "@/lib/auth";

export type GqlContext = {
  session: Session;
  supabase: LooseSupabase;
};

export async function buildGqlContext(): Promise<GqlContext> {
  // getSession (not requireSession): requireSession redirect()s to /login,
  // which surfaces to an unauthenticated API POST as a masked NEXT_REDIRECT
  // digest error instead of a 401. GraphQLError with http extensions lets
  // yoga return a proper 401 with a spec-shaped { errors } body.
  const session = await getSession();
  if (!session) {
    throw new GraphQLError("Unauthorized — supply a session cookie or a Bearer personal access token.", {
      extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
    });
  }
  const supabase = (await createClient()) as unknown as LooseSupabase;
  return { session, supabase };
}
