import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import {
  advanceState,
  deleteAssignment,
  postComment,
  reassignAssignment,
  upsertCredentialDetails,
  upsertLodgingDetails,
  upsertTicketDetails,
  upsertTravelDetails,
  upsertVehicleDetails,
} from "./actions";
import { toTitle } from "@/lib/format";
import {
  CATALOG_KIND_LABEL_SINGULAR,
  NEXT_FULFILLMENT_STATES,
  getAssignment,
  type FulfillmentState,
} from "@/lib/db/assignments";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ projectId: string; assignmentId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">{t("console.common.configureSupabase", undefined, "Configure Supabase.")}</div>
    );
  const { projectId, assignmentId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const a = await getAssignment(session.orgId, assignmentId);
  if (!a || a.project_id !== projectId) notFound();

  // Per-kind detail row lives in a sibling table named after the kind.
  // Pull it conditionally so off-kind reads don't waste a round-trip.
  const detailTable: Record<string, string> = {
    ticket: "ticket_assignment_details",
    credential: "credential_assignment_details",
    lodging: "lodging_assignment_details",
    travel: "travel_assignment_details",
    vehicle: "vehicle_assignment_details",
  };
  const detailTableName = detailTable[a.catalog_kind] ?? null;

  const [{ data: party }, { data: members }, { data: events }, detailResult] = await Promise.all([
    a.party_kind === "user" && a.party_user_id
      ? supabase.from("users").select("id, email, name").eq("id", a.party_user_id).maybeSingle()
      : a.party_kind === "crew_member" && a.party_crew_id
        ? supabase.from("crew_members").select("id, name, email").eq("id", a.party_crew_id).maybeSingle()
        : a.party_kind === "external_holder" && a.party_external_id
          ? supabase
              .from("assignment_external_holders")
              .select("id, holder_name, holder_email")
              .eq("id", a.party_external_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, email, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    supabase
      .from("assignment_events")
      .select(
        "id, event_kind, from_state, to_state, body, payload, at, actor_user_id, actor:users!assignment_events_actor_user_id_fkey(name, email)",
      )
      .eq("assignment_id", assignmentId)
      .order("at", { ascending: false }),
    detailTableName
      ? // Runtime table name — typed client can't narrow. Cast through
        // unknown rather than reach for LooseSupabase since we already
        // own the result type via the per-kind discriminated union below.
        (
          supabase.from(detailTableName as never) as unknown as {
            select: (cols: string) => {
              eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: unknown }> };
            };
          }
        )
          .select("*")
          .eq("assignment_id", assignmentId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const detail = (detailResult as { data: Record<string, unknown> | null }).data;

  // Fulfillment provenance — who confirmed it and via which channel. The
  // check-in scan + the holder's fulfil action write these; the org detail is
  // where they read.
  let fulfilledByName: string | null = null;
  if (a.fulfilled_by) {
    const { data: fb } = await supabase
      // soft-delete-exempt: resolving the fulfiller's name by id — a since-offboarded user must still be named on the record
      .from("users")
      .select("name, email")
      .eq("id", a.fulfilled_by)
      .maybeSingle();
    fulfilledByName = (fb as { name: string | null; email: string | null } | null)?.name
      ?? (fb as { email: string | null } | null)?.email
      ?? null;
  }

  const partyLabel =
    a.party_kind === "user"
      ? ((party as { name: string | null; email: string } | null)?.name ??
        (party as { email: string } | null)?.email ??
        t("console.projects.assignments.detail.unassigned", undefined, "Unassigned"))
      : a.party_kind === "crew_member"
        ? ((party as { name: string } | null)?.name ??
          t("console.projects.assignments.detail.unknownCrew", undefined, "Unknown crew"))
        : ((party as { holder_name: string | null; holder_email: string | null } | null)?.holder_name ??
          (party as { holder_email: string | null } | null)?.holder_email ??
          t("console.projects.assignments.detail.guest", undefined, "Guest"));

  const memberList = (
    (members ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; email: string; name: string | null } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u)
    .sort((x, y) => (x.name ?? x.email).localeCompare(y.name ?? y.email));

  type EventRow = {
    id: string;
    event_kind: string;
    from_state: string | null;
    to_state: string | null;
    body: string | null;
    payload: Record<string, unknown> | null;
    at: string;
    actor_user_id: string | null;
    actor: { name: string | null; email: string | null } | null;
  };
  const eventRows = (events ?? []) as unknown as EventRow[];
  const commentRows = eventRows.filter((e) => e.event_kind === "comment" && e.body);
  const auditRows = eventRows.filter((e) => e.event_kind !== "comment");

  const allowed = NEXT_FULFILLMENT_STATES[a.fulfillment_state as FulfillmentState] ?? [];
  const notes = (a.data as { notes?: string } | null)?.notes ?? a.notes ?? null;

  // Per-kind detail field shapes. These mirror the columns from the
  // 0062 migration's `*_assignment_details` siblings. Server-only —
  // never trust these for security, RLS gates the write actions.
  type TicketDetails = {
    tier_code: string | null;
    zone_codes: string[];
    gate_codes: string[];
    transferable: boolean;
    valid_from: string | null;
    valid_until: string | null;
    seat_section: string | null;
    seat_row: string | null;
    seat_number: string | null;
  };
  type CredentialDetails = {
    access_level: string | null;
    parent_assignment_id: string | null;
    issued_on: string | null;
    expires_on: string | null;
    must_return: boolean;
    returned_at: string | null;
  };
  type LodgingDetails = {
    property_name: string | null;
    room_number: string | null;
    check_in: string | null;
    check_out: string | null;
    roommate_assignment_id: string | null;
    confirmation_code: string | null;
  };
  type TravelDetails = {
    mode: string | null;
    from_location: string | null;
    to_location: string | null;
    depart_at: string | null;
    arrive_at: string | null;
    carrier: string | null;
    confirmation_code: string | null;
    seat: string | null;
  };
  type VehicleDetails = {
    vehicle_label: string | null;
    plate: string | null;
    picked_up_at: string | null;
    returned_at: string | null;
    mileage_start: number | null;
    mileage_end: number | null;
  };

  return (
    <>
      <ModuleHeader
        eyebrow={CATALOG_KIND_LABEL_SINGULAR[a.catalog_kind]}
        title={a.title ?? t("console.projects.assignments.detail.untitled", undefined, "Untitled")}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={a.fulfillment_state} />
            <Badge variant="muted">{partyLabel}</Badge>
            {a.deadline && (
              <span className="font-mono text-xs">
                {t(
                  "console.projects.assignments.detail.due",
                  { date: fmt.date(a.deadline) },
                  `due ${fmt.date(a.deadline)}`,
                )}
              </span>
            )}
            {a.fulfilled_at && (
              <span className="font-mono text-xs">
                {t(
                  "console.projects.assignments.detail.fulfilledVia",
                  {
                    date: fmt.date(a.fulfilled_at),
                    via: a.fulfilled_via ?? "manual",
                    by: fulfilledByName ?? "—",
                  },
                  `fulfilled ${fmt.date(a.fulfilled_at)} · ${a.fulfilled_via ?? "manual"} · ${fulfilledByName ?? "—"}`,
                )}
              </span>
            )}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/studio/projects/${projectId}/advancing/assignments`}
              className="ps-btn ps-btn--ghost ps-btn--sm"
            >
              {t("common.back", undefined, "Back")}
            </Link>
            <DeleteForm
              action={deleteAssignment.bind(null, projectId, a.id)}
              confirm={t(
                "console.projects.assignments.detail.cancelConfirm",
                undefined,
                "Cancel this assignment? The assignee will no longer see it on their advancing surface.",
              )}
              undo={{
                table: "assignments",
                id: a.id,
                redirectTo: `/studio/projects/${projectId}/advancing/assignments`,
              }}
            />
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        {notes && (
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">
              {t("console.projects.assignments.detail.notes", undefined, "Notes")}
            </h2>
            <p className="mt-2 text-xs whitespace-pre-wrap text-[var(--p-text-2)]">{notes}</p>
          </section>
        )}

        {a.catalog_kind === "ticket" && (
          <KindPanel
            title={t("console.projects.assignments.detail.ticket.title", undefined, "Ticket Details")}
            description={t(
              "console.projects.assignments.detail.ticket.description",
              undefined,
              "Tier + access zones, gate routing, seat assignment, transfer policy. Drives the COMPVSS gate scanner display.",
            )}
          >
            <form action={upsertTicketDetails} className="grid grid-cols-1 gap-2 sm:grid-cols-6">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="assignmentId" value={a.id} />
              <DetailInput
                name="tier_code"
                label={t("console.projects.assignments.detail.ticket.tier", undefined, "Tier")}
                className="sm:col-span-2"
                defaultValue={(detail as TicketDetails | null)?.tier_code ?? ""}
                placeholder="ga, vip, all_access"
              />
              <DetailInput
                name="zone_codes"
                label={t("console.projects.assignments.detail.ticket.zones", undefined, "Zones (Comma)")}
                className="sm:col-span-2"
                defaultValue={((detail as TicketDetails | null)?.zone_codes ?? []).join(", ")}
                placeholder="main_stage, bar_b"
              />
              <DetailInput
                name="gate_codes"
                label={t("console.projects.assignments.detail.ticket.gates", undefined, "Gates (Comma)")}
                className="sm:col-span-2"
                defaultValue={((detail as TicketDetails | null)?.gate_codes ?? []).join(", ")}
                placeholder="gate_a, gate_c"
              />
              <DetailInput
                name="valid_from"
                label={t("console.projects.assignments.detail.ticket.validFrom", undefined, "Valid from")}
                type="datetime-local"
                className="sm:col-span-2"
                defaultValue={isoLocal((detail as TicketDetails | null)?.valid_from)}
              />
              <DetailInput
                name="valid_until"
                label={t("console.projects.assignments.detail.ticket.validUntil", undefined, "Valid until")}
                type="datetime-local"
                className="sm:col-span-2"
                defaultValue={isoLocal((detail as TicketDetails | null)?.valid_until)}
              />
              <DetailInput
                name="seat_section"
                label={t("console.projects.assignments.detail.ticket.section", undefined, "Section")}
                className="sm:col-span-1"
                defaultValue={(detail as TicketDetails | null)?.seat_section ?? ""}
              />
              <DetailInput
                name="seat_row"
                label={t("console.projects.assignments.detail.ticket.row", undefined, "Row")}
                className="sm:col-span-1"
                defaultValue={(detail as TicketDetails | null)?.seat_row ?? ""}
              />
              <DetailInput
                name="seat_number"
                label={t("console.projects.assignments.detail.ticket.seat", undefined, "Seat")}
                className="sm:col-span-2"
                defaultValue={(detail as TicketDetails | null)?.seat_number ?? ""}
              />
              <label className="flex items-center gap-2 text-xs sm:col-span-4">
                <input
                  type="checkbox"
                  name="transferable"
                  value="true"
                  defaultChecked={(detail as TicketDetails | null)?.transferable ?? false}
                />
                {t(
                  "console.projects.assignments.detail.ticket.transferable",
                  undefined,
                  "Transferable to another holder",
                )}
              </label>
              <div className="flex justify-end sm:col-span-6">
                <Button type="submit" size="sm" variant="secondary">
                  {t("console.projects.assignments.detail.ticket.save", undefined, "Save Ticket Details")}
                </Button>
              </div>
            </form>
          </KindPanel>
        )}

        {a.catalog_kind === "credential" && (
          <KindPanel
            title={t("console.projects.assignments.detail.credential.title", undefined, "Credential Details")}
            description={t(
              "console.projects.assignments.detail.credential.description",
              undefined,
              "Access level, expiry, return policy. Parent assignment lets escort badges defer to a primary credential.",
            )}
          >
            <form action={upsertCredentialDetails} className="grid grid-cols-1 gap-2 sm:grid-cols-6">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="assignmentId" value={a.id} />
              <DetailInput
                name="access_level"
                label={t("console.projects.assignments.detail.credential.accessLevel", undefined, "Access level")}
                className="sm:col-span-3"
                defaultValue={(detail as CredentialDetails | null)?.access_level ?? ""}
                placeholder="backstage, production_only, all_areas"
              />
              <DetailInput
                name="parent_assignment_id"
                label={t(
                  "console.projects.assignments.detail.credential.parent",
                  undefined,
                  "Parent Credential (Assignment UUID)",
                )}
                className="sm:col-span-3"
                defaultValue={(detail as CredentialDetails | null)?.parent_assignment_id ?? ""}
                placeholder={t(
                  "console.projects.assignments.detail.credential.parentPlaceholder",
                  undefined,
                  "optional UUID",
                )}
              />
              <DetailInput
                name="issued_on"
                label={t("console.projects.assignments.detail.credential.issuedOn", undefined, "Issued on")}
                type="date"
                className="sm:col-span-2"
                defaultValue={(detail as CredentialDetails | null)?.issued_on ?? ""}
              />
              <DetailInput
                name="expires_on"
                label={t("console.projects.assignments.detail.credential.expiresOn", undefined, "Expires on")}
                type="date"
                className="sm:col-span-2"
                defaultValue={(detail as CredentialDetails | null)?.expires_on ?? ""}
              />
              <label className="flex items-center gap-2 text-xs sm:col-span-2">
                <input
                  type="checkbox"
                  name="must_return"
                  value="true"
                  defaultChecked={(detail as CredentialDetails | null)?.must_return ?? false}
                />
                {t("console.projects.assignments.detail.credential.mustReturn", undefined, "Must be returned")}
              </label>
              {(detail as CredentialDetails | null)?.returned_at && (
                <p className="text-xs text-[var(--p-text-2)] sm:col-span-6">
                  {t(
                    "console.projects.assignments.detail.credential.returnedOn",
                    { date: fmt.date((detail as CredentialDetails).returned_at as string) },
                    `Returned ${fmt.date((detail as CredentialDetails).returned_at as string)}`,
                  )}
                </p>
              )}
              <div className="flex justify-end sm:col-span-6">
                <Button type="submit" size="sm" variant="secondary">
                  {t("console.projects.assignments.detail.credential.save", undefined, "Save Credential Details")}
                </Button>
              </div>
            </form>
          </KindPanel>
        )}

        {a.catalog_kind === "lodging" && (
          <KindPanel
            title={t("console.projects.assignments.detail.lodging.title", undefined, "Lodging Details")}
            description={t(
              "console.projects.assignments.detail.lodging.description",
              undefined,
              "Property, room, dates, roommate pairing. Drives the /m/advances lodging card.",
            )}
          >
            <form action={upsertLodgingDetails} className="grid grid-cols-1 gap-2 sm:grid-cols-6">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="assignmentId" value={a.id} />
              <DetailInput
                name="property_name"
                label={t("console.projects.assignments.detail.lodging.property", undefined, "Property")}
                className="sm:col-span-4"
                defaultValue={(detail as LodgingDetails | null)?.property_name ?? ""}
                placeholder="Fontainebleau Miami Beach"
              />
              <DetailInput
                name="room_number"
                label={t("console.projects.assignments.detail.lodging.room", undefined, "Room")}
                className="sm:col-span-2"
                defaultValue={(detail as LodgingDetails | null)?.room_number ?? ""}
                placeholder="2418"
              />
              <DetailInput
                name="check_in"
                label={t("console.projects.assignments.detail.lodging.checkIn", undefined, "Check-in")}
                type="date"
                className="sm:col-span-2"
                defaultValue={(detail as LodgingDetails | null)?.check_in ?? ""}
              />
              <DetailInput
                name="check_out"
                label={t("console.projects.assignments.detail.lodging.checkOut", undefined, "Check-out")}
                type="date"
                className="sm:col-span-2"
                defaultValue={(detail as LodgingDetails | null)?.check_out ?? ""}
              />
              <DetailInput
                name="confirmation_code"
                label={t("console.projects.assignments.detail.lodging.confirmation", undefined, "Confirmation")}
                className="sm:col-span-2"
                defaultValue={(detail as LodgingDetails | null)?.confirmation_code ?? ""}
              />
              <DetailInput
                name="roommate_assignment_id"
                label={t(
                  "console.projects.assignments.detail.lodging.roommate",
                  undefined,
                  "Roommate (Assignment UUID)",
                )}
                className="sm:col-span-6"
                defaultValue={(detail as LodgingDetails | null)?.roommate_assignment_id ?? ""}
                placeholder={t(
                  "console.projects.assignments.detail.lodging.roommatePlaceholder",
                  undefined,
                  "optional UUID (pairs two assignments to the same room)",
                )}
              />
              <div className="flex justify-end sm:col-span-6">
                <Button type="submit" size="sm" variant="secondary">
                  {t("console.projects.assignments.detail.lodging.save", undefined, "Save Lodging Details")}
                </Button>
              </div>
            </form>
          </KindPanel>
        )}

        {a.catalog_kind === "travel" && (
          <KindPanel
            title={t("console.projects.assignments.detail.travel.title", undefined, "Travel Details")}
            description={t(
              "console.projects.assignments.detail.travel.description",
              undefined,
              "One leg per assignment. Multi-leg itineraries are multiple assignments grouped by atom_id.",
            )}
          >
            <form action={upsertTravelDetails} className="grid grid-cols-1 gap-2 sm:grid-cols-6">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="assignmentId" value={a.id} />
              <label className="text-xs sm:col-span-2">
                <span className="text-label">
                  {t("console.projects.assignments.detail.travel.mode", undefined, "Mode")}
                </span>
                <select
                  name="mode"
                  defaultValue={(detail as TravelDetails | null)?.mode ?? ""}
                  className="ps-input mt-1 w-full"
                >
                  <option value="">—</option>
                  <option value="flight">
                    {t("console.projects.assignments.detail.travel.flight", undefined, "Flight")}
                  </option>
                  <option value="ground">
                    {t("console.projects.assignments.detail.travel.ground", undefined, "Ground")}
                  </option>
                  <option value="rail">
                    {t("console.projects.assignments.detail.travel.rail", undefined, "Rail")}
                  </option>
                  <option value="sea">{t("console.projects.assignments.detail.travel.sea", undefined, "Sea")}</option>
                </select>
              </label>
              <DetailInput
                name="carrier"
                label={t("console.projects.assignments.detail.travel.carrier", undefined, "Carrier")}
                className="sm:col-span-2"
                defaultValue={(detail as TravelDetails | null)?.carrier ?? ""}
                placeholder="Delta, Amtrak, …"
              />
              <DetailInput
                name="confirmation_code"
                label={t("console.projects.assignments.detail.travel.confirmation", undefined, "Confirmation")}
                className="sm:col-span-2"
                defaultValue={(detail as TravelDetails | null)?.confirmation_code ?? ""}
              />
              <DetailInput
                name="from_location"
                label={t("console.projects.assignments.detail.travel.from", undefined, "From")}
                className="sm:col-span-3"
                defaultValue={(detail as TravelDetails | null)?.from_location ?? ""}
                placeholder="LAX"
              />
              <DetailInput
                name="to_location"
                label={t("console.projects.assignments.detail.travel.to", undefined, "To")}
                className="sm:col-span-3"
                defaultValue={(detail as TravelDetails | null)?.to_location ?? ""}
                placeholder="MIA"
              />
              <DetailInput
                name="depart_at"
                label={t("console.projects.assignments.detail.travel.depart", undefined, "Depart")}
                type="datetime-local"
                className="sm:col-span-3"
                defaultValue={isoLocal((detail as TravelDetails | null)?.depart_at)}
              />
              <DetailInput
                name="arrive_at"
                label={t("console.projects.assignments.detail.travel.arrive", undefined, "Arrive")}
                type="datetime-local"
                className="sm:col-span-3"
                defaultValue={isoLocal((detail as TravelDetails | null)?.arrive_at)}
              />
              <DetailInput
                name="seat"
                label={t("console.projects.assignments.detail.travel.seat", undefined, "Seat")}
                className="sm:col-span-2"
                defaultValue={(detail as TravelDetails | null)?.seat ?? ""}
              />
              <div className="flex justify-end sm:col-span-6">
                <Button type="submit" size="sm" variant="secondary">
                  {t("console.projects.assignments.detail.travel.save", undefined, "Save Travel Details")}
                </Button>
              </div>
            </form>
          </KindPanel>
        )}

        {a.catalog_kind === "vehicle" && (
          <KindPanel
            title={t("console.projects.assignments.detail.vehicle.title", undefined, "Vehicle Details")}
            description={t(
              "console.projects.assignments.detail.vehicle.description",
              undefined,
              "Label, plate, pickup/return timestamps, mileage delta for rental wear billing.",
            )}
          >
            <form action={upsertVehicleDetails} className="grid grid-cols-1 gap-2 sm:grid-cols-6">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="assignmentId" value={a.id} />
              <DetailInput
                name="vehicle_label"
                label={t("console.projects.assignments.detail.vehicle.label", undefined, "Label")}
                className="sm:col-span-3"
                defaultValue={(detail as VehicleDetails | null)?.vehicle_label ?? ""}
                placeholder="Ford Transit (white)"
              />
              <DetailInput
                name="plate"
                label={t("console.projects.assignments.detail.vehicle.plate", undefined, "Plate")}
                className="sm:col-span-3"
                defaultValue={(detail as VehicleDetails | null)?.plate ?? ""}
                placeholder="ABC-1234"
              />
              <DetailInput
                name="picked_up_at"
                label={t("console.projects.assignments.detail.vehicle.pickedUp", undefined, "Picked up")}
                type="datetime-local"
                className="sm:col-span-3"
                defaultValue={isoLocal((detail as VehicleDetails | null)?.picked_up_at)}
              />
              <DetailInput
                name="returned_at"
                label={t("console.projects.assignments.detail.vehicle.returned", undefined, "Returned")}
                type="datetime-local"
                className="sm:col-span-3"
                defaultValue={isoLocal((detail as VehicleDetails | null)?.returned_at)}
              />
              <DetailInput
                name="mileage_start"
                label={t("console.projects.assignments.detail.vehicle.mileageStart", undefined, "Mileage start")}
                type="number"
                className="sm:col-span-3"
                defaultValue={
                  (detail as VehicleDetails | null)?.mileage_start != null
                    ? String((detail as VehicleDetails).mileage_start)
                    : ""
                }
              />
              <DetailInput
                name="mileage_end"
                label={t("console.projects.assignments.detail.vehicle.mileageEnd", undefined, "Mileage end")}
                type="number"
                className="sm:col-span-3"
                defaultValue={
                  (detail as VehicleDetails | null)?.mileage_end != null
                    ? String((detail as VehicleDetails).mileage_end)
                    : ""
                }
              />
              <div className="flex justify-end sm:col-span-6">
                <Button type="submit" size="sm" variant="secondary">
                  {t("console.projects.assignments.detail.vehicle.save", undefined, "Save Vehicle Details")}
                </Button>
              </div>
            </form>
          </KindPanel>
        )}

        {allowed.length > 0 && (
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">
              {t("console.projects.assignments.detail.advanceState.title", undefined, "Advance Status")}
            </h2>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "console.projects.assignments.detail.advanceState.description",
                undefined,
                "Move the assignment forward in the advancing → fulfillment → tracking lifecycle.",
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {allowed.map((next) => (
                <form key={next} action={advanceState}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="assignmentId" value={a.id} />
                  <input type="hidden" name="next_state" value={next} />
                  <Button type="submit" variant="secondary" size="sm">
                    → {toTitle(next)}
                  </Button>
                </form>
              ))}
            </div>
          </section>
        )}

        {a.party_kind === "user" && (
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">
              {t("console.projects.assignments.detail.reassign.title", undefined, "Reassign")}
            </h2>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "console.projects.assignments.detail.reassign.description",
                undefined,
                "Hand this off to a different person. The new assignee is push-notified.",
              )}
            </p>
            <form action={reassignAssignment} className="mt-3 flex items-end gap-2">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="assignmentId" value={a.id} />
              <select name="party_user_id" required defaultValue={a.party_user_id ?? ""} className="ps-input flex-1">
                {memberList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? m.email}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary" size="sm">
                {t("common.save", undefined, "Save")}
              </Button>
            </form>
          </section>
        )}

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">
            {t("console.projects.assignments.detail.comments.title", undefined, "Comments")}
          </h2>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.projects.assignments.detail.comments.description",
              undefined,
              "Back-and-forth between the assignee and the project team. The assignee is push-notified on every new comment.",
            )}
          </p>
          <ol className="mt-3 space-y-3">
            {commentRows.length === 0 ? (
              <li className="text-xs text-[var(--p-text-2)]">
                {t("console.projects.assignments.detail.comments.empty", undefined, "No comments.")}
              </li>
            ) : (
              commentRows.map((c) => (
                <li key={c.id} className="surface-inset rounded-md p-3">
                  <div className="flex items-center justify-between text-xs text-[var(--p-text-2)]">
                    <span className="font-medium text-[var(--p-text-2)]">
                      {c.actor?.name ??
                        c.actor?.email ??
                        t("console.projects.assignments.detail.unknown", undefined, "Unknown")}
                    </span>
                    <span className="font-mono">{fmt.date(c.at)}</span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{c.body}</p>
                </li>
              ))
            )}
          </ol>
          <form action={postComment} className="mt-3 space-y-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="assignmentId" value={a.id} />
            <textarea
              name="body"
              required
              rows={3}
              maxLength={4000}
              placeholder={t(
                "console.projects.assignments.detail.comments.placeholder",
                undefined,
                "Add a comment for the assignee…",
              )}
              className="ps-input w-full resize-y"
            />
            <div className="flex justify-end">
              <Button type="submit" variant="secondary" size="sm">
                {t("console.projects.assignments.detail.comments.post", undefined, "Post Comment")}
              </Button>
            </div>
          </form>
        </section>

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">
            {t("console.projects.assignments.detail.activity.title", undefined, "Activity")}
          </h2>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.projects.assignments.detail.activity.description",
              undefined,
              "Every state transition + scan + comment, in reverse chronological order. One log for everything.",
            )}
          </p>
          <ol className="mt-3 space-y-2 text-xs">
            {auditRows.length === 0 ? (
              <li className="text-[var(--p-text-2)]">
                {t("console.projects.assignments.detail.activity.empty", undefined, "No activity recorded.")}
              </li>
            ) : (
              auditRows.map((e) => {
                const actor =
                  e.actor?.name ??
                  e.actor?.email ??
                  t("console.projects.assignments.detail.system", undefined, "system");
                return (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-2 last:border-0"
                  >
                    <span>
                      <Badge variant="muted">{toTitle(e.event_kind)}</Badge>{" "}
                      {e.from_state && e.to_state ? (
                        <>
                          <Badge variant="muted">{toTitle(e.from_state)}</Badge> →{" "}
                          <Badge variant="info">{toTitle(e.to_state)}</Badge>{" "}
                        </>
                      ) : null}
                      <span className="text-[var(--p-text-2)]">
                        {t("console.projects.assignments.detail.activity.by", { actor }, `by ${actor}`)}
                      </span>
                    </span>
                    <span className="font-mono text-[var(--p-text-2)]">{fmt.date(e.at)}</span>
                  </li>
                );
              })
            )}
          </ol>
        </section>

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.projects.assignments.detail.timestamps",
            { created: fmt.date(a.created_at), updated: fmt.date(a.updated_at) },
            `Created ${fmt.date(a.created_at)} · Last updated ${fmt.date(a.updated_at)}`,
          )}
        </p>
      </div>
    </>
  );
}

// Inline server components — local to the page since they only exist
// to keep the per-kind detail forms readable. Moving to /components
// would gain no reuse but cost a level of indirection.
function KindPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="surface p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">{description}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DetailInput({
  name,
  label,
  defaultValue,
  type = "text",
  className = "",
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={`text-xs ${className}`}>
      <span className="text-label">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="ps-input mt-1 w-full"
      />
    </label>
  );
}

// Postgres returns `timestamptz` as ISO-8601 with timezone (`2026-05-24T15:00:00+00:00`)
// but `<input type="datetime-local">` wants `YYYY-MM-DDTHH:mm` with no
// timezone. Strip the offset so the value round-trips through the form
// without the browser bouncing it as invalid.
function isoLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return m?.[1] ?? "";
}
