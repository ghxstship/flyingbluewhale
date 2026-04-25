import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { addDomainAction, verifyDomainAction, deleteDomainAction } from "./actions";
import { AddDomainForm } from "./AddDomainForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Domains" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_domains")
    .select("id, hostname, purpose, verification_token, verified_at, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });
  const domains = data ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Workspace settings"
        subtitle="Custom domains"
      />
      <div className="page-content max-w-3xl space-y-5">
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Add a domain</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Point a CNAME or TXT verification to your DNS provider. We re-check
            on demand and issue TLS automatically once verified.
          </p>
          <div className="mt-4">
            <AddDomainForm />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Domains
          </h3>
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Verification record</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {domains.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                      No custom domains yet.
                    </td>
                  </tr>
                ) : (
                  domains.map((d) => (
                    <tr key={d.id}>
                      <td className="font-mono text-xs">{d.hostname}</td>
                      <td className="text-xs text-[var(--text-secondary)] capitalize">{d.purpose}</td>
                      <td>
                        <Badge variant={d.verified_at ? "success" : "muted"}>
                          {d.verified_at ? "Verified" : "Pending"}
                        </Badge>
                      </td>
                      <td className="font-mono text-[10px] text-[var(--text-muted)]">
                        TXT _atlvs-verify.{d.hostname} = {d.verification_token}
                      </td>
                      <td className="space-x-2 whitespace-nowrap">
                        {!d.verified_at && (
                          <form action={verifyDomainAction} className="inline">
                            <input type="hidden" name="id" value={d.id} />
                            <button type="submit" className="text-xs text-[var(--org-primary)] hover:underline">
                              Verify
                            </button>
                          </form>
                        )}
                        <form action={deleteDomainAction} className="inline">
                          <input type="hidden" name="id" value={d.id} />
                          <button type="submit" className="text-xs text-[var(--color-error)] hover:underline">
                            Remove
                          </button>
                        </form>
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
