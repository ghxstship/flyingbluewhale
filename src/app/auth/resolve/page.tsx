import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession, resolveShell } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";
import { shellFromResolved, urlFor } from "@/lib/urls";

/**
 * Post-login gateway. MUST be a PAGE, not a route handler: it is reached via a
 * server-action `redirect()` (login) which drives a client-side router
 * navigation, and the App Router does not cleanly settle on a redirect-only
 * *route handler* reached that way — it loops on /auth/resolve. A page's
 * server-side `redirect()` is followed natively by the router (verified: a
 * hard GET to the old route handler followed its 307 fine; the soft nav did
 * not). Logic is otherwise identical to the former route.ts.
 *
 * Always redirects (never renders) — `return null` is unreachable.
 */
export const dynamic = "force-dynamic";

export default async function AuthResolvePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; org?: string; slug?: string }>;
}) {
  const sp = await searchParams;
  let session = await getSession();
  if (!session) redirect(urlFor("auth", "/login"));

  // No real org membership (signup didn't create one, OAuth-only, or stale
  // demo-fallback that no longer applies). Three paths, in priority order:
  //   ① Auto-claim any pending invite addressed to this user's email.
  //   ② If signup carried an orgName (?org= or user_metadata.pending_org_name),
  //     silently bootstrap their workspace.
  //   ③ Otherwise, funnel to /onboarding/org so they can name a workspace.
  if (!session.orgId || session.persona === "guest") {
    const supabase = await createClient();

    // ① Try auto-claim a pending invite.
    const { data: pendingInvite } = await supabase
      .from("invites")
      .select("token")
      .eq("invite_state", "pending")
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
    const queryOrg = (sp.org ?? "").trim();
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
        // where they'll get the form prefilled.
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
      const onboarding = pending ? `/onboarding/org?name=${encodeURIComponent(pending)}` : "/onboarding/org";
      redirect(urlFor("auth", onboarding));
    }
  }

  // H2-07 — log the login as a first-class audit event. /auth/resolve is the
  // canonical post-login gateway so every successful session passes through
  // here exactly once per device/browser session.
  const requestId = (await headers()).get("x-request-id");
  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.login",
    metadata: { shell: resolveShell(session.persona), persona: session.persona },
    requestId,
  });

  const resolved = resolveShell(session.persona);
  const shell = shellFromResolved(resolved);

  // Validate the slug as a flat token (project slugs are ^[a-z0-9-]+$). Without
  // this, `?slug=foo%2F..%2Fbar` could emit a multi-segment path.
  const rawSlug = sp.slug ?? "select";
  const slug = /^[a-z0-9-]{1,64}$/i.test(rawSlug) ? rawSlug : "select";

  // Deep-link restore: a validated internal `?next=` path wins over the persona
  // default. Internal-path-only guard (no `//`, no scheme); the prefix is mapped
  // to its shell so subdomain mode emits the right host.
  const rawNext = sp.next ?? "";
  if (rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\") && rawNext.length <= 512) {
    const nextTarget = rawNext.startsWith("/console")
      ? urlFor("platform", rawNext.slice("/console".length) || "/")
      : rawNext === "/p" || rawNext.startsWith("/p/")
        ? urlFor("portal", rawNext.slice("/p".length) || "/")
        : rawNext === "/m" || rawNext.startsWith("/m/")
          ? urlFor("mobile", rawNext.slice("/m".length) || "/")
          : urlFor("marketing", rawNext);
    redirect(nextTarget);
  }

  const target =
    resolved === "/p" ? urlFor("portal", `/${slug}`) : resolved === "/me" ? urlFor("personal", "/me") : urlFor(shell);

  redirect(target);
}
