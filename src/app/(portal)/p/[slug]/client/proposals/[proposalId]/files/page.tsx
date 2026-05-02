import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { resolveProposalContext, listFiles } from "@/lib/proposals/portal/queries";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  proposal: "Proposal",
  sow: "SOW",
  invoice: "Invoice",
  proof: "Proof",
  condition_report: "Condition report",
  contract: "Contract",
  other: "Other",
};

function formatBytes(b: number | null | undefined): string {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const files = await listFiles(proposalId);

  return (
    <div className="space-y-4 p-6">
      <header className="surface p-5">
        <div className="eyebrow text-xs text-[var(--text-muted)]">Files</div>
        <h1 className="text-lg font-semibold">Signed Documents, Proofs, and Reports</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Stored in the <code className="font-mono text-xs">proposals</code> Supabase bucket. Downloads are served via
          short-lived signed URLs.
        </p>
      </header>

      {files.length === 0 ? (
        <div className="surface p-12 text-center text-[var(--text-muted)]">No files yet.</div>
      ) : (
        <div className="surface p-0">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Size</th>
                <th>Uploaded</th>
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
                  <td className="font-mono text-xs text-[var(--text-muted)]">{timeAgo(f.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
