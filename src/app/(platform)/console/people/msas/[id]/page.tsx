import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MSADocument } from "@/components/msa/MSADocument";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getMsa } from "@/lib/msa/queries";
import { MSA_STATUS_LABEL, MSA_STATUS_VARIANT } from "@/lib/msa/types";
import { msaPublicUrl } from "@/lib/msa/format";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function MsaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) notFound();
  const { id } = await params;
  const session = await requireSession();
  const fmtIntl = await getRequestFormatters();
  const result = await getMsa(session.orgId, id);
  if (!result) notFound();
  const { resolved } = result;
  const url = msaPublicUrl(resolved.public_token);

  return (
    <>
      <ModuleHeader
        eyebrow="People · MSAs"
        title={`MSA · ${resolved.crew_member_name}`}
        subtitle={resolved.crew_member_role ?? "—"}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={MSA_STATUS_VARIANT[resolved.msa_status]}>{MSA_STATUS_LABEL[resolved.msa_status]}</Badge>
            <Link
              href="/console/people/msas"
              className="rounded border border-[var(--border-default)] px-3 py-1.5 text-xs hover:border-[var(--org-primary)] hover:text-[var(--org-primary)]"
            >
              ← All MSAs
            </Link>
          </div>
        }
      />
      <div className="page-content space-y-6">
        <section className="surface space-y-3 p-6">
          <h3 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Signer Link</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Copy these into an email or message to the contractor. They open the link, enter the access code, and sign.
          </p>
          <div className="space-y-2">
            <div>
              <div className="text-xs tracking-wider text-[var(--text-muted)] uppercase">Public Link</div>
              <a className="font-mono text-sm text-[var(--org-primary)] hover:underline" href={url}>
                {url}
              </a>
            </div>
            <div>
              <div className="text-xs tracking-wider text-[var(--text-muted)] uppercase">Access Code</div>
              <div className="font-mono text-2xl tracking-[0.4em]">{resolved.access_code}</div>
            </div>
            <div className="flex gap-2 pt-2">
              <Link
                href={`/msa/${resolved.public_token}`}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-[var(--border-default)] px-3 py-1.5 text-xs hover:border-[var(--org-primary)] hover:text-[var(--org-primary)]"
              >
                Preview as signer ↗
              </Link>
              <Link
                href={`/msa/${resolved.public_token}/print`}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-[var(--border-default)] px-3 py-1.5 text-xs hover:border-[var(--org-primary)] hover:text-[var(--org-primary)]"
              >
                Print / PDF ↗
              </Link>
            </div>
          </div>
        </section>

        {resolved.msa_status === "signed" && (
          <section className="surface space-y-2 p-6">
            <h3 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Signature</h3>
            <div className="font-subdisplay text-2xl">{resolved.signed_signature}</div>
            <div className="text-xs text-[var(--text-muted)]">
              {resolved.signed_at ? fmtIntl.dateTime(resolved.signed_at) : ""} · IP {resolved.signed_ip ?? "—"}
            </div>
          </section>
        )}

        <section className="surface p-6">
          <MSADocument msa={resolved} orgName={resolved.org_name} />
        </section>
      </div>
    </>
  );
}
