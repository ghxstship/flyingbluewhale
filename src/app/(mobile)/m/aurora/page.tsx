import { requireSession } from "@/lib/auth";
import { AuroraChat } from "./AuroraChat";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Aurora — the AI agentic-chat surface (kit 33 v3.0, the 5th tab).
 *
 * In the kit prototype Aurora is a full-screen overlay opened from the tab bar;
 * the repo models it as a real route so it is deep-linkable, sitemap-clean, and
 * reached by the tab bar like every other surface. The chat itself is the
 * client island `AuroraChat` (canned placeholder responses; heybrio.ai is the
 * future agent runtime — README v3.0).
 */
export default async function AuroraPage() {
  const session = await requireSession();
  // First name for the greeting — derive from the email local part until a
  // profile display-name read is wired (placeholder-tier, matches the kit's
  // "Good evening, Gibbs").
  const local = (session.email ?? "there").split("@")[0] ?? "there";
  const firstName =
    (local.split(/[._-]+/)[0] || "there").replace(/^\w/, (c) => c.toUpperCase());

  return <AuroraChat firstName={firstName} />;
}
