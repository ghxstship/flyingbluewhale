import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CapabilityDenied } from "@/components/CapabilityDenied";
import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { CATALOG_KIND_LABEL_SINGULAR, type CatalogKind } from "@/lib/db/assignments";
import { CartClient, type CartCatalogItem, type CartPerson } from "./CartClient";

export const dynamic = "force-dynamic";

/**
 * /studio/projects/[projectId]/advancing/cart — Kit 30 Advance Cart.
 *
 * Two-pane batching UI over the EXISTING advancing engine: left is the
 * master catalog picker (items are picked from the catalog, never
 * free-typed), right is the cart for ONE person under contract on this
 * project. Line date ranges default to the person's contract dates (their
 * offer letter's onsite window); catering lines expand to meal-period
 * chips + the Every Contract Day toggle with a live derived summary.
 * Review & Submit writes ordinary `assignments` rows (fulfillment_state
 * 'submitted') + a catering_assignment_details sibling per catering line —
 * the cart itself is client state only, never a stored object.
 */
export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="page-content">{t("console.common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const { projectId } = await params;
  const session = await requireSession();

  if (!can(session, "advance:request")) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.projects.advancing.cart.eyebrow", undefined, "Advancing")}
          title={t("console.projects.advancing.cart.title", undefined, "Advance Cart")}
        />
        <CapabilityDenied
          capability="advance:request"
          title={t("console.projects.advancing.cart.deniedTitle", undefined, "No Access")}
          description={t(
            "console.projects.advancing.cart.deniedDescription",
            undefined,
            "Assembling an advance cart requires the capability below. Role grants are managed in Settings · Capabilities.",
          )}
        />
      </>
    );
  }

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: catalog }, { data: letters }] = await Promise.all([
    supabase
      .from("master_catalog_items")
      .select("id, kind, code, name")
      .eq("org_id", session.orgId)
      .eq("active", true)
      .is("deleted_at", null)
      .order("kind", { ascending: true })
      .order("name", { ascending: true })
      .limit(500),
    supabase
      .from("offer_letters_resolved")
      .select("id, crew_member_id, recipient_name, status, effective_onsite_start, effective_onsite_end")
      .eq("org_id", session.orgId)
      .eq("project_id", projectId)
      .neq("status", "withdrawn")
      .order("created_at", { ascending: false }),
  ]);

  const items: CartCatalogItem[] = ((catalog ?? []) as Array<{ id: string; kind: CatalogKind; code: string; name: string }>).map(
    (c) => ({
      id: c.id,
      kind: c.kind,
      code: c.code,
      name: c.name,
      label: `${CATALOG_KIND_LABEL_SINGULAR[c.kind] ?? c.kind} · ${c.name}`,
    }),
  );

  // One picker entry per crew member — the latest letter (query is
  // newest-first) carries the contract window the cart lines default to.
  const seen = new Set<string>();
  const people: CartPerson[] = [];
  for (const l of (letters ?? []) as Array<{
    id: string | null;
    crew_member_id: string | null;
    recipient_name: string | null;
    status: string | null;
    effective_onsite_start: string | null;
    effective_onsite_end: string | null;
  }>) {
    if (!l.id || !l.crew_member_id || seen.has(l.crew_member_id)) continue;
    seen.add(l.crew_member_id);
    people.push({
      crewMemberId: l.crew_member_id,
      name: l.recipient_name ?? t("console.projects.advancing.cart.unnamed", undefined, "Unnamed"),
      contractStart: l.effective_onsite_start,
      contractEnd: l.effective_onsite_end,
    });
  }
  people.sort((a, b) => a.name.localeCompare(b.name));

  const header = (
    <ModuleHeader
      eyebrow={(project as { name: string }).name}
      title={t("console.projects.advancing.cart.title", undefined, "Advance Cart")}
      subtitle={t(
        "console.projects.advancing.cart.subtitle",
        undefined,
        "Add Items · Review · Submit. Items Are Picked From The Catalog, Never Free-Typed.",
      )}
      action={
        <Button href={`/studio/projects/${projectId}/advancing/fulfillment`} variant="secondary" size="sm">
          {t("console.projects.advancing.cart.queueLink", undefined, "Fulfillment Queue")}
        </Button>
      }
    />
  );

  if (items.length === 0) {
    return (
      <>
        {header}
        <div className="page-content">
          <EmptyState
            title={t("console.projects.advancing.cart.emptyCatalogTitle", undefined, "No Catalog Items Yet")}
            description={t(
              "console.projects.advancing.cart.emptyCatalogDescription",
              undefined,
              "The cart picks from the master catalog. Author credentials, vehicles, and catering items first.",
            )}
            action={
              <Button href="/studio/settings/catalog" size="sm">
                {t("console.projects.advancing.cart.emptyCatalogCta", undefined, "Open Catalog")}
              </Button>
            }
          />
        </div>
      </>
    );
  }

  if (people.length === 0) {
    return (
      <>
        {header}
        <div className="page-content">
          <EmptyState
            title={t("console.projects.advancing.cart.emptyPeopleTitle", undefined, "No One Under Contract Yet")}
            description={t(
              "console.projects.advancing.cart.emptyPeopleDescription",
              undefined,
              "The cart advances one person at a time, with line dates defaulting to their contract window. Send an offer letter on this project first.",
            )}
            action={
              <Button href="/studio/people/offer-letters" size="sm">
                {t("console.projects.advancing.cart.emptyPeopleCta", undefined, "Open Offer Letters")}
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="page-content">
        <CartClient projectId={projectId} items={items} people={people} />
      </div>
    </>
  );
}
