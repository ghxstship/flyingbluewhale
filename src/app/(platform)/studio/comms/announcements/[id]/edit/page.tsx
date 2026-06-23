import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateAnnouncement } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">{t("console.common.configureSupabase", undefined, "Configure Supabase.")}</div>
    );
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, audience, pinned, publish_state")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  const a = data as {
    id: string;
    title: string;
    body: string;
    audience: string;
    pinned: boolean;
    publish_state: string;
  };

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.announcements.edit.eyebrow", undefined, "Announcement")}
        title={t("console.comms.announcements.edit.title", { title: a.title }, `Edit · ${a.title}`)}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateAnnouncement}
          cancelHref={`/studio/comms/announcements/${a.id}`}
          submitLabel={t("common.save", undefined, "Save")}
        >
          <input type="hidden" name="id" value={a.id} />
          <Input
            label={t("console.comms.announcements.edit.titleLabel", undefined, "Title")}
            name="title"
            required
            maxLength={200}
            defaultValue={a.title}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.comms.announcements.edit.bodyLabel", undefined, "Body")}
            </label>
            <textarea
              name="body"
              rows={6}
              required
              maxLength={8000}
              defaultValue={a.body}
              className="ps-input mt-1.5 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.comms.announcements.edit.audienceLabel", undefined, "Audience")}
            </label>
            <select name="audience" className="ps-input mt-1.5 w-full" defaultValue={a.audience}>
              <option value="all">{t("console.comms.announcements.edit.audience.all", undefined, "All")}</option>
              <option value="crew">{t("console.comms.announcements.edit.audience.crew", undefined, "Crew")}</option>
              <option value="contractors">
                {t("console.comms.announcements.edit.audience.contractors", undefined, "Contractors")}
              </option>
              <option value="vendors">
                {t("console.comms.announcements.edit.audience.vendors", undefined, "Vendors")}
              </option>
              <option value="admins">
                {t("console.comms.announcements.edit.audience.admins", undefined, "Admins")}
              </option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="pinned" defaultChecked={a.pinned} />{" "}
            {t("console.comms.announcements.edit.pinToTop", undefined, "Pin to top of feed")}
          </label>
        </FormShell>
      </div>
    </>
  );
}
