import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NewBookingForm, type Option } from "./NewBookingForm";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type SpaceRow = Database["public"]["Tables"]["function_spaces"]["Row"];

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ spaceId?: string }>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.diary.new.title", undefined, "New Booking")} />
        <ConfigureSupabase />
      </>
    );
  }
  const { spaceId } = await searchParams;
  const session = await requireSession();
  const [spacesRaw, projects, clients] = await Promise.all([
    listOrgScoped("function_spaces", session.orgId, { orderBy: "sort_order", ascending: true, limit: 500 }),
    // Cap the select option lists so a large org doesn't load its whole
    // clients/projects table into a <select> (perf audit: unbounded
    // `limit: 0` form selects). 500 is far past any realistic dropdown.
    listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true, limit: 500 }),
    listOrgScoped("clients", session.orgId, { orderBy: "name", ascending: true, limit: 500 }),
  ]);

  const spaces: Option[] = (spacesRaw as SpaceRow[])
    .filter((s) => s.space_state !== "archived")
    .map((s) => ({ id: s.id, name: s.venue ? `${s.name} · ${s.venue}` : s.name }));
  const projectOpts: Option[] = (projects as Array<{ id: string; name: string }>).map((p) => ({
    id: p.id,
    name: p.name,
  }));
  const clientOpts: Option[] = (clients as Array<{ id: string; name: string }>).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.diary.new.eyebrow", undefined, "Sales")}
        title={t("console.diary.new.title", undefined, "New Booking")}
      />
      <div className="page-content max-w-2xl">
        {spaces.length === 0 ? (
          <EmptyState
            title={t("console.diary.new.noSpaces.title", undefined, "No spaces yet")}
            description={t(
              "console.diary.new.noSpaces.desc",
              undefined,
              "Create a bookable space before adding a booking.",
            )}
            action={
              <Button href="/studio/sales/diary/spaces/new">
                {t("console.diary.new.noSpaces.cta", undefined, "+ New Space")}
              </Button>
            }
          />
        ) : (
          <NewBookingForm
            spaces={spaces}
            projects={projectOpts}
            clients={clientOpts}
            defaultSpaceId={spaceId}
          />
        )}
      </div>
    </>
  );
}
