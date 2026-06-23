export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { BLOCK_LABELS } from "@/lib/proposals/types";
import type { ProposalBlock } from "@/lib/proposals/types";
import { partitionBlocks } from "@/lib/proposals/validate";
import { getRequestT } from "@/lib/i18n/request";

// Read-only preview of a single template. Renders the block outline so
// ops can sanity-check the structure before applying. The Use Template
// button routes to the new-proposal form pre-filled with templateId.
export default async function TemplatePreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  await requireSession();
  const { t } = await getRequestT();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("proposal_templates")
    .select("id, name, description, scope, is_system, blocks")
    .eq("id", templateId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  const tpl = data as unknown as {
    id: string;
    name: string;
    description: string | null;
    scope: string;
    is_system: boolean;
    blocks: unknown;
  };
  const { valid, invalid } = partitionBlocks(tpl.blocks);

  return (
    <>
      <ModuleHeader
        eyebrow={
          tpl.is_system
            ? t("console.proposals.templates.preview.eyebrowSystem", undefined, "Template · System")
            : t("console.proposals.templates.preview.eyebrowOrg", undefined, "Template · Org")
        }
        title={tpl.name}
        subtitle={tpl.description ?? undefined}
        breadcrumbs={[
          { label: t("console.proposals.breadcrumb.revenue", undefined, "Revenue"), href: "/studio/proposals" },
          {
            label: t("console.proposals.templates.breadcrumb.templates", undefined, "Templates"),
            href: "/studio/proposals/templates",
          },
          { label: tpl.name },
        ]}
        action={
          <Link href={`/studio/proposals/new?templateId=${tpl.id}`} className="ps-btn ps-btn--sm">
            {t("console.proposals.templates.preview.useTemplate", undefined, "Use Template")}
          </Link>
        }
      />
      <div className="page-content max-w-3xl space-y-3">
        <div className="text-xs text-[var(--p-text-2)]">
          {valid.length === 1
            ? t(
                "console.proposals.templates.preview.validBlockOne",
                { count: valid.length },
                `${valid.length} valid block`,
              )
            : t(
                "console.proposals.templates.preview.validBlockOther",
                { count: valid.length },
                `${valid.length} valid blocks`,
              )}
          {invalid > 0
            ? ` ${t("console.proposals.templates.preview.skippedInvalid", { count: invalid }, `· ${invalid} skipped (invalid)`)}`
            : ""}
        </div>
        {valid.map((block: ProposalBlock, i: number) => (
          <div key={i} className="surface p-3">
            <div className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
              {i + 1} · {BLOCK_LABELS[block.type]}
              {"anchorId" in block && block.anchorId ? (
                <span className="ms-2 font-mono text-[10px] text-[var(--p-text-2)]">#{block.anchorId}</span>
              ) : null}
            </div>
            <div className="mt-1 text-sm">{describeBlock(block)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function describeBlock(b: ProposalBlock): string {
  switch (b.type) {
    case "hero":
      return b.title;
    case "section_eyebrow":
      return b.label;
    case "heading":
      return b.text;
    case "prose":
      return b.body.slice(0, 120) + (b.body.length > 120 ? "…" : "");
    case "callout":
      return b.title ?? b.body.slice(0, 80);
    case "phase":
      return `${b.num} · ${b.name}${b.xpmsPhase ? ` (${b.xpmsPhase})` : ""}${b.deliverables?.length ? ` — ${b.deliverables.length} deliverable(s)` : ""}`;
    case "investment_table":
      return `${b.groups.length} group(s) · total ${b.total.cents / 100}`;
    case "engagement_split":
      return `${b.depositPercent}/${b.balancePercent}`;
    case "schedule_table":
      return `${b.rows.length} row(s)`;
    case "terms_grid":
      return `${b.items.length} term(s)`;
    case "exclusions":
      return `${b.items.length} exclusion(s)`;
    case "change_orders":
      return `${b.items.length} change-order(s)`;
    case "equipment_manifest":
      return `${b.items.length} item(s)`;
    case "signature_block":
      return `${b.parties.length} part${b.parties.length === 1 ? "y" : "ies"}`;
    case "cta":
      return `${b.label} → ${b.href}`;
    default:
      return b.type;
  }
}
