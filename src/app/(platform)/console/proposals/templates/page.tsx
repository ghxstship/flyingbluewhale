export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { money, fmtDate } from "@/components/detail/DetailShell";

/**
 * Proposal templates = every draft proposal in the org. Drafts double
 * as reusable templates: click through to duplicate + tailor for a new
 * client. No separate `proposal_templates` table needed today.
 */
export default async function TemplatesPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposals")
    .select("id, doc_number, title, amount_cents, updated_at")
    .eq("org_id", session.orgId)
    .eq("status", "draft")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Array<{ id: string; doc_number: string | null; title: string | null; amount_cents: number | null; updated_at: string }>;
  return (
    <>
      <ModuleHeader
        eyebrow="Sales"
        title="Proposal templates"
        subtitle="Draft proposals that can be duplicated into a new engagement."
        action={<Button href="/console/proposals/new" size="sm">+ New draft</Button>}
      />
      <div className="page-content max-w-5xl">
        {rows.length === 0 ? (
          <EmptyState
            title="No templates yet"
            description="Save any proposal in draft state and it becomes a reusable template. Duplicate into a new client engagement from the detail page."
            action={
              <Link className="text-sm text-[var(--org-primary)]" href="/console/proposals/new">
                Draft from scratch →
              </Link>
            }
          />
        ) : (
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Amount</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">{r.doc_number ?? r.id.slice(0, 8)}</td>
                  <td>
                    <Link href={`/console/proposals/${r.id}`} className="hover:underline">
                      {r.title ?? "Untitled"}
                    </Link>
                  </td>
                  <td className="font-mono text-xs">{money(r.amount_cents)}</td>
                  <td className="font-mono text-xs">{fmtDate(r.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
