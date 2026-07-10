import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { TicketPass, type TicketPassData } from "@/components/portal/TicketPass";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /p/[slug]/guest/tickets — the viewer's OWN tickets as scannable passes.
 *
 * C-06 (privacy): the old query was project-scoped and listed every holder's
 * name, email, and live entry code. This page is now strictly viewer-scoped:
 *   1. assignments where party_user_id = the signed-in user, plus
 *   2. the claimed-email path — external-holder rows claimed by this user or
 *      matching their sign-in email (case-insensitive), which get claimed on
 *      first view. External holders aren't org members, so this leg reads
 *      through the service client with explicit org/project/party pinning.
 * No other holder's identity or code is ever selected.
 */

type Raw = {
  id: string;
  fulfillment_state: string;
  issued_at: string | null;
  ticket_assignment_details: {
    tier_code: string | null;
    seat_section: string | null;
    seat_row: string | null;
    seat_number: string | null;
  } | null;
  assignment_scan_codes: Array<{ code: string; active: boolean }>;
};

/** Escape ilike pattern metacharacters so an email is matched literally. */
function ilikeLiteral(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const project = await projectIdFromSlug(slug);
  if (!project) {
    return (
      <PortalSubpage
        slug={slug}
        persona="guest"
        title={t("p.guest.tickets.title", undefined, "Tickets")}
        subtitle={t("p.guest.tickets.subtitle", undefined, "Your tickets for this event")}
      >
        <p className="text-sm text-[var(--p-text-2)]">
          {t("p.guest.tickets.projectNotFound", undefined, "Project not found.")}
        </p>
      </PortalSubpage>
    );
  }
  const session = await requireSession();
  const canService = isServiceClientAvailable();

  // Claimed-email path for external ticket holders (guests invited by email
  // who aren't platform members). Service-client only — RLS can't serve a
  // non-member their own scan code — with every read pinned to this org and
  // this viewer's identity.
  let externalIds: string[] = [];
  if (canService) {
    const svc = createServiceClient();
    const email = session.email?.trim();
    const [byClaim, byEmail] = await Promise.all([
      svc
        .from("assignment_external_holders")
        .select("id")
        .eq("org_id", project.org_id)
        .eq("claimed_user_id", session.userId),
      email
        ? svc
            .from("assignment_external_holders")
            .select("id, claimed_user_id")
            .eq("org_id", project.org_id)
            .ilike("holder_email", ilikeLiteral(email))
        : Promise.resolve({ data: [] as Array<{ id: string; claimed_user_id: string | null }> }),
    ]);
    const emailRows = (byEmail.data ?? []) as Array<{ id: string; claimed_user_id: string | null }>;
    const unclaimed = emailRows.filter((h) => !h.claimed_user_id).map((h) => h.id);
    if (unclaimed.length > 0) {
      // First view claims the holder record for this account (documented
      // claimed-by-email pattern). Guarded so a race never re-claims.
      await svc
        .from("assignment_external_holders")
        .update({ claimed_user_id: session.userId, claimed_at: new Date().toISOString() })
        .in("id", unclaimed)
        .is("claimed_user_id", null);
    }
    externalIds = Array.from(
      new Set([
        ...((byClaim.data ?? []) as Array<{ id: string }>).map((h) => h.id),
        ...emailRows.filter((h) => !h.claimed_user_id || h.claimed_user_id === session.userId).map((h) => h.id),
      ]),
    );
  }

  // Ticket read: service client (so external holders and non-member guests
  // can see their own passes) with app-side viewer pinning; falls back to
  // the RLS session client when no service key is configured.
  const db = canService ? createServiceClient() : await createClient();
  let q = db
    .from("assignments")
    .select(
      "id, fulfillment_state, issued_at, ticket_assignment_details(tier_code, seat_section, seat_row, seat_number), assignment_scan_codes(code, active)",
    )
    .eq("org_id", project.org_id)
    .eq("project_id", project.id)
    .eq("catalog_kind", "ticket")
    .is("deleted_at", null);
  q =
    externalIds.length > 0
      ? q.or(`party_user_id.eq.${session.userId},party_external_id.in.(${externalIds.join(",")})`)
      : q.eq("party_user_id", session.userId);
  const { data } = await q.order("issued_at", { ascending: false, nullsFirst: false }).limit(100);

  const tickets: TicketPassData[] = ((data ?? []) as unknown as Raw[]).map((r) => ({
    id: r.id,
    code: r.assignment_scan_codes.find((c) => c.active)?.code ?? null,
    tierCode: r.ticket_assignment_details?.tier_code ?? null,
    seatSection: r.ticket_assignment_details?.seat_section ?? null,
    seatRow: r.ticket_assignment_details?.seat_row ?? null,
    seatNumber: r.ticket_assignment_details?.seat_number ?? null,
    state: r.fulfillment_state,
    issuedAt: r.issued_at,
    eventName: project.name,
  }));

  return (
    <PortalSubpage
      slug={slug}
      persona="guest"
      title={t("p.guest.tickets.title", undefined, "Tickets")}
      subtitle={t("p.guest.tickets.subtitle", undefined, "Your tickets for this event")}
    >
      {tickets.length === 0 ? (
        <EmptyState
          title={t("p.guest.tickets.empty.title", undefined, "No Tickets Yet")}
          description={t(
            "p.guest.tickets.empty.description",
            undefined,
            "When the team issues a ticket to you, your scannable pass appears here.",
          )}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <TicketPass key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </PortalSubpage>
  );
}
