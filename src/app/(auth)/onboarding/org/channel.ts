import { headers } from "next/headers";
import { shellForHost } from "@/lib/urls";

/**
 * Org-creation channel guard (marketing rebuild plan §10, decision 4).
 *
 * Rule: organizations are born in LEG3ND on the web; COMPVSS is login/join-only.
 * This is the single app-tier enforcement point for the rule — the
 * `create_org_with_owner` RPC itself stays open (console/admin/e2e still call
 * it), and `createOrgAction` + the /onboarding/org page both read this helper.
 *
 * Channel detection (all request-derived, no client cooperation required
 * beyond what the browser sends anyway):
 *  1. Host / x-forwarded-host resolving to the COMPVSS shell
 *     (compvss.* / compass.* subdomains, via the same `shellForHost()` the
 *     proxy uses for its host rewrite).
 *  2. `x-pathname` — the proxy seeds the INTERNAL post-rewrite path onto the
 *     request, so anything the proxy mapped into the /m route group carries
 *     the prefix in every mode.
 *  3. `origin` / `referer` — a server-action POST or navigation launched from
 *     the COMPVSS PWA carries the compvss origin, and in single-host
 *     path-prefix mode (previews, local dev) the referer path carries /m.
 *
 * This is a product-channel guard, not a security boundary: headers are
 * client-controlled and the decision-4 ratification is explicitly app-tier
 * only. It exists so the COMPVSS surface cannot grow an org-create path.
 */

export const ORG_CREATE_CHANNEL_MESSAGE =
  "Organizations are created in LEG3ND on the web. From COMPVSS you can sign in or join an existing organization.";

function isMobileHost(host: string | null | undefined): boolean {
  return !!host && shellForHost(host).shell === "mobile";
}

/** True when the current request reached us through the COMPVSS shell. */
export async function isCompvssChannel(): Promise<boolean> {
  const h = await headers();

  if (isMobileHost(h.get("x-forwarded-host") ?? h.get("host"))) return true;

  const internalPath = h.get("x-pathname");
  if (internalPath === "/m" || internalPath?.startsWith("/m/")) return true;

  for (const key of ["origin", "referer"] as const) {
    const raw = h.get(key);
    if (!raw) continue;
    try {
      const u = new URL(raw);
      if (isMobileHost(u.host)) return true;
      if (key === "referer" && (u.pathname === "/m" || u.pathname.startsWith("/m/"))) return true;
    } catch {
      // Malformed header value — not a channel signal.
    }
  }
  return false;
}
