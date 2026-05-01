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

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) notFound();
  const session = await requireSession();

  const data = await getOfferLetter(session.orgId, id);
  if (!data) notFound();
  const { raw, resolved } = data;

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

  return (
    <>
      <ModuleHeader
        eyebrow={
          <Link href="/console/people/offer-letters" className="hover:text-[var(--org-primary)]">
            People · Offer Letters
          </Link>
        }
        title={resolved.recipient_name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
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

        {raw.snapshot && (
          <div className="surface px-4 py-3 text-xs text-[var(--text-muted)]">
            <span className="font-mono tracking-wider uppercase">Snapshot frozen</span>
            {raw.snapshot_at && <> at {new Date(raw.snapshot_at).toLocaleString()}.</>} The letter below renders from
            the frozen snapshot — even if rate cards, roles, or settings change later, the signed document stays the
            same.
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <LetterDocument letter={renderable} />
          </div>

          <div className="space-y-6">
            <LetterLifecycleActions letterId={raw.id} status={raw.status} />

            <section className="surface space-y-3 p-5">
              <h3 className="text-sm font-semibold tracking-wider uppercase">Resolved sources (SSOT)</h3>
              <DefRow k="Recipient" v={`crew_members → ${resolved.recipient_name}`} />
              <DefRow k="Role" v={`org_roles → ${resolved.role_title} (${resolved.role_slug})`} />
              <DefRow
                k="Reports to"
                v={resolved.reports_to_name ? `crew_members → ${resolved.reports_to_name}` : "—"}
              />
              <DefRow k="Venue" v={resolved.venue_name ? `venues → ${resolved.venue_name}` : "—"} />
              <DefRow k="Rate card" v={resolved.rate_sku ? `rate_card_items → ${resolved.rate_sku}` : "—"} />
              <DefRow k="Project" v={`projects → ${resolved.project_name}`} />
              <DefRow
                k="Signing authority"
                v={
                  resolved.signing_authority_name
                    ? `org_offer_letter_settings → ${resolved.signing_authority_name}`
                    : "—"
                }
              />
            </section>

            <section className="surface space-y-3 p-5">
              <h3 className="text-sm font-semibold tracking-wider uppercase">Activity</h3>
              {activity.length === 0 ? (
                <div className="text-xs text-[var(--text-muted)]">No activity yet.</div>
              ) : (
                <ul className="space-y-3 text-xs">
                  {activity.map((a) => (
                    <li key={a.id} className="border-l-2 border-[var(--border-default)] pl-3">
                      <div className="font-mono tracking-wider text-[var(--text-muted)] uppercase">{a.kind}</div>
                      <div className="text-[var(--text-primary)]">{a.summary}</div>
                      <div className="text-[var(--text-muted)]">
                        {a.actor_label ? `${a.actor_label} · ` : ""}
                        {new Date(a.occurred_at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <LetterEditor raw={raw} resolved={resolved} crew={crew} roles={roles} venues={venues} rates={rates} />
      </div>
    </>
  );
}

function DefRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-3 text-xs">
      <div className="w-32 shrink-0 tracking-wider text-[var(--text-muted)] uppercase">{k}</div>
      <div className="font-mono">{v}</div>
    </div>
  );
}
