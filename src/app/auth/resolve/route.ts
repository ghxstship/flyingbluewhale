import { NextResponse } from "next/server";
import { getSession, resolveShell } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";
import { shellFromResolved, urlFor } from "@/lib/urls";

async function route(req: Request) {
  const url = new URL(req.url);
  let session = await getSession();
  if (!session) return NextResponse.redirect(urlFor("auth", "/login"));

  // No real org membership (signup didn't create one, OAuth-only, or stale
  // demo-fallback that no longer applies). Three paths, in priority order:
  //   ① Auto-claim any pending invite addressed to this user's email. Most
  //     forgiving entry-point handler — a user who hit /signup directly from
  //     an invite email still gets dropped into the right org.
  //   ② If signup carried an orgName — either via `?org=NAME` on the
  //     confirm-redirect or via user_metadata.pending_org_name on a later
  //     password login — silently bootstrap their workspace.
  //   ③ Otherwise, funnel to /onboarding/org so they can name a workspace.
  if (!session.orgId || session.persona === "guest") {
    const supabase = await createClient();

    // ① Try auto-claim a pending invite.
    const { data: pendingInvite } = await supabase
      .from("invites")
      .select("token")
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pendingInvite?.token) {
      const { error: acceptError } = await (
        supabase.rpc as unknown as (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: unknown; error: { message: string } | null }>
      )("accept_invite", { p_token: pendingInvite.token });
      if (!acceptError) {
        session = await getSession();
      }
    }

    // ② If still no org, try the org-name path.
    const queryOrg = (url.searchParams.get("org") ?? "").trim();
    let pending = !session || !session.orgId || session.persona === "guest" ? queryOrg : "";
    if (pending === "" && (!session || !session.orgId || session.persona === "guest")) {
      const { data: userData } = await supabase.auth.getUser();
      const metaName = (userData.user?.user_metadata?.pending_org_name as string | undefined)?.trim();
      pending = metaName ?? "";
    }
    if (pending && (!session || !session.orgId || session.persona === "guest")) {
      const { error } = await (
        supabase.rpc as unknown as (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: unknown; error: { message: string } | null }>
      )("create_org_with_owner", { p_name: pending, p_slug: "" });
      if (error) {
        // Don't strand the user — log and fall through to /onboarding/org
        // where they'll get the form prefilled. The most common cause is
        // a pre-existing soft-deleted org with the same slug surfacing a
        // unique violation that the function's collision loop didn't catch.
        console.warn("auth.resolve: silent org bootstrap failed", {
          user: session?.userId,
          name: pending,
          error: error.message,
        });
      } else {
        // Burn the metadata hint so a later session change doesn't loop.
        await supabase.auth.updateUser({ data: { pending_org_name: null } });
        // Re-read session so the rest of this route sees the new org.
        session = await getSession();
      }
    }
    if (!session || !session.orgId || session.persona === "guest") {
      const next = pending ? `/onboarding/org?name=${encodeURIComponent(pending)}` : "/onboarding/org";
      return NextResponse.redirect(urlFor("auth", next));
    }
  }

  // H2-07 — log the login as a first-class audit event. /auth/resolve is
  // the canonical post-login gateway so every successful session passes
  // through here exactly once per device/browser session.
  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.login",
    metadata: { shell: resolveShell(session.persona), persona: session.persona },
    requestId: req.headers.get("x-request-id"),
  });

  const resolved = resolveShell(session.persona);
  const shell = shellFromResolved(resolved);
  // Personal shell has no SHELL_PATH_PREFIX (it lives on the apex), so
  // `urlFor("personal")` would return the base URL with no /me path and
  // the redirect would land on / (marketing root). Force the path here.
  // Portal needs the slug appended; everything else (console, mobile)
  // uses its natural shell prefix correctly.
  //
  // Validate the slug as a flat token (project slugs are
  // ^[a-z0-9-]+$). Without this, an attacker could pass
  // `?slug=foo%2F..%2Fbar` and have urlFor() emit a multi-segment
  // path. Browsers normalize `..` away, but we don't want to redirect
  // anyone to anything other than `/p/<slug>`.
  const rawSlug = url.searchParams.get("slug") ?? "select";
  const slug = /^[a-z0-9-]{1,64}$/i.test(rawSlug) ? rawSlug : "select";
  const target =
    resolved === "/p" ? urlFor("portal", `/${slug}`) : resolved === "/me" ? urlFor("personal", "/me") : urlFor(shell);

  return NextResponse.redirect(target);
}

export const GET = route;
export const POST = route;
