import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { resolveProposalContext, listFiles } from "@/lib/proposals/portal/queries";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const files = await listFiles(proposalId);
  const { t } = await getRequestT();

  const CATEGORY_LABEL: Record<string, string> = {
    proposal: t("p.client.proposals.files.category.proposal", undefined, "Proposal"),
    sow: t("p.client.proposals.files.category.sow", undefined, "SOW"),
    invoice: t("p.client.proposals.files.category.invoice", undefined, "Invoice"),
    proof: t("p.client.proposals.files.category.proof", undefined, "Proof"),
    condition_report: t("p.client.proposals.files.category.condition_report", undefined, "Condition report"),
    contract: t("p.client.proposals.files.category.contract", undefined, "Contract"),
    other: t("p.client.proposals.files.category.other", undefined, "Other"),
  };

  function formatBytes(b: number | null | undefined): string {
    if (!b) return "—";
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4 p-6">
      <header className="surface p-5">
        <div className="eyebrow text-xs text-[var(--p-text-2)]">
          {t("p.client.proposals.files.eyebrow", undefined, "Files")}
        </div>
        <h1 className="text-lg font-semibold">
          {t("p.client.proposals.files.title", undefined, "Signed Documents, Proofs, and Reports")}
        </h1>
        <p className="mt-1 text-sm text-[var(--p-text-2)]">
          {t(
            "p.client.proposals.files.subtitle",
            undefined,
            "Securely stored. Downloads are served via short-lived signed URLs.",
          )}
        </p>
      </header>

      {files.length === 0 ? (
        <div className="surface p-12 text-center text-[var(--p-text-2)]">
          {t("p.client.proposals.files.empty", undefined, "No files yet.")}
        </div>
      ) : (
        <div className="surface p-0">
          <table className="ps-table w-full">
            <thead>
              <tr>
                <th>{t("p.client.proposals.files.col.name", undefined, "Name")}</th>
                <th>{t("p.client.proposals.files.col.category", undefined, "Category")}</th>
                <th>{t("p.client.proposals.files.col.size", undefined, "Size")}</th>
                <th>{t("p.client.proposals.files.col.uploaded", undefined, "Uploaded")}</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id}>
                  <td className="font-medium">{f.name}</td>
                  <td>
                    <Badge variant="muted">{CATEGORY_LABEL[f.category] ?? f.category}</Badge>
                  </td>
                  <td className="font-mono text-xs">{formatBytes(f.size_bytes)}</td>
                  <td className="font-mono text-xs text-[var(--p-text-2)]">{timeAgo(f.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
