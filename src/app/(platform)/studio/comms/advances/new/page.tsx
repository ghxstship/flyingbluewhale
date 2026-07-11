export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createBatchAction } from "./actions";

export default async function NewAdvanceSendPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  // S1 · Prepare — live packets only; sections pull live project data.
  const { data: packets } = await supabase
    .from("advance_packets")
    .select("id, version, projects(name)")
    .eq("org_id", session.orgId)
    .eq("packet_state", "live")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.advances.eyebrow", undefined, "Comms")}
        title={t("console.comms.advances.new.title", undefined, "Prepare Advance Send")}
        subtitle={t(
          "console.comms.advances.new.subtitle",
          undefined,
          "Pick a live packet; every audience contact becomes one personalized render.",
        )}
        breadcrumbs={[
          { label: t("console.comms.advances.title", undefined, "Advance Sends"), href: "/studio/comms/advances" },
          { label: t("console.comms.advances.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        {(packets ?? []).length === 0 ? (
          <EmptyState
            title={t("console.comms.advances.new.noneTitle", undefined, "No Live Packets")}
            description={t(
              "console.comms.advances.new.noneDescription",
              undefined,
              "Author a packet on a project's Advancing tab and take it live, then come back to send it.",
            )}
            action={
              <Button href="/studio/projects" size="sm">
                {t("console.comms.advances.new.goToProjects", undefined, "Open Projects")}
              </Button>
            }
          />
        ) : (
          <FormShell
            action={createBatchAction}
            submitLabel={t("console.comms.advances.new.submit", undefined, "Prepare Batch")}
            cancelHref="/studio/comms/advances"
          >
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                {t("console.comms.advances.new.packet", undefined, "Packet")}
              </span>
              <select name="packet_id" className="ps-input w-full" required>
                {(packets ?? []).map((p) => {
                  const project = p.projects as unknown as { name: string } | null;
                  return (
                    <option key={p.id} value={p.id}>
                      {project?.name ?? p.id} · v{p.version}
                    </option>
                  );
                })}
              </select>
            </label>
            <Input
              name="subject"
              label={t("console.comms.advances.new.subjectLabel", undefined, "Subject Override")}
              hint={t(
                "console.comms.advances.new.subjectHint",
                undefined,
                "Leave blank for the merge grammar: ProjectCode Advance | Team · Company.",
              )}
            />
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                {t("console.comms.advances.new.scheduledAt", undefined, "Schedule For")}
              </span>
              <input type="datetime-local" name="scheduled_at" className="ps-input w-full" />
              <span className="mt-1 block text-xs text-[var(--p-text-3)]">
                {t(
                  "console.comms.advances.new.scheduledAtHint",
                  undefined,
                  "Optional. The batch stays reviewable on the tracking board until you send it.",
                )}
              </span>
            </label>
          </FormShell>
        )}
      </div>
    </>
  );
}
