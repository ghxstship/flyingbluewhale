import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
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

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * /legend/certifications/[holderId]/verify — the verification record for a
 * certification holding (audit D-28): who holds it, which credential and
 * course, issue/expiry dates, and the LIVE effective state (computed from
 * the recert window at request time, so a lapsed cert reads as lapsed).
 *
 * Auth-scoped: `certification_holders` RLS admits the holder themself or an
 * org owner/admin/controller. Anonymous public verification needs an
 * anon-readable view (migration-scoped) and is intentionally not faked here.
 */
export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ holderId: string }>;
}) {
  const { holderId } = await params;
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

  const [{ data: certRow }, { data: userRow }, { data: courseRow }] = await Promise.all([
    db.from("legend_certifications").select("*").eq("id", holder.certification_id).maybeSingle(),
    db.from("users").select("id, name, email").eq("id", holder.user_id).maybeSingle(),
    holder.source_course_id
      ? db.from("legend_courses").select("id, title").eq("id", holder.source_course_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const cert = certRow as Certification | null;
  const user = userRow as { name: string | null; email: string } | null;
  const courseTitle = (courseRow as { title: string } | null)?.title ?? null;

  const eff: AccreditationState = effectiveAccreditationState(holder, cert?.recert_window_days ?? 30, new Date());
  const tone = ACCREDITATION_STATE_TONES[eff];
  const valid = eff === "valid" || eff === "expiring";
  const fmt = (d: string | null | undefined) => (d ? d.slice(0, 10) : "—");

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND · Verification"
        title="Certification Record"
        subtitle="Live standing, computed at the time you loaded this page."
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
              ? "This certification holding is in good standing."
              : "This certification holding is not currently in good standing."}
          </span>
        </div>

        <div className="surface p-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-[var(--p-text-3)]">Holder</dt>
            <dd className="font-medium">{user?.name ?? user?.email ?? "Credential Holder"}</dd>
            <dt className="text-[var(--p-text-3)]">Credential</dt>
            <dd className="font-medium">
              {cert?.name ?? "Certification"}
              {cert?.code && <span className="ms-2 font-mono text-xs text-[var(--p-text-3)]">{cert.code}</span>}
            </dd>
            {courseTitle && (
              <>
                <dt className="text-[var(--p-text-3)]">Course</dt>
                <dd>{courseTitle}</dd>
              </>
            )}
            <dt className="text-[var(--p-text-3)]">Issued</dt>
            <dd className="font-mono text-xs">{fmt(holder.issued_at)}</dd>
            <dt className="text-[var(--p-text-3)]">Expires</dt>
            <dd className="font-mono text-xs">{holder.expires_on ? fmt(holder.expires_on) : "Never"}</dd>
            {holder.next_recert_due && (
              <>
                <dt className="text-[var(--p-text-3)]">Recert due</dt>
                <dd className="font-mono text-xs">{fmt(holder.next_recert_due)}</dd>
              </>
            )}
            <dt className="text-[var(--p-text-3)]">Record ID</dt>
            <dd className="font-mono text-xs">{holder.id}</dd>
          </dl>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Link href={`/legend/certifications/${holder.id}`} className="ps-btn ps-btn--secondary">
            View certificate
          </Link>
          <Link href="/legend/certifications" className="text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
            Back to wallet
          </Link>
        </div>
      </div>
    </>
  );
}
