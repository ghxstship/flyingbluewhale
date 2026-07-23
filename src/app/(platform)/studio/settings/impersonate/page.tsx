import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { PLATFORM_ROLES, PERSONAS } from "@/lib/supabase/types";
import { getRequestT } from "@/lib/i18n/request";
import { ImpersonateConsole, type MemberRow } from "./ImpersonateConsole";

export const dynamic = "force-dynamic";

/**
 * Developer-only "Act As" console. Hard-gated: a non-developer gets a 404
 * (notFound) so the route's existence isn't even disclosed. The gate reads
 * the DB-backed session, never a client value. This route is intentionally
 * absent from nav and EXEMPT in the sitemap generator.
 */
export default async function ImpersonatePage() {
  const session = await requireSession();
  if (session.isDeveloper !== true) notFound();

  let rows: MemberRow[] = [];
  const serviceReady = isServiceClientAvailable();

  if (serviceReady) {
    const service = createServiceClient();
    // Memberships joined to org slug + user email. Service-role read so the
    // developer can see every org's members, not just their own.
    const { data } = await service
      .from("memberships")
      .select("user_id, role, persona, is_developer, orgs(slug, name), users(email, name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);

    type Raw = {
      user_id: string;
      role: string;
      persona: string;
      is_developer: boolean;
      orgs: { slug: string | null; name: string | null } | null;
      users: { email: string | null; name: string | null } | null;
    };
    rows = ((data ?? []) as unknown as Raw[]).map((r) => ({
      userId: r.user_id,
      email: r.users?.email ?? "",
      name: r.users?.name ?? null,
      orgSlug: r.orgs?.slug ?? "",
      orgName: r.orgs?.name ?? r.orgs?.slug ?? "",
      role: r.role,
      persona: r.persona,
      isDeveloper: r.is_developer,
    }));
  }

  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.impersonate.eyebrow", undefined, "Developer")}
        title={t("console.settings.impersonate.title", undefined, "Act As")}
        subtitle={t(
          "console.settings.impersonate.subtitle",
          undefined,
          "Impersonate a user to reproduce their exact view. Every start and stop is audited.",
        )}
      />
      <div className="page-content max-w-5xl space-y-6">
        {!serviceReady ? (
          <div className="surface p-6 text-sm">
            {t(
              "console.settings.impersonate.serviceKeyRequired",
              undefined,
              "Impersonation requires the service-role key. Set SUPABASE_SERVICE_ROLE_KEY to enable this console.",
            )}
          </div>
        ) : (
          <ImpersonateConsole
            rows={rows}
            roles={PLATFORM_ROLES as readonly string[]}
            personas={PERSONAS as readonly string[]}
            selfUserId={session.userId}
          />
        )}
      </div>
    </>
  );
}
