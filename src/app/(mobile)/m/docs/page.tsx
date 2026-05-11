import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { DocDownloadLink } from "./DocDownloadLink";

export const dynamic = "force-dynamic";

type Doc = {
  id: string;
  label: string;
  doc_kind: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_at: string;
};

const KIND_TONE: Record<string, "info" | "success" | "warning" | "muted"> = {
  id: "info",
  license: "success",
  tax: "warning",
  contract: "info",
  medical: "warning",
  other: "muted",
};

export default async function MobileDocsPage() {
  if (!hasSupabase) return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: docs } = await supabase
    .from("personal_documents")
    .select("id, label, doc_kind, mime_type, size_bytes, uploaded_at")
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    .order("uploaded_at", { ascending: false });

  const list = (docs ?? []) as Doc[];

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">My Documents</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Personal IDs, licenses, tax forms, and signed contracts. Only you can see these.
      </p>

      <div className="mt-4 flex justify-end">
        <Link href="/m/docs/new" className="btn btn-primary btn-sm">
          + Upload
        </Link>
      </div>

      <ul className="mt-5 space-y-2">
        {list.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title="No Documents"
              description="Uploads from onboarding and contract signing land here."
            />
          </li>
        ) : (
          list.map((d) => (
            <li key={d.id} className="surface p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={KIND_TONE[d.doc_kind] ?? "muted"}>{d.doc_kind}</Badge>
                    {d.mime_type && (
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{d.mime_type}</span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold">{d.label}</div>
                </div>
                <span className="shrink-0 font-mono text-xs text-[var(--text-muted)]">{fmt.date(d.uploaded_at)}</span>
              </div>
              <div className="mt-2 flex justify-end">
                <DocDownloadLink docId={d.id} />
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
