import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { revokeLinkAction } from "./actions";
import { LinkAssetForm } from "./LinkAssetForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AssetLinkerPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Credentials" title="Asset linker" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: links }, { data: credentials }] = await Promise.all([
    supabase
      .from("asset_links")
      .select("id, credential_id, asset_kind, asset_serial, issued_at, revoked_at, credentials(kind, number, crew_members(name))")
      .eq("org_id", session.orgId)
      .order("issued_at", { ascending: false }),
    supabase
      .from("credentials")
      .select("id, kind, number, crew_members(name)")
      .eq("org_id", session.orgId)
      .order("kind", { ascending: true }),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow="Credentials"
        title="Asset linker"
        subtitle="Bind a credential to its physical badge / card / QR"
      />
      <div className="page-content max-w-4xl space-y-5">
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Link a new asset</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Each physical token (NFC tag, RFID card, barcode, QR) attaches to
            exactly one credential. Revoke before re-issuing.
          </p>
          <div className="mt-4">
            <LinkAssetForm credentials={credentials ?? []} />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Active links
          </h3>
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Holder</th>
                  <th>Credential</th>
                  <th>Asset</th>
                  <th>Serial</th>
                  <th>Issued</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(links ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[var(--text-muted)]">
                      No assets linked yet.
                    </td>
                  </tr>
                ) : (
                  (links ?? []).map((l) => {
                    const cred = l.credentials as
                      | { kind?: string; number?: string; crew_members?: { name?: string } | null }
                      | null;
                    return (
                      <tr key={l.id}>
                        <td>{cred?.crew_members?.name ?? "—"}</td>
                        <td className="text-xs">
                          {cred?.kind ?? "—"}
                          {cred?.number ? ` · ${cred.number}` : ""}
                        </td>
                        <td className="text-xs capitalize">{l.asset_kind.replace("_", " ")}</td>
                        <td className="font-mono text-xs">{l.asset_serial}</td>
                        <td className="font-mono text-xs">
                          {new Date(l.issued_at).toLocaleDateString()}
                        </td>
                        <td>
                          <Badge variant={l.revoked_at ? "muted" : "success"}>
                            {l.revoked_at ? "Revoked" : "Active"}
                          </Badge>
                        </td>
                        <td>
                          {!l.revoked_at && (
                            <form action={revokeLinkAction}>
                              <input type="hidden" name="id" value={l.id} />
                              <button
                                type="submit"
                                className="text-xs text-[var(--color-error)] hover:underline"
                              >
                                Revoke
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
