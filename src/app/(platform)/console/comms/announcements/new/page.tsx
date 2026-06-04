import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NewAnnouncementForm } from "./NewAnnouncementForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.comms.announcements.new.eyebrow", undefined, "Comms · Announcements")}
          title={t("console.comms.announcements.new.title", undefined, "New Announcement")}
        />
        <div className="page-content max-w-2xl">
          <div className="surface p-6 text-sm">
            {t("console.comms.announcements.new.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  // Load the org's scoping options so the composer can target the
  // right slice instead of broadcasting to All every time.
  const [{ data: projects }, { data: teams }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("name")
      .limit(500),
    supabase.from("teams").select("id, name").eq("org_id", session.orgId).order("name").limit(500),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.announcements.new.eyebrow", undefined, "Comms · Announcements")}
        title={t("console.comms.announcements.new.title", undefined, "New Announcement")}
      />
      <div className="page-content max-w-2xl">
        <NewAnnouncementForm
          projects={(projects ?? []) as Array<{ id: string; name: string }>}
          teams={(teams ?? []) as Array<{ id: string; name: string }>}
        />
      </div>
    </>
  );
}
