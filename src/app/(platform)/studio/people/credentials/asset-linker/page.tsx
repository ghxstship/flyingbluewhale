import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { revokeLinkAction } from "./actions";
import { LinkAssetForm } from "./LinkAssetForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function AssetLinkerPage() {
  const { t } = await getRequestT();
  const i18nFmt = await getRequestFormatters();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.people.credentials.assetLinker.eyebrow", undefined, "Credentials")}
          title={t("console.people.credentials.assetLinker.title", undefined, "Asset Linker")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.people.credentials.assetLinker.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
      t("console.people.credentials.assetLinker.unknown", undefined, "Unknown"),
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
        eyebrow={t("console.people.credentials.assetLinker.eyebrow", undefined, "Credentials")}
        title={t("console.people.credentials.assetLinker.title", undefined, "Asset Linker")}
        subtitle={t(
          "console.people.credentials.assetLinker.subtitle",
          undefined,
          "Bind a physical badge / card / QR / wristband to a credential assignment",
        )}
      />
      <div className="page-content max-w-4xl space-y-5">
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("console.people.credentials.assetLinker.bindNewCode", undefined, "Bind a New Code")}
          </h3>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.people.credentials.assetLinker.bindNewCodeDescription",
              undefined,
              "Each physical token (NFC tag, RFID card, barcode, QR, wristband serial) attaches to exactly one credential assignment. Void before re-issuing the same code.",
            )}
          </p>
          <div className="mt-4">
            <LinkAssetForm assignments={assignments} />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs tracking-[0.18em] text-[var(--p-text-2)] uppercase">
            {t("console.people.credentials.assetLinker.activeCodes", undefined, "Active codes")}
          </h3>
          <div className="overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.people.credentials.assetLinker.col.holder", undefined, "Holder")}</th>
                  <th>{t("console.people.credentials.assetLinker.col.assignment", undefined, "Assignment")}</th>
                  <th>{t("console.people.credentials.assetLinker.col.kind", undefined, "Kind")}</th>
                  <th>{t("console.people.credentials.assetLinker.col.code", undefined, "Code")}</th>
                  <th>{t("console.people.credentials.assetLinker.col.issued", undefined, "Issued")}</th>
                  <th>{t("console.people.credentials.assetLinker.col.status", undefined, "Status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(links ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[var(--p-text-2)]">
                      {t("console.people.credentials.assetLinker.noCodesBound", undefined, "No codes bound yet.")}
                    </td>
                  </tr>
                ) : (
                  (links ?? []).map((l) => (
                    <tr key={l.id}>
                      <td>{partyLabelById.get(l.assignment_id) ?? "—"}</td>
                      <td className="text-xs">{titleById.get(l.assignment_id) ?? "—"}</td>
                      <td className="text-xs">{toTitle(l.kind)}</td>
                      <td className="font-mono text-xs">{l.code}</td>
                      <td className="font-mono text-xs">{i18nFmt.date(new Date(l.issued_at))}</td>
                      <td>
                        <Badge variant={l.active ? "success" : "muted"}>
                          {l.active
                            ? t("console.people.credentials.assetLinker.statusActive", undefined, "Active")
                            : t("console.people.credentials.assetLinker.statusVoided", undefined, "Voided")}
                        </Badge>
                      </td>
                      <td>
                        {l.active && (
                          <form action={revokeLinkAction}>
                            <input type="hidden" name="id" value={l.id} />
                            <button type="submit" className="text-xs text-[var(--p-danger)] hover:underline">
                              {t("console.people.credentials.assetLinker.void", undefined, "Void")}
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
