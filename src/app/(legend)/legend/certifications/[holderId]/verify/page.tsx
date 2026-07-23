import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  ACCREDITATION_STATE_LABELS,
  ACCREDITATION_STATE_TONES,
  effectiveAccreditationState,
  type AccreditationState,
  type CertificationHolder,
} from "@/lib/legend_compliance";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type VerificationRecord = {
  holder_id: string;
  holder_name: string | null;
  certification_name: string;
  certification_code: string | null;
  recert_window_days: number;
  course_title: string | null;
  org_name: string;
  issued_at: string | null;
  expires_on: string | null;
  last_recert_at: string | null;
  next_recert_due: string | null;
  accreditation_state: string;
};

/**
 * /legend/certifications/[holderId]/verify — the verification record for a
 * certification holding (audit D-28): who holds it, which credential and
 * course, issue/expiry dates, and the LIVE effective state (computed from
 * the recert window at request time, so a lapsed cert reads as lapsed).
 *
 * Anonymously verifiable: resolves through the `verify_certification`
 * SECURITY DEFINER RPC (migration 20260710230920), which answers only a
 * known holder uuid — the QR/link printed on the certificate artifact —
 * and exposes paper-certificate columns only (display name, never email).
 */
export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ holderId: string }>;
}) {
  const { holderId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase || !UUID_RE.test(holderId)) notFound();
  const session = await getSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data } = await db.rpc("verify_certification", { p_holder_id: holderId });
  const record = (Array.isArray(data) ? data[0] : data) as VerificationRecord | undefined;
  if (!record) notFound();

  const holderShape = {
    issued_at: record.issued_at,
    expires_on: record.expires_on,
    last_recert_at: record.last_recert_at,
    next_recert_due: record.next_recert_due,
    accreditation_state: record.accreditation_state,
  } as CertificationHolder;
  const eff: AccreditationState = effectiveAccreditationState(
    holderShape,
    record.recert_window_days ?? 30,
    new Date(),
  );
  const tone = ACCREDITATION_STATE_TONES[eff];
  const valid = eff === "valid" || eff === "expiring";
  const fmt = (d: string | null | undefined) => (d ? d.slice(0, 10) : "—");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.certifications.verify.eyebrow", undefined, "LEG3ND · Verification")}
        title={t("console.legend.certifications.verify.title", undefined, "Certification Record")}
        subtitle={t(
          "console.legend.certifications.verify.subtitle",
          undefined,
          "Live standing, computed at the time you loaded this page.",
        )}
      />
      <div className="mx-auto max-w-xl space-y-4">
        <div
          className={`surface flex items-center gap-3 border-s-4 p-4 ${
            valid ? "border-s-[var(--p-success)]" : "border-s-[var(--p-danger)]"
          }`}
          role="status"
        >
          <Badge variant={tone}>{ACCREDITATION_STATE_LABELS[eff]}</Badge>
          <span className="text-sm text-[var(--p-text-2)]">
            {valid
              ? t(
                  "console.legend.certifications.verify.goodStanding",
                  undefined,
                  "This certification holding is in good standing.",
                )
              : t(
                  "console.legend.certifications.verify.notGoodStanding",
                  undefined,
                  "This certification holding is not currently in good standing.",
                )}
          </span>
        </div>

        <div className="surface p-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-[var(--p-text-3)]">{t("console.legend.certifications.verify.holder", undefined, "Holder")}</dt>
            <dd className="font-medium">
              {record.holder_name ??
                t("console.legend.certifications.artifact.credentialHolder", undefined, "Credential Holder")}
            </dd>
            <dt className="text-[var(--p-text-3)]">
              {t("console.legend.certifications.verify.credential", undefined, "Credential")}
            </dt>
            <dd className="font-medium">
              {record.certification_name}
              {record.certification_code && (
                <span className="ms-2 font-mono text-xs text-[var(--p-text-3)]">{record.certification_code}</span>
              )}
            </dd>
            <dt className="text-[var(--p-text-3)]">
              {t("console.legend.certifications.verify.issuedBy", undefined, "Issued by")}
            </dt>
            <dd>{record.org_name}</dd>
            {record.course_title && (
              <>
                <dt className="text-[var(--p-text-3)]">
                  {t("console.legend.certifications.verify.course", undefined, "Course")}
                </dt>
                <dd>{record.course_title}</dd>
              </>
            )}
            <dt className="text-[var(--p-text-3)]">{t("console.legend.certifications.issued", undefined, "Issued")}</dt>
            <dd className="font-mono text-xs">{fmt(record.issued_at)}</dd>
            <dt className="text-[var(--p-text-3)]">{t("console.legend.certifications.expires", undefined, "Expires")}</dt>
            <dd className="font-mono text-xs">
              {record.expires_on ? fmt(record.expires_on) : t("console.legend.certifications.never", undefined, "Never")}
            </dd>
            {record.next_recert_due && (
              <>
                <dt className="text-[var(--p-text-3)]">
                  {t("console.legend.certifications.recertDue", undefined, "Recert due")}
                </dt>
                <dd className="font-mono text-xs">{fmt(record.next_recert_due)}</dd>
              </>
            )}
            <dt className="text-[var(--p-text-3)]">
              {t("console.legend.certifications.verify.recordId", undefined, "Record ID")}
            </dt>
            <dd className="font-mono text-xs">{record.holder_id}</dd>
          </dl>
        </div>

        {session ? (
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/legend/certifications/${record.holder_id}`} className="ps-btn ps-btn--secondary">
              {t("console.legend.certifications.viewCertificate", undefined, "View certificate")}
            </Link>
            <Link href="/legend/certifications" className="text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
              {t("console.legend.certifications.artifact.backToWallet", undefined, "Back to wallet")}
            </Link>
          </div>
        ) : (
          <p className="text-xs text-[var(--p-text-3)]">
            {t(
              "console.legend.certifications.verify.anonNote",
              undefined,
              "Verified against the issuing workspace at the time this page loaded.",
            )}
          </p>
        )}
      </div>
    </>
  );
}
