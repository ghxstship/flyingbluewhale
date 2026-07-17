import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import {
  getOfferLetter,
  listOfferLetterActivity,
  listCrewMembers,
  listOrgRoles,
  listVenues,
  listRateCardItems,
} from "@/lib/offer-letters/queries";
import { formatCompensation, formatDateRange, offerPublicUrl } from "@/lib/offer-letters/format";
import { getActiveMsaForCrew } from "@/lib/msa/queries";
import { msaPublicUrl } from "@/lib/msa/format";
import {
  STATUS_LABEL,
  STATUS_VARIANT,
  EMPLOYER_LABEL,
  CLASSIFICATION_LABEL,
  BASIS_LABEL,
} from "@/lib/offer-letters/types";
import { LetterDocument } from "@/components/offer-letters/LetterDocument";
import { LetterEditor } from "./LetterEditor";
import { LetterShareCard } from "./LetterShareCard";
import { LetterLifecycleActions } from "./LetterLifecycleActions";
import { LetterEmailComposer } from "./LetterEmailComposer";
import { composeOfferLetterEmail } from "@/lib/offer-letters/compose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) notFound();
  const session = await requireSession();

  const data = await getOfferLetter(session.orgId, id);
  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  if (!data) notFound();
  const { raw, resolved } = data;
  const activeMsa = await getActiveMsaForCrew(raw.crew_member_id);
  const msaSignerUrl = activeMsa ? msaPublicUrl(activeMsa.public_token) : null;

  // Letter renders from snapshot if frozen (immutable contract), else from the
  // resolved view. Either way, lifecycle fields (status / accepted / declined /
  // viewed) come from the live row so post-send activity reflects correctly.
  const renderable = raw.snapshot
    ? {
        ...raw.snapshot,
        status: raw.status,
        sent_at: raw.sent_at,
        first_viewed_at: raw.first_viewed_at,
        last_viewed_at: raw.last_viewed_at,
        view_count: raw.view_count,
        accepted_at: raw.accepted_at,
        accepted_signature: raw.accepted_signature,
        accepted_ip: raw.accepted_ip,
        accepted_user_agent: raw.accepted_user_agent,
        declined_at: raw.declined_at,
        decline_reason: raw.decline_reason,
        withdrawn_at: raw.withdrawn_at,
        updated_at: raw.updated_at,
      }
    : resolved;

  const [activity, crew, roles, venues, rates] = await Promise.all([
    listOfferLetterActivity(session.orgId, raw.id),
    listCrewMembers(session.orgId),
    listOrgRoles(session.orgId),
    listVenues(session.orgId, raw.project_id),
    listRateCardItems(session.orgId),
  ]);

  const publicUrl = offerPublicUrl(raw.public_token);
  const email = composeOfferLetterEmail(resolved, {
    signed: !!activeMsa,
    signerUrl: msaSignerUrl,
    signedAt: activeMsa?.signed_at ?? null,
    version: activeMsa?.version ?? null,
  });
  const printUrl = `/offer/${raw.public_token}/print`;

  return (
    <>
      <ModuleHeader
        eyebrow={
          <Link href="/studio/people/offer-letters" className="hover:text-[var(--p-accent)]">
            {t("console.people.offerLetters.detail.eyebrow", undefined, "People · Offer Letters")}
          </Link>
        }
        title={resolved.recipient_name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2 text-xs text-[var(--p-text-2)]">
            <Badge variant={STATUS_VARIANT[raw.status]}>{STATUS_LABEL[raw.status]}</Badge>
            <span>{resolved.role_title}</span>
            <span>·</span>
            <span>{EMPLOYER_LABEL[raw.employer]}</span>
            <span>·</span>
            <span>{CLASSIFICATION_LABEL[raw.classification]}</span>
            <span>·</span>
            <span>{BASIS_LABEL[raw.compensation_basis]}</span>
          </span>
        }
      />
      <div className="page-content space-y-8">
        {/* Kit 30 — engagement status track: Draft → Sent → Accepted with the
            dates each stage was reached. Declined / withdrawn / expired stay
            on the header badge; the track shows how far the letter got. */}
        <div className="surface flex flex-wrap items-center gap-2 px-4 py-3">
          {(
            [
              {
                key: "draft",
                label: t("console.people.offerLetters.detail.track.draft", undefined, "Draft"),
                at: raw.created_at,
                reached: true,
              },
              {
                key: "sent",
                label: t("console.people.offerLetters.detail.track.sent", undefined, "Sent"),
                at: raw.sent_at,
                reached: !!raw.sent_at,
              },
              {
                key: "accepted",
                label: t("console.people.offerLetters.detail.track.accepted", undefined, "Accepted"),
                at: raw.accepted_at,
                reached: !!raw.accepted_at,
              },
            ] as const
          ).map((step, i, steps) => {
            const nextReached = steps[i + 1]?.reached ?? false;
            const variant = step.reached ? (nextReached ? "success" : "brand") : "muted";
            return (
              <Badge key={step.key} variant={variant}>
                {step.reached && step.at ? `${step.label} · ${fmt.date(step.at)}` : step.label}
              </Badge>
            );
          })}
        </div>

        {/* Kit 30 — Terms / Signature two-card layout. */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="surface space-y-3 p-5">
            <h3 className="text-sm font-semibold tracking-wider uppercase">
              {t("console.people.offerLetters.detail.termsCard", undefined, "Terms")}
            </h3>
            <DefRow k={t("console.people.offerLetters.detail.termsRole", undefined, "Role")} v={resolved.role_title} />
            <DefRow
              k={t("console.people.offerLetters.detail.termsDates", undefined, "Contract Dates")}
              v={formatDateRange(resolved.effective_onsite_start, resolved.effective_onsite_end)}
            />
            <DefRow
              k={t("console.people.offerLetters.detail.termsCompensation", undefined, "Compensation")}
              v={formatCompensation(resolved)}
            />
            <DefRow
              k={t("console.people.offerLetters.detail.termsPayment", undefined, "Payment")}
              v={resolved.effective_payment_schedule}
            />
          </section>
          <section className="surface space-y-3 p-5">
            <h3 className="text-sm font-semibold tracking-wider uppercase">
              {t("console.people.offerLetters.detail.signatureCard", undefined, "Signature & Acceptance")}
            </h3>
            <div className="flex items-baseline gap-3 text-xs">
              <div className="w-32 shrink-0 tracking-wider text-[var(--p-text-2)] uppercase">
                {t("console.people.offerLetters.detail.signatureStatus", undefined, "Status")}
              </div>
              <Badge variant={raw.accepted_at ? "success" : STATUS_VARIANT[raw.status]}>
                {raw.accepted_at
                  ? t("console.people.offerLetters.detail.signatureSigned", undefined, "Signed")
                  : STATUS_LABEL[raw.status]}
              </Badge>
            </div>
            <DefRow
              k={t("console.people.offerLetters.detail.signatureWhen", undefined, "Signed")}
              v={raw.accepted_at ? fmt.dateTime(raw.accepted_at) : "—"}
            />
            <DefRow
              k={t("console.people.offerLetters.detail.signatureBy", undefined, "Signature")}
              v={raw.accepted_signature ?? "—"}
            />
            <div className="flex items-baseline gap-3 text-xs">
              <div className="w-32 shrink-0 tracking-wider text-[var(--p-text-2)] uppercase">
                {t("console.people.offerLetters.detail.signatureDocument", undefined, "Document")}
              </div>
              {raw.accepted_at ? (
                <a href={printUrl} target="_blank" rel="noreferrer" className="font-mono underline">
                  {t("console.people.offerLetters.detail.signedPdf", undefined, "Signed PDF ↗")}
                </a>
              ) : (
                <span className="font-mono">—</span>
              )}
            </div>
          </section>
        </div>

        <LetterShareCard letterId={raw.id} accessCode={raw.access_code} publicUrl={publicUrl} status={raw.status} />

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Link
            href={`/studio/documents/offerletter?recordId=${raw.id}`}
            className="rounded border border-[var(--border-default)] px-3 py-1.5 hover:border-[var(--p-accent)] hover:text-[var(--p-accent)]"
          >
            {t("console.people.offerLetters.detail.openAsDocument", undefined, "Document")}
          </Link>
          <a
            href={printUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-[var(--border-default)] px-3 py-1.5 hover:border-[var(--p-accent)] hover:text-[var(--p-accent)]"
          >
            {t("console.people.offerLetters.detail.printLink", undefined, "Print / Save as PDF →")}
          </a>
          <span className="text-[var(--p-text-2)]">
            {t(
              "console.people.offerLetters.detail.printHint",
              undefined,
              "Bare-bones print view. Browser's Save-as-PDF target produces a clean document.",
            )}
          </span>
        </div>

        {raw.snapshot && (
          <div className="surface px-4 py-3 text-xs text-[var(--p-text-2)]">
            <span className="tracking-wider uppercase">
              {t("console.people.offerLetters.detail.snapshotFrozen", undefined, "Snapshot Frozen")}
            </span>
            {raw.snapshot_at && (
              <>
                {" "}
                {t(
                  "console.people.offerLetters.detail.snapshotAt",
                  { when: fmt.dateTime(raw.snapshot_at) },
                  `at ${fmt.dateTime(raw.snapshot_at)}.`,
                )}
              </>
            )}{" "}
            {t(
              "console.people.offerLetters.detail.snapshotNote",
              undefined,
              "The letter below renders from the frozen snapshot: even if rate cards, roles, or settings change later, the signed document stays the same.",
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <LetterDocument letter={renderable} activeMsa={activeMsa} msaSignerUrl={msaSignerUrl} />
          </div>

          <div className="space-y-6">
            <LetterLifecycleActions letterId={raw.id} status={raw.status} hasMsa={!!activeMsa} />

            <section className="surface space-y-3 p-5">
              <h3 className="text-sm font-semibold tracking-wider uppercase">
                {t("console.people.offerLetters.detail.sources", undefined, "Sources")}
              </h3>
              <DefRow
                k={t("console.people.offerLetters.detail.recipient", undefined, "Recipient")}
                v={resolved.recipient_name}
              />
              <DefRow
                k={t("console.people.offerLetters.detail.role", undefined, "Role")}
                v={`${resolved.role_title} (${resolved.role_slug})`}
              />
              <DefRow
                k={t("console.people.offerLetters.detail.reportsTo", undefined, "Reports To")}
                v={resolved.reports_to_name ?? "—"}
              />
              <DefRow
                k={t("console.people.offerLetters.detail.venue", undefined, "Venue")}
                v={resolved.venue_name ?? "—"}
              />
              <DefRow
                k={t("console.people.offerLetters.detail.rateCard", undefined, "Rate Card")}
                v={resolved.rate_sku ?? "—"}
              />
              <DefRow
                k={t("console.people.offerLetters.detail.project", undefined, "Project")}
                v={resolved.project_name}
              />
              <DefRow
                k={t("console.people.offerLetters.detail.signingAuthority", undefined, "Signing Authority")}
                v={resolved.signing_authority_name ?? "—"}
              />
            </section>

            <section className="surface space-y-3 p-5">
              <h3 className="text-sm font-semibold tracking-wider uppercase">
                {t("console.people.offerLetters.detail.activity", undefined, "Activity")}
              </h3>
              {activity.length === 0 ? (
                <div className="text-xs text-[var(--p-text-2)]">
                  {t("console.people.offerLetters.detail.noActivity", undefined, "No activity yet.")}
                </div>
              ) : (
                <ul className="space-y-3 text-xs">
                  {activity.map((a) => (
                    <li key={a.id} className="border-s-2 border-[var(--border-default)] ps-3">
                      <div className="tracking-wider text-[var(--p-text-2)] uppercase">{toTitle(a.kind)}</div>
                      <div className="text-[var(--p-text-1)]">{a.summary}</div>
                      <div className="text-[var(--p-text-2)]">
                        {a.actor_label ? `${a.actor_label} · ` : ""}
                        {fmt.dateTime(a.occurred_at)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <LetterEmailComposer email={email} />

        <LetterEditor raw={raw} resolved={resolved} crew={crew} roles={roles} venues={venues} rates={rates} />
      </div>
    </>
  );
}

function DefRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-3 text-xs">
      <div className="w-32 shrink-0 tracking-wider text-[var(--p-text-2)] uppercase">{k}</div>
      <div className="font-mono">{v}</div>
    </div>
  );
}
