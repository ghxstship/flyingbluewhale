export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { fmtDate } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

// Lists proposal_templates rows visible to the caller: every system
// template + every org-scoped template their RLS policy admits. The
// canonical 17-section system row seeded by migration 20260603100001
// is the structural SSOT — every new proposal should fork from it.
export default async function ProposalTemplatesPage() {
  await requireSession();
  const { t } = await getRequestT();
  // LooseSupabase cast because proposal_templates was added in
  // migration 20260603100001 and the generated types haven't been
  // regenerated yet — same pattern marketplace tables use per CLAUDE.md.
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("proposal_templates")
    .select("id, name, description, scope, is_system, blocks, updated_at")
    .is("deleted_at", null)
    .order("is_system", { ascending: false })
    .order("updated_at", { ascending: false });
  const rows = (
    (data ?? []) as unknown as Array<{
      id: string;
      name: string;
      description: string | null;
      scope: string;
      is_system: boolean;
      blocks: unknown[];
      updated_at: string;
    }>
  ).map((r) => ({ ...r, blockCount: Array.isArray(r.blocks) ? r.blocks.length : 0 }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.proposals.templates.eyebrow", undefined, "Sales")}
        title={t("console.proposals.templates.title", undefined, "Proposal Templates")}
        subtitle={t(
          "console.proposals.templates.subtitle",
          undefined,
          "Canonical structures and saved reusables. Apply one to start a new proposal pre-filled.",
        )}
        action={
          <Button href="/console/proposals/new" size="sm">
            {t("console.proposals.templates.blankProposal", undefined, "+ Blank Proposal")}
          </Button>
        }
      />
      <div className="page-content max-w-5xl">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.proposals.templates.empty.title", undefined, "No Templates Yet")}
            description={t(
              "console.proposals.templates.empty.description",
              undefined,
              "The canonical 17-section template ships with every org. Reach out if it isn't showing — your migration may not have applied.",
            )}
            action={
              <Link className="text-sm text-[var(--p-accent)]" href="/console/proposals/new">
                {t("console.proposals.templates.empty.draftFromScratch", undefined, "Draft from scratch →")}
              </Link>
            }
          />
        ) : (
          <table className="ps-table w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.proposals.templates.col.name", undefined, "Name")}</th>
                <th>{t("console.proposals.templates.col.scope", undefined, "Scope")}</th>
                <th>{t("console.proposals.templates.col.blocks", undefined, "Blocks")}</th>
                <th>{t("console.proposals.templates.col.source", undefined, "Source")}</th>
                <th>{t("console.proposals.templates.col.updated", undefined, "Updated")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/console/proposals/templates/${r.id}`} className="hover:underline">
                      {r.name}
                    </Link>
                    {r.description && <div className="text-xs text-[var(--p-text-2)]">{r.description}</div>}
                  </td>
                  <td className="font-mono text-xs">{r.scope}</td>
                  <td className="font-mono text-xs">{r.blockCount}</td>
                  <td className="text-xs">
                    {r.is_system ? (
                      <span className="rounded-full bg-[var(--p-surface)] px-2 py-0.5 text-[10px] tracking-wide uppercase">
                        {t("console.proposals.templates.source.system", undefined, "System")}
                      </span>
                    ) : (
                      t("console.proposals.templates.source.org", undefined, "Org")
                    )}
                  </td>
                  <td className="font-mono text-xs">{fmtDate(r.updated_at)}</td>
                  <td className="text-right">
                    <Link
                      href={`/console/proposals/new?templateId=${r.id}`}
                      className="ps-btn ps-btn--ghost ps-btn--sm"
                    >
                      {t("console.proposals.templates.useTemplate", undefined, "Use Template")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
