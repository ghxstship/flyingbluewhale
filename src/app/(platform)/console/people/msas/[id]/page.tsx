import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MSADocument } from "@/components/msa/MSADocument";
import { LdpStateTimeline } from "@/components/ldp/LdpStateTimeline";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { getMsa } from "@/lib/msa/queries";
import { MSA_STATUS_LABEL, MSA_STATUS_VARIANT } from "@/lib/msa/types";
import { msaPublicUrl } from "@/lib/msa/format";

export const dynamic = "force-dynamic";

export default async function MsaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) notFound();
  const { id } = await params;
  const session = await requireSession();
  const result = await getMsa(session.orgId, id);
  if (!result) notFound();
  const { resolved } = result;
  const url = msaPublicUrl(resolved.public_token);
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.msas.detail.eyebrow", undefined, "People · MSAs")}
        title={t(
          "console.people.msas.detail.title",
          { name: resolved.crew_member_name },
          `MSA · ${resolved.crew_member_name}`,
        )}
        subtitle={resolved.crew_member_role ?? "—"}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={MSA_STATUS_VARIANT[resolved.msa_state]}>{MSA_STATUS_LABEL[resolved.msa_state]}</Badge>
            <Button href="/console/people/msas" size="sm" variant="secondary">
              {t("console.people.msas.detail.allMsas", undefined, "← All MSAs")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-6">
        <section className="surface space-y-3 p-6">
          <h3 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            {t("console.people.msas.detail.signerLink", undefined, "Signer Link")}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            {t(
              "console.people.msas.detail.signerLinkHint",
              undefined,
              "Copy these into an email or message to the contractor. They open the link, enter the access code, and sign.",
            )}
          </p>
          <div className="space-y-2">
            <div>
              <div className="text-xs tracking-wider text-[var(--text-muted)] uppercase">
                {t("console.people.msas.detail.publicLink", undefined, "Public Link")}
              </div>
              <a className="font-mono text-sm text-[var(--org-primary)] hover:underline" href={url}>
                {url}
              </a>
            </div>
            <div>
              <div className="text-xs tracking-wider text-[var(--text-muted)] uppercase">
                {t("console.people.msas.detail.accessCode", undefined, "Access Code")}
              </div>
              <div className="font-mono text-2xl tracking-[0.4em]">{resolved.access_code}</div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                href={`/msa/${resolved.public_token}`}
                target="_blank"
                rel="noreferrer"
                size="sm"
                variant="secondary"
              >
                {t("console.people.msas.detail.previewAsSigner", undefined, "Preview As Signer ↗")}
              </Button>
              <Button
                href={`/msa/${resolved.public_token}/print`}
                target="_blank"
                rel="noreferrer"
                size="sm"
                variant="secondary"
              >
                {t("console.people.msas.detail.printPdf", undefined, "Print / PDF ↗")}
              </Button>
            </div>
          </div>
        </section>

        {resolved.msa_state === "signed" && (
          <section className="surface space-y-2 p-6">
            <h3 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
              {t("console.people.msas.detail.signature", undefined, "Signature")}
            </h3>
            <div className="font-subdisplay text-2xl">{resolved.signed_signature}</div>
            <div className="text-xs text-[var(--text-muted)]">
              {resolved.signed_at ? new Date(resolved.signed_at).toLocaleString() : ""} ·{" "}
              {t(
                "console.people.msas.detail.ipLabel",
                { ip: resolved.signed_ip ?? "—" },
                `IP ${resolved.signed_ip ?? "—"}`,
              )}
            </div>
          </section>
        )}

        <LdpStateTimeline
          table="msa_state_transitions"
          parentColumn="msa_id"
          parentId={id}
          orgId={session.orgId}
          heading={t("console.people.msas.detail.lifecycleHeading", undefined, "MSA Lifecycle")}
          subhead={t(
            "console.people.msas.detail.lifecycleSubhead",
            undefined,
            "Append-only ledger of state transitions on this MSA.",
          )}
        />

        <section className="surface p-6">
          <MSADocument msa={resolved} orgName={resolved.org_name} />
        </section>
      </div>
    </>
  );
}
