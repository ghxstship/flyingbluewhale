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
import { offerPublicUrl } from "@/lib/offer-letters/format";
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
          <Link href="/console/people/offer-letters" className="hover:text-[var(--p-accent)]">
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
        <LetterShareCard letterId={raw.id} accessCode={raw.access_code} publicUrl={publicUrl} status={raw.status} />

        <div className="flex flex-wrap items-center gap-3 text-xs">
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
              "Bare-bones print view — browser's Save-as-PDF target produces a clean document.",
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
              "The letter below renders from the frozen snapshot — even if rate cards, roles, or settings change later, the signed document stays the same.",
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
