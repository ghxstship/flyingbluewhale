import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  ACCREDITATION_STATE_LABELS,
  ACCREDITATION_STATE_TONES,
  effectiveAccreditationState,
  type AccreditationState,
  type Certification,
  type CertificationHolder,
} from "@/lib/legend_compliance";
import { PrintButton } from "./PrintButton";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * /legend/certifications/[holderId] — the printable certification artifact
 * (audit D-28). A print-clean landscape certificate: holder, credential name
 * + code, issuing course, issue/expiry dates, live state, and the holding id
 * as the verification key (deep-links to the /verify record view).
 *
 * Access follows `certification_holders` RLS: the holder themself, or an
 * org owner/admin/controller. There is intentionally no anonymous public
 * verification — that needs an anon-readable view (migration-scoped).
 */
export default async function CertificateArtifactPage({
  params,
}: {
  params: Promise<{ holderId: string }>;
}) {
  const { holderId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase || !UUID_RE.test(holderId)) notFound();
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: holderRow } = await db
    .from("certification_holders")
    .select(
      "id, org_id, certification_id, user_id, source_course_id, issued_at, expires_on, last_recert_at, next_recert_due, accreditation_state",
    )
    .eq("org_id", session.orgId)
    .eq("id", holderId)
    .maybeSingle();
  if (!holderRow) notFound();
  const holder = holderRow as CertificationHolder;

  const [{ data: certRow }, { data: userRow }, { data: courseRow }, { data: orgRow }] = await Promise.all([
    db.from("legend_certifications").select("*").eq("id", holder.certification_id).maybeSingle(),
    db.from("users").select("id, name, email").eq("id", holder.user_id).maybeSingle(),
    holder.source_course_id
      ? db.from("legend_courses").select("id, title").eq("id", holder.source_course_id).maybeSingle()
      : Promise.resolve({ data: null }),
    db.from("orgs").select("id, name").eq("id", holder.org_id).maybeSingle(),
  ]);
  const cert = certRow as Certification | null;
  const holderName =
    (userRow as { name: string | null; email: string } | null)?.name ??
    (userRow as { email: string } | null)?.email ??
    t("console.legend.certifications.artifact.credentialHolder", undefined, "Credential Holder");
  const courseTitle = (courseRow as { title: string } | null)?.title ?? null;
  const orgName = (orgRow as { name: string } | null)?.name ?? null;

  const eff: AccreditationState = effectiveAccreditationState(holder, cert?.recert_window_days ?? 30, new Date());
  const tone = ACCREDITATION_STATE_TONES[eff];
  const fmt = (d: string | null | undefined) => (d ? d.slice(0, 10) : null);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Chrome — hidden in print. */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/legend/certifications" className="text-sm text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
          {t("console.legend.certifications.artifact.backToWallet", undefined, "Back to wallet")}
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/legend/certifications/${holder.id}/verify`} className="ps-btn ps-btn--secondary">
            {t("console.legend.certifications.verificationRecord", undefined, "Verification record")}
          </Link>
          <PrintButton label={t("console.legend.certifications.artifact.print", undefined, "Print / Save PDF")} />
        </div>
      </div>

      {/* The artifact — print-clean, token-colored. */}
      <article
        className="surface border border-[var(--p-border)] p-10 print:border-0 print:p-0 print:shadow-none"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      >
        <header className="border-b-2 border-[var(--p-accent)] pb-6">
          <div className="eyebrow">
            {t(
              "console.legend.certifications.artifact.masthead",
              { org: orgName ?? "LEG3ND" },
              `${orgName ?? "LEG3ND"} · Certification`,
            )}
          </div>
          <h1 className="hed-2xl mt-2">
            {t("console.legend.certifications.artifact.title", undefined, "Certificate of Achievement")}
          </h1>
        </header>

        <div className="space-y-6 py-8">
          <p className="text-sm text-[var(--p-text-2)]">
            {t("console.legend.certifications.artifact.certifiesThat", undefined, "This certifies that")}
          </p>
          <div className="hed-xl">{holderName}</div>
          <p className="text-sm text-[var(--p-text-2)]">
            {courseTitle
              ? t(
                  "console.legend.certifications.artifact.satisfiedCourse",
                  { course: courseTitle },
                  `has satisfied the requirements of the course "${courseTitle}" and holds the credential`,
                )
              : t(
                  "console.legend.certifications.artifact.satisfied",
                  undefined,
                  "has satisfied the requirements of and holds the credential",
                )}
          </p>
          <div>
            <div className="text-lg font-semibold text-[var(--p-text-1)]">
              {cert?.name ?? t("console.legend.certifications.certification", undefined, "Certification")}
            </div>
            {cert?.code && <div className="mt-1 font-mono text-xs text-[var(--p-text-3)]">{cert.code}</div>}
            {cert?.description && <p className="mt-2 max-w-prose text-sm text-[var(--p-text-2)]">{cert.description}</p>}
          </div>

          <dl className="grid max-w-md grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-[var(--p-text-3)]">{t("console.legend.certifications.issued", undefined, "Issued")}</dt>
            <dd className="font-mono">{fmt(holder.issued_at) ?? "—"}</dd>
            <dt className="text-[var(--p-text-3)]">{t("console.legend.certifications.expires", undefined, "Expires")}</dt>
            <dd className="font-mono">{fmt(holder.expires_on) ?? t("console.legend.certifications.never", undefined, "Never")}</dd>
            {holder.last_recert_at && (
              <>
                <dt className="text-[var(--p-text-3)]">
                  {t("console.legend.certifications.artifact.lastRecertified", undefined, "Last recertified")}
                </dt>
                <dd className="font-mono">{fmt(holder.last_recert_at)}</dd>
              </>
            )}
            <dt className="text-[var(--p-text-3)]">
              {t("console.legend.certifications.artifact.standing", undefined, "Standing")}
            </dt>
            <dd>
              <Badge variant={tone}>{ACCREDITATION_STATE_LABELS[eff]}</Badge>
            </dd>
          </dl>
        </div>

        <footer className="border-t border-[var(--p-border)] pt-4">
          <div className="eyebrow">{t("console.legend.certifications.artifact.verification", undefined, "Verification")}</div>
          <p className="mt-1 font-mono text-xs text-[var(--p-text-2)]">
            {t(
              "console.legend.certifications.artifact.verifyLine",
              { id: holder.id },
              `Certificate ID ${holder.id} · verify at /legend/certifications/${holder.id}/verify`,
            )}
          </p>
        </footer>
      </article>
    </div>
  );
}
