import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters } from "@/lib/i18n/request";
import { getAssignment, CATALOG_KIND_LABEL_SINGULAR, type CatalogKind } from "@/lib/db/assignments";
import { AdvanceDetail, type AdvanceDetailData } from "./AdvanceDetail";

export const dynamic = "force-dynamic";

const KIND_ICON: Record<string, string> = {
  ticket: "Ticket",
  credential: "BadgeCheck",
  catering: "Utensils",
  radio: "RadioTower",
  tool: "Wrench",
  equipment: "Package",
  uniform: "Shirt",
  travel: "Plane",
  lodging: "BedDouble",
  vehicle: "Car",
  labor: "Users",
};

const STATE_TONE: Record<string, string> = {
  briefed: "neutral",
  draft: "neutral",
  submitted: "info",
  in_review: "info",
  revision_requested: "warn",
  approved: "ok",
  rejected: "danger",
  delivered: "ok",
  issued: "ok",
  transferred: "info",
  redeemed: "ok",
  expired: "neutral",
  voided: "danger",
  returned: "neutral",
};

export default async function AdvanceDetailPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const session = await requireSession();
  const a = await getAssignment(session.orgId, assignmentId);
  if (!a) notFound();
  // Defense-in-depth: only the party themselves view their advance here.
  if (a.party_user_id !== session.userId) notFound();

  const fmt = await getRequestFormatters();
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", a.project_id)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const extra = (a.data ?? {}) as Record<string, unknown>;
  const data: AdvanceDetailData = {
    id: a.id,
    title: a.title,
    catalogKindLabel: CATALOG_KIND_LABEL_SINGULAR[a.catalog_kind as CatalogKind] ?? a.catalog_kind,
    catalogKindIcon: KIND_ICON[a.catalog_kind] ?? "Package",
    fulfillmentState: a.fulfillment_state,
    stateTone: STATE_TONE[a.fulfillment_state] ?? "neutral",
    project: (project?.name as string | undefined) ?? null,
    deadline: a.deadline ? fmt.date(a.deadline) : null,
    issuedAt: a.issued_at ? fmt.date(a.issued_at) : null,
    fulfilledAt: a.fulfilled_at ? fmt.date(a.fulfilled_at) : null,
    notes: a.notes,
    qty: typeof extra.qty === "number" ? extra.qty : null,
    special: typeof extra.special === "string" ? extra.special : null,
    purpose: typeof extra.purpose === "string" ? extra.purpose : null,
  };

  return <AdvanceDetail data={data} />;
}
