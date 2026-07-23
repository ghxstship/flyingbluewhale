import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { CHANNEL_KINDS, CHANNEL_KIND_LABEL } from "@/lib/messaging/queries";
import { createChannel } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewChannelPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.comms.channels.new.eyebrow", undefined, "Channels")}
          title={t("console.comms.channels.new.title", undefined, "New Channel")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.comms.channels.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name")
    .limit(500);
  const projectRows = (projects ?? []) as Array<{ id: string; name: string | null }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.channels.new.eyebrow", undefined, "Channels")}
        title={t("console.comms.channels.new.title", undefined, "New Channel")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createChannel}
          cancelHref="/studio/comms/channels"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <Input
            label={t("console.comms.channels.new.nameLabel", undefined, "Name")}
            name="name"
            required
            maxLength={200}
            placeholder="production-floor"
          />
          <div>
            <label htmlFor="kind" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.comms.channels.new.kindLabel", undefined, "Kind")}
            </label>
            <select id="kind" name="kind" required className="ps-input mt-1.5 w-full" defaultValue="project">
              {CHANNEL_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`console.comms.channels.kind.${k}`, undefined, CHANNEL_KIND_LABEL[k])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="topic" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.comms.channels.new.topicLabel", undefined, "Topic")}
            </label>
            <textarea id="topic" name="topic" rows={2} maxLength={500} className="ps-input mt-1.5 w-full" />
          </div>
          <div>
            <label htmlFor="project_id" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.comms.channels.new.projectLabel", undefined, "Project")}
            </label>
            <select id="project_id" name="project_id" className="ps-input mt-1.5 w-full" defaultValue="">
              <option value="">{t("console.comms.channels.new.projectNone", undefined, "None")}</option>
              {projectRows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.id}
                </option>
              ))}
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
