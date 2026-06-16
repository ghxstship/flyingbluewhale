import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";
import { EnvelopeStateControls } from "./EnvelopeStateControls";
import { deleteEnvelopeAction } from "../actions";

export const dynamic = "force-dynamic";

type SignerRow = {
  id: string;
  signer_role: string | null;
  signer_state: string;
  external_email: string | null;
  signed_name: string | null;
  signed_title: string | null;
  signed_at: string | null;
  routing_order: number;
};

const TARGET_LABEL: Record<string, string> = {
  proposal: "Proposal",
  offer_letter: "Offer Letter",
  msa: "MSA",
  prime_contract: "Prime Contract",
  sub_contract: "Sub Contract",
  change_order: "Change Order",
  lien_waiver: "Lien Waiver",
  nda: "NDA",
  other: "Other",
};

export default async function EnvelopeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const env = await getOrgScoped("contract_envelopes", session.orgId, id);
  if (!env) notFound();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data: signersData } = await supabase
    .from("contract_envelope_signers")
    .select("id, signer_role, signer_state, external_email, signed_name, signed_title, signed_at, routing_order")
    .eq("envelope_id", id)
    .eq("org_id", session.orgId)
    .order("routing_order", { ascending: true });
  const signers = (signersData ?? []) as unknown as SignerRow[];
  const signedCount = signers.filter((s) => s.signer_state === "signed").length;

  const fmtDate = (d: string | null) =>
    d ? fmt.dateParts(d, { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.envelopes.eyebrow", undefined, "Legal")}
        title={env.subject}
        subtitle={`${TARGET_LABEL[env.target_type] ?? env.target_type} · ${toTitle(env.provider.replace(/_/g, " "))}`}
        breadcrumbs={[
          { label: t("console.envelopes.title", undefined, "E-Sign Envelopes"), href: "/console/envelopes" },
          { label: env.subject },
        ]}
        action={
          <div className="flex items-center gap-2">
            <EnvelopeStateControls id={env.id} state={env.envelope_state} />
            <DeleteForm
              action={deleteEnvelopeAction.bind(null, env.id)}
              confirm={t(
                "console.envelopes.deleteConfirm",
                { subject: env.subject },
                `Delete envelope "${env.subject}"?`,
              )}
              undo={{ table: "contract_envelopes", id: env.id, redirectTo: "/console/envelopes" }}
            />
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label={t("console.envelopes.column.state", undefined, "State")}>
            <Badge variant={toneFor(env.envelope_state)}>{toTitle(env.envelope_state)}</Badge>
          </Field>
          <Field label={t("console.envelopes.column.provider", undefined, "Provider")}>
            {toTitle(env.provider.replace(/_/g, " "))}
          </Field>
          <Field label={t("console.envelopes.column.target", undefined, "Target")}>
            {TARGET_LABEL[env.target_type] ?? env.target_type}
          </Field>
          <Field label={t("console.envelopes.detail.targetId", undefined, "Target ID")} mono>
            {env.target_id}
          </Field>
          <Field label={t("console.envelopes.column.signers", undefined, "Signers")} mono>
            {`${signedCount} / ${signers.length}`}
          </Field>
          <Field label={t("console.envelopes.column.sent", undefined, "Sent")} mono>
            {fmtDate(env.sent_at)}
          </Field>
          <Field label={t("console.envelopes.detail.completed", undefined, "Completed")} mono>
            {fmtDate(env.completed_at)}
          </Field>
          <Field label={t("console.envelopes.detail.expires", undefined, "Expires")} mono>
            {fmtDate(env.expires_at)}
          </Field>
          <Field label={t("console.envelopes.detail.providerRef", undefined, "Provider Ref")} mono>
            {env.provider_envelope_id ?? "—"}
          </Field>
        </div>

        <div className="surface p-5">
          <h3 className="text-base font-semibold">{t("console.envelopes.detail.signersTitle", undefined, "Signers")}</h3>
          {signers.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--p-text-2)]">
              {t("console.envelopes.detail.noSigners", undefined, "No signers recorded yet.")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {signers.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{s.signed_name ?? s.external_email ?? "—"}</div>
                    <div className="text-xs text-[var(--p-text-2)]">
                      {[s.signer_role, s.signed_title].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[var(--p-text-2)]">{fmtDate(s.signed_at)}</span>
                    <Badge variant={toneFor(s.signer_state)}>{toTitle(s.signer_state)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {env.body_md && (
          <div className="surface p-5">
            <h3 className="text-base font-semibold">{t("console.envelopes.detail.body", undefined, "Body")}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{env.body_md}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono break-all" : ""}`}>{children}</div>
    </div>
  );
}
