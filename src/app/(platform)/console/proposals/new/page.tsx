import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
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
  let clients: { id: string; name: string }[] = [];
  let projects: { id: string; name: string }[] = [];
  let template: { id: string; name: string; blockCount: number } | null = null;
  if (hasSupabase) {
    const session = await requireSession();
    const [cs, ps] = await Promise.all([
      listOrgScoped("clients", session.orgId, { orderBy: "name", ascending: true }),
      listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true }),
    ]);
    clients = cs.map((c) => ({ id: c.id, name: c.name }));
    projects = ps.map((p) => ({ id: p.id, name: p.name }));
    if (templateId) {
      const supabase = (await createClient()) as unknown as LooseSupabase;
      const { data: tpl } = await supabase
        .from("proposal_templates")
        .select("id, name, blocks")
        .eq("id", templateId)
        .is("deleted_at", null)
        .maybeSingle();
      if (tpl) {
        const t = tpl as unknown as { id: string; name: string; blocks: unknown };
        template = {
          id: t.id,
          name: t.name,
          blockCount: Array.isArray(t.blocks) ? t.blocks.length : 0,
        };
      }
    }
  }
  return (
    <>
      <ModuleHeader
        eyebrow="Sales"
        title="New Proposal"
        subtitle={template ? `Pre-filled from "${template.name}"` : undefined}
      />
      <div className="page-content max-w-2xl">
        <NewProposalForm clients={clients} projects={projects} defaultClientId={defaultClientId} template={template} />
      </div>
    </>
  );
}
