import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { NewAnnouncementForm } from "./NewAnnouncementForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Comms · Announcements" title="New Announcement" />
        <div className="page-content max-w-2xl">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
      <ModuleHeader eyebrow="Comms · Announcements" title="New Announcement" />
      <div className="page-content max-w-2xl">
        <NewAnnouncementForm
          projects={(projects ?? []) as Array<{ id: string; name: string }>}
          teams={(teams ?? []) as Array<{ id: string; name: string }>}
        />
      </div>
    </>
  );
}
