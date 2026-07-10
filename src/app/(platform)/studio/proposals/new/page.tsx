import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NewProposalForm } from "./NewProposalForm";

export const dynamic = "force-dynamic";

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; templateId?: string }>;
}) {
  const q = await searchParams;
  const defaultClientId = q.clientId;
  const templateId = q.templateId;
  // FK candidates are searched on demand through RecordCombobox (audit
  // A-06) — only the deep-linked default client's label resolves here.
  let defaultClientName: string | undefined;
  let template: { id: string; name: string; blockCount: number } | null = null;
  if (hasSupabase) {
    const session = await requireSession();
    if (defaultClientId) {
      const client = await getOrgScoped("clients", session.orgId, defaultClientId);
      defaultClientName = client?.name;
    }
    if (templateId) {
      const supabase = (await createClient()) as unknown as LooseSupabase;
      const { data: tpl } = await supabase
        .from("proposal_templates")
        .select("id, name, blocks")
        .eq("id", templateId)
        .is("deleted_at", null)
        .maybeSingle();
      if (tpl) {
        const tplRow = tpl as unknown as { id: string; name: string; blocks: unknown };
        template = {
          id: tplRow.id,
          name: tplRow.name,
          blockCount: Array.isArray(tplRow.blocks) ? tplRow.blocks.length : 0,
        };
      }
    }
  }
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.proposals.new.eyebrow", undefined, "Sales")}
        title={t("console.proposals.new.title", undefined, "New Proposal")}
        subtitle={
          template
            ? t("console.proposals.new.prefilledFrom", { name: template.name }, `Pre-filled from "${template.name}"`)
            : undefined
        }
      />
      <div className="page-content max-w-2xl">
        <NewProposalForm
          defaultClientId={defaultClientName ? defaultClientId : undefined}
          defaultClientName={defaultClientName}
          template={template}
        />
      </div>
    </>
  );
}
