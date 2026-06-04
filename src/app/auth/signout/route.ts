import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { emitAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const url = new URL(req.url);
  if (hasSupabase) {
    // Read session BEFORE signOut so emitAudit has actorId + orgId.
    // Skip the audit when there's no session (rare — happens if the
    // cookie is already expired, e.g. tab open across grace window).
    const session = await getSession();
    const supabase = await createClient();
    await supabase.auth.signOut();
    if (session?.orgId) {
      await emitAudit({
        actorId: session.userId,
        orgId: session.orgId,
        actorEmail: session.email,
        action: "auth.logout",
        requestId: req.headers.get("x-request-id"),
      });
    }
  }
  return NextResponse.redirect(new URL("/", url.origin), { status: 303 });
}
