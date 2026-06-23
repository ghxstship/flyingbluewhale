import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { urlFor } from "@/lib/urls";
import { toTitle } from "@/lib/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { PrepareSignatures, type PrepareSigner } from "./PrepareSignatures";

export const dynamic = "force-dynamic";

type SignerRow = {
  id: string;
  signer_role: string | null;
  signer_state: string;
  external_email: string | null;
  signed_name: string | null;
  routing_order: number;
  sign_token: string | null;
};

export default async function EnvelopePreparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const envelope = (await getOrgScoped("contract_envelopes", session.orgId, id)) as { id: string; title?: string | null } | null;
  if (!envelope) notFound();
  const { t } = await getRequestT();

  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("contract_envelope_signers")
    .select("id, signer_role, signer_state, external_email, signed_name, routing_order, sign_token")
    .eq("envelope_id", id)
    .eq("org_id", session.orgId)
    .order("routing_order", { ascending: true });
  const signerRows = (data ?? []) as SignerRow[];

  const signers: PrepareSigner[] = signerRows.map((s) => ({
    id: s.id,
    label: s.signed_name || s.external_email || (s.signer_role ? toTitle(s.signer_role) : `Signer ${s.routing_order}`),
    role: s.signer_role,
    signerState: s.signer_state,
    signedName: s.signed_name,
    signUrl: s.sign_token ? urlFor("marketing", `/sign/${s.sign_token}`) : null,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.envelopes.prepare.eyebrow", undefined, "E-Sign")}
        title={t("console.envelopes.prepare.title", undefined, "Prepare for signing")}
        breadcrumbs={[
          { label: "E-Sign Envelopes", href: "/studio/envelopes" },
          { label: "Prepare" },
        ]}
        action={<Button href={`/studio/envelopes/${id}`} variant="secondary">{t("console.envelopes.prepare.back", undefined, "Back to envelope")}</Button>}
      />
      <div className="page-content">
        {signers.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("console.envelopes.prepare.noSigners", undefined, "Add signers to this envelope before preparing it for signing.")}
          </div>
        ) : (
          <PrepareSignatures
            envelopeId={id}
            signers={signers}
            labels={{
              applyHeading: t("console.envelopes.prepare.applyHeading", undefined, "Apply a signature"),
              signerSelect: t("console.envelopes.prepare.signerSelect", undefined, "Sign as"),
              nameLabel: t("console.envelopes.prepare.nameLabel", undefined, "Full name"),
              titleLabel: t("console.envelopes.prepare.titleLabel", undefined, "Title"),
              drawLabel: t("console.envelopes.prepare.drawLabel", undefined, "Draw signature"),
              clear: t("console.envelopes.prepare.clear", undefined, "Clear"),
              apply: t("console.envelopes.prepare.apply", undefined, "Apply signature"),
              applying: t("console.envelopes.prepare.applying", undefined, "Saving…"),
              applied: t("console.envelopes.prepare.applied", undefined, "Signature applied"),
              error: t("console.envelopes.prepare.error", undefined, "Could not save signature"),
              noSignature: t("console.envelopes.prepare.noSignature", undefined, "Draw a signature to enable Apply"),
              linksHeading: t("console.envelopes.prepare.linksHeading", undefined, "Public signing links"),
              createLink: t("console.envelopes.prepare.createLink", undefined, "Create link"),
              copyHint: t("console.envelopes.prepare.copyHint", undefined, "Share a link with each external signer. They sign at /sign without an account."),
              signed: t("console.envelopes.prepare.signed", undefined, "Signed"),
            }}
          />
        )}
      </div>
    </>
  );
}
