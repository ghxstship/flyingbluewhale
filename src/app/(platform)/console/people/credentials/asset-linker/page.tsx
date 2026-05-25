import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { revokeLinkAction } from "./actions";
import { LinkAssetForm } from "./LinkAssetForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

export default async function AssetLinkerPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Credentials" title="Asset Linker" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  // Credential assignments + their party + the active scan codes already bound.
  const { data: assignmentsRaw } = await supabase
    .from("assignments")
    .select(
      "id, title, party_kind, party_user_id, party_crew_id, party_external_id, party_user:users!assignments_party_user_id_fkey(name, email), party_crew:crew_members!assignments_party_crew_id_fkey(name), party_external:assignment_external_holders!assignments_party_external_id_fkey(holder_name, holder_email)",
    )
    .eq("org_id", session.orgId)
    .eq("catalog_kind", "credential")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);

  type AssignmentRow = {
    id: string;
    title: string | null;
    party_kind: string;
    party_user: { name: string | null; email: string } | null;
    party_crew: { name: string } | null;
    party_external: { holder_name: string | null; holder_email: string | null } | null;
  };
  const assignments = ((assignmentsRaw ?? []) as unknown as AssignmentRow[]).map((a) => ({
    id: a.id,
    title: a.title,
    party_label:
      a.party_user?.name ??
      a.party_user?.email ??
      a.party_crew?.name ??
      a.party_external?.holder_name ??
      a.party_external?.holder_email ??
      "Unknown",
  }));

  const { data: links } = await supabase
    .from("assignment_scan_codes")
    .select("id, assignment_id, kind, code, active, issued_at, voided_at")
    .eq("org_id", session.orgId)
    .order("issued_at", { ascending: false })
    .limit(500);

  const partyLabelById = new Map(assignments.map((a) => [a.id, a.party_label]));
  const titleById = new Map(assignments.map((a) => [a.id, a.title]));

  return (
    <>
      <ModuleHeader
        eyebrow="Credentials"
        title="Asset Linker"
        subtitle="Bind a physical badge / card / QR / wristband to a credential assignment"
      />
      <div className="page-content max-w-4xl space-y-5">
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Bind a New Code</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Each physical token (NFC tag, RFID card, barcode, QR, wristband serial) attaches to exactly one credential
            assignment. Void before re-issuing the same code.
          </p>
          <div className="mt-4">
            <LinkAssetForm assignments={assignments} />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs tracking-[0.18em] text-[var(--text-muted)] uppercase">Active codes</h3>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Holder</th>
                  <th>Assignment</th>
                  <th>Kind</th>
                  <th>Code</th>
                  <th>Issued</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(links ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[var(--text-muted)]">
                      No codes bound yet.
                    </td>
                  </tr>
                ) : (
                  (links ?? []).map((l) => (
                    <tr key={l.id}>
                      <td>{partyLabelById.get(l.assignment_id) ?? "—"}</td>
                      <td className="text-xs">{titleById.get(l.assignment_id) ?? "—"}</td>
                      <td className="text-xs">{toTitle(l.kind)}</td>
                      <td className="font-mono text-xs">{l.code}</td>
                      <td className="font-mono text-xs">{formatDate(l.issued_at)}</td>
                      <td>
                        <Badge variant={l.active ? "success" : "muted"}>{l.active ? "Active" : "Voided"}</Badge>
                      </td>
                      <td>
                        {l.active && (
                          <form action={revokeLinkAction}>
                            <input type="hidden" name="id" value={l.id} />
                            <button type="submit" className="text-xs text-[var(--color-error)] hover:underline">
                              Void
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
