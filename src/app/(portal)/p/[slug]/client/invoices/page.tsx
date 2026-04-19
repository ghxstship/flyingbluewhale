import Link from "next/link";
import { FileDown } from "lucide-react";
import { PortalSubpage } from "@/components/PortalSubpage";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { formatMoney } from "@/lib/format";
import type { Invoice } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  const supabase = await createClient();
  const rows = project ? (await supabase
    .from("invoices")
    .select("*")
    .eq("project_id", project.id)
    .order("issued_at", { ascending: false })).data as Invoice[] ?? [] : [];
  return (
    <PortalSubpage slug={slug} persona="client" title="Invoices" subtitle="Pay invoices and download receipts">
      <DataTable<Invoice>
        rows={rows}
        emptyLabel="No invoices yet"
        columns={[
          { key: "number", header: "Number", render: (r) => <span className="font-mono text-xs">{r.number}</span> },
          { key: "title", header: "Title", render: (r) => r.title },
          { key: "amount", header: "Amount", render: (r) => formatMoney(r.amount_cents, r.currency), className: "font-mono text-xs" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "due", header: "Due", render: (r) => r.due_at ?? "—", className: "font-mono text-xs" },
          {
            key: "download",
            header: "PDF",
            render: (r) => (
              <Link
                href={`/api/v1/invoices/${r.id}/pdf`}
                className="inline-flex items-center gap-1 text-xs hover:underline"
                aria-label={`Download invoice ${r.number} as PDF`}
              >
                <FileDown size={12} aria-hidden="true" />
                Download
              </Link>
            ),
          },
        ]}
      />
    </PortalSubpage>
  );
}
