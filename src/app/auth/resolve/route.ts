import { NextResponse } from "next/server";
import { getSession, resolveShell } from "@/lib/auth";
import { emitAudit } from "@/lib/audit";

async function route(req: Request) {
  const url = new URL(req.url);
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", url.origin));

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

  const shell = resolveShell(session.persona);
  const target =
    shell === "/p"
      ? `/p/${url.searchParams.get("slug") ?? "select"}`
      : shell;

  return NextResponse.redirect(new URL(target, url.origin));
}

export const GET = route;
export const POST = route;
