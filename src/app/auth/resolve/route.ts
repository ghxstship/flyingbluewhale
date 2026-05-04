import { NextResponse } from "next/server";
import { getSession, resolveShell } from "@/lib/auth";
import { emitAudit } from "@/lib/audit";
import { shellFromResolved, urlFor } from "@/lib/urls";

async function route(req: Request) {
  const url = new URL(req.url);
  const session = await getSession();
  if (!session) return NextResponse.redirect(urlFor("auth", "/login"));

  // H2-07 — log the login as a first-class audit event. /auth/resolve is
  // the canonical post-login gateway so every successful session passes
  // through here exactly once per device/browser session.
  if (session.orgId) {
    await emitAudit({
      actorId: session.userId,
      orgId: session.orgId,
      actorEmail: session.email,
      action: "auth.login",
      metadata: { shell: resolveShell(session.persona), persona: session.persona },
      requestId: req.headers.get("x-request-id"),
    });
  }

  const resolved = resolveShell(session.persona);
  const shell = shellFromResolved(resolved);
  const target = resolved === "/p" ? urlFor("portal", `/${url.searchParams.get("slug") ?? "select"}`) : urlFor(shell);

  return NextResponse.redirect(target);
}

export const GET = route;
export const POST = route;
