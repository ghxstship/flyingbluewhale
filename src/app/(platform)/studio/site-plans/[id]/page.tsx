import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import {
  SITEPLAN_ADJACENCY_RELS,
  SITEPLAN_BAND_TYPES,
  SITEPLAN_EDGES,
  SITEPLAN_UTILITY_SERVICES,
  type SitePlanSheet,
} from "@/lib/siteplan/types";
import { STATE_LABEL, STATE_TONE, transitionsFromState, TRANSITION_LABEL } from "@/lib/siteplan/state";
import { BAND_VOCAB } from "@/lib/siteplan/bands";
import { ACCEPTANCE_ITEMS } from "@/lib/siteplan/validators";
import { missingAdjacencyEdges, validatePlacementLaws } from "@/lib/siteplan/validators";
import { TransitionBar } from "./TransitionBar";
import { InlineAddForm } from "./InlineAddForm";
import {
  addAdjacency,
  addBand,
  addPlacement,
  addRegion,
  addStation,
  addUtility,
  deleteAdjacency,
  deleteBand,
  deletePlacement,
  deleteRegion,
  deleteStation,
  deleteUtility,
} from "./actions";

export const dynamic = "force-dynamic";

const XPMS_CLASS_LABEL: Record<number, string> = {
  0: "0 EXECUTIVE",
  1: "1 CREATIVE",
  2: "2 TALENT",
  3: "3 MARKETING",
  4: "4 BUILD",
  5: "5 PRODUCTION",
  6: "6 OPERATIONS",
  7: "7 EXPERIENCE",
  8: "8 HOSPITALITY",
  9: "9 TECHNOLOGY",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  const fmtDate = (iso: string): string => fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });

  // Embedded relations (project/venue/event names) need explicit shaping.
  type SheetRow = SitePlanSheet & {
    project: { name: string | null } | null;
    venue: { name: string | null } | null;
    event: { name: string | null } | null;
  };
  const { data: sheet } = await supabase
    .from("site_plans")
    .select("*, project:project_id(name), venue:venue_id(name), event:event_id(name)")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .returns<SheetRow[]>()
    .maybeSingle();
  if (!sheet) notFound();
  const sp = sheet;

  const [regions, bands, stations, placements, utilities, adjacencies, acceptance, revisions, pins] = await Promise.all(
    [
      supabase.from("siteplan_zone_region").select("*").eq("sheet_id", id).order("code"),
      supabase.from("siteplan_band").select("*").eq("sheet_id", id).order("created_at"),
      supabase.from("siteplan_station").select("*").eq("sheet_id", id).order("station_code"),
      supabase.from("siteplan_placement").select("*").eq("sheet_id", id).order("tag"),
      supabase.from("siteplan_utility").select("*").eq("sheet_id", id).order("drop_code"),
      supabase.from("siteplan_adjacency").select("*").eq("sheet_id", id).order("edge"),
      supabase.from("v_siteplan_sheet_acceptance").select("*").eq("sheet_id", id).maybeSingle(),
      supabase
        .from("site_plan_revisions")
        .select("*")
        .eq("site_plan_id", id)
        .order("uploaded_at", { ascending: false }),
      supabase.from("site_plan_pins").select("*").eq("site_plan_id", id).order("created_at", { ascending: false }),
    ],
  );

  const regionRows = regions.data ?? [];
  const bandRows = bands.data ?? [];
  const stationRows = stations.data ?? [];
  const placementRows = placements.data ?? [];
  const utilityRows = utilities.data ?? [];
  const adjRows = adjacencies.data ?? [];
  const acc = acceptance.data;

  const legalTransitions = transitionsFromState(sp.document_state);
  const violations = validatePlacementLaws({
    sheet: { id: sp.id },
    bands: bandRows,
    stations: stationRows,
    placements: placementRows,
    utilities: utilityRows,
  });
  const missingEdges = missingAdjacencyEdges(adjRows);

  const dims = sp.shell_dimensions;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.sitePlans.detail.eyebrow", undefined, "Creative · Site Plans")}
        breadcrumbs={[
          { label: t("console.sitePlans.detail.breadcrumb", undefined, "Site Plans"), href: "/studio/site-plans" },
          { label: sp.atom_id ?? sp.code },
        ]}
        title={sp.title}
        subtitle={
          <span className="flex items-center gap-2 text-xs">
            {sp.atom_id ? (
              <span className="font-mono">{sp.atom_id}</span>
            ) : (
              <span className="text-[var(--p-text-2)]">
                {t("console.sitePlans.detail.noAtomId", undefined, "no atom id")}
              </span>
            )}
            <span>·</span>
            <Badge variant={STATE_TONE[sp.document_state]}>{STATE_LABEL[sp.document_state]}</Badge>
            <Badge variant="muted">{sp.sheet_type}</Badge>
            <Badge variant="info">
              {t("console.sitePlans.detail.revPrefix", { rev: sp.revision_letter }, `Rev ${sp.revision_letter}`)}
            </Badge>
          </span>
        }
        action={
          <Button href={`/studio/site-plans/${sp.id}/edit`} variant="secondary" size="sm">
            {t("common.edit", undefined, "Edit")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {/* TRANSITION BAR */}
        <TransitionBar sheetId={sp.id} transitions={legalTransitions} labels={TRANSITION_LABEL} />

        {/* SUMMARY GRID */}
        <section className="surface p-4">
          <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {t("console.sitePlans.detail.sheet", undefined, "Sheet")}
          </h3>
          <dl className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <SummaryItem
              label={t("console.sitePlans.detail.xpmsClass", undefined, "XPMS Class")}
              value={sp.primary_class != null ? XPMS_CLASS_LABEL[sp.primary_class] : "—"}
            />
            <SummaryItem
              label={t("console.sitePlans.detail.tier", undefined, "Tier")}
              value={
                sp.tier_primary != null
                  ? t("console.sitePlans.detail.tierValue", { tier: sp.tier_primary }, `Tier ${sp.tier_primary}`)
                  : "—"
              }
            />
            <SummaryItem
              label={t("console.sitePlans.detail.sheetType", undefined, "Sheet Type")}
              value={sp.sheet_type}
            />
            <SummaryItem label={t("console.sitePlans.detail.code", undefined, "Code")} value={sp.code} />
            <SummaryItem label={t("console.sitePlans.detail.shell", undefined, "Shell")} value={sp.shell_type ?? "—"} />
            <SummaryItem
              label={t("console.sitePlans.detail.dimensions", undefined, "Dimensions")}
              value={
                dims
                  ? `${dims.length_in}" × ${dims.width_in}" × ${dims.height_in}" · ${dims.gross_sqft ?? "?"} ${t("console.sitePlans.detail.sqft", undefined, "sqft")}`
                  : "—"
              }
            />
            <SummaryItem
              label={t("console.sitePlans.detail.orientation", undefined, "Orientation")}
              value={sp.orientation_deg != null ? `${sp.orientation_deg}°` : "—"}
            />
            <SummaryItem label={t("console.sitePlans.detail.scale", undefined, "Scale")} value={sp.scale ?? "—"} />
            <SummaryItem
              label={t("console.sitePlans.detail.project", undefined, "Project")}
              value={sp.project?.name ?? "—"}
            />
            <SummaryItem
              label={t("console.sitePlans.detail.event", undefined, "Event")}
              value={sp.event?.name ?? "—"}
            />
            <SummaryItem
              label={t("console.sitePlans.detail.venue", undefined, "Venue")}
              value={sp.venue?.name ?? "—"}
            />
            <SummaryItem
              label={t("console.sitePlans.detail.issued", undefined, "Issued")}
              value={sp.issued_at ? fmtDate(sp.issued_at) : "—"}
            />
          </dl>
        </section>

        {/* ACCEPTANCE CHECKLIST (§8.3) */}
        <section className="surface p-4">
          <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {t("console.sitePlans.detail.acceptance", undefined, "Acceptance · §8.3")}
          </h3>
          {acc ? (
            <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
              {ACCEPTANCE_ITEMS.map((it) => {
                const ok = Boolean(acc[it.key]);
                return (
                  <li key={it.key} className="flex items-center gap-2 text-xs">
                    <span
                      aria-hidden="true"
                      className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-[var(--p-success)]" : "bg-[var(--p-warning)]"}`}
                    />
                    <span>{it.label}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-[var(--p-text-2)]">
              {t("console.sitePlans.detail.acceptanceUnavailable", undefined, "Acceptance snapshot unavailable.")}
            </p>
          )}
          {violations.length > 0 && (
            <div className="mt-3 rounded-md border border-[var(--p-warning)] bg-[var(--color-warning-subtle,transparent)] p-3 text-xs">
              <div className="font-semibold tracking-wide uppercase">
                {t("console.sitePlans.detail.placementViolations", undefined, "Placement Law Violations (§9)")}
              </div>
              <ul className="ms-4 mt-1 list-disc space-y-0.5">
                {violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ZONE REGIONS */}
        <section className="surface p-4">
          <SectionHeader
            title={t("console.sitePlans.detail.zoneRegions", undefined, "Zone Regions")}
            count={regionRows.length}
          />
          {regionRows.length === 0 ? (
            <Empty>
              {t(
                "console.sitePlans.detail.noRegions",
                undefined,
                "No zone regions yet. Add Cold / Cook / Pass / Hold zones to anchor bands.",
              )}
            </Empty>
          ) : (
            <table className="ps-table mt-3">
              <thead>
                <tr>
                  <th>{t("console.sitePlans.detail.code", undefined, "Code")}</th>
                  <th>{t("console.sitePlans.detail.label", undefined, "Label")}</th>
                  <th>{t("console.sitePlans.detail.class", undefined, "Class")}</th>
                  <th>{t("console.sitePlans.detail.notes", undefined, "Notes")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {regionRows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.code}</td>
                    <td>{r.label}</td>
                    <td className="font-mono text-xs">{r.class_tag != null ? XPMS_CLASS_LABEL[r.class_tag] : "—"}</td>
                    <td className="text-xs text-[var(--p-text-2)]">{r.notes ?? "—"}</td>
                    <td className="text-end">
                      <DeleteFormBtn action={deleteRegion} id={r.id} sheetId={sp.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <InlineAddForm
            action={addRegion}
            sheetId={sp.id}
            submitLabel={t("console.sitePlans.detail.addRegion", undefined, "+ Region")}
            fields={[
              {
                name: "code",
                label: t("console.sitePlans.detail.code", undefined, "Code"),
                placeholder: "COLD",
                required: true,
                mono: true,
                maxLength: 16,
              },
              {
                name: "label",
                label: t("console.sitePlans.detail.label", undefined, "Label"),
                placeholder: t("console.sitePlans.detail.coldZonePlaceholder", undefined, "Cold Zone"),
                required: true,
                maxLength: 80,
              },
              {
                name: "class_tag",
                label: t("console.sitePlans.detail.class", undefined, "Class"),
                kind: "select",
                options: [
                  { value: "", label: "—" },
                  ...Object.entries(XPMS_CLASS_LABEL).map(([v, l]) => ({ value: v, label: l })),
                ],
              },
              { name: "notes", label: t("console.sitePlans.detail.notes", undefined, "Notes"), maxLength: 500 },
            ]}
          />
        </section>

        {/* BANDS */}
        <section className="surface p-4">
          <SectionHeader title={t("console.sitePlans.detail.bands", undefined, "Bands · §6")} count={bandRows.length} />
          {bandRows.length === 0 ? (
            <Empty>
              {t(
                "console.sitePlans.detail.noBands",
                undefined,
                "No bands yet. Bands are the canonical name for blue/orange lines. Every linear surface is one.",
              )}
            </Empty>
          ) : (
            <table className="ps-table mt-3">
              <thead>
                <tr>
                  <th>{t("console.sitePlans.detail.type", undefined, "Type")}</th>
                  <th>{t("console.sitePlans.detail.edge", undefined, "Edge")}</th>
                  <th>{t("console.sitePlans.detail.depth", undefined, "Depth")}</th>
                  <th>{t("console.sitePlans.detail.label", undefined, "Label")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {bandRows.map((b) => {
                  const meta = BAND_VOCAB[b.band_type];
                  return (
                    <tr key={b.id}>
                      <td>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            aria-hidden="true"
                            className="inline-block h-2.5 w-3 rounded-sm"
                            style={{ backgroundColor: meta.defaultColor }}
                          />
                          <span className="font-mono text-xs">{b.band_type}</span>
                        </span>
                      </td>
                      <td className="font-mono text-xs">{b.edge}</td>
                      <td className="font-mono text-xs">{b.depth_in != null ? `${b.depth_in}"` : "—"}</td>
                      <td>{b.label ?? meta.label}</td>
                      <td className="text-end">
                        <DeleteFormBtn action={deleteBand} id={b.id} sheetId={sp.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <InlineAddForm
            action={addBand}
            sheetId={sp.id}
            submitLabel={t("console.sitePlans.detail.addBand", undefined, "+ Band")}
            fields={[
              {
                name: "band_type",
                label: t("console.sitePlans.detail.type", undefined, "Type"),
                kind: "select",
                required: true,
                options: SITEPLAN_BAND_TYPES.map((bt) => ({ value: bt, label: bt })),
              },
              {
                name: "edge",
                label: t("console.sitePlans.detail.edge", undefined, "Edge"),
                kind: "select",
                required: true,
                options: SITEPLAN_EDGES.map((e) => ({ value: e, label: e })),
              },
              {
                name: "depth_in",
                label: t("console.sitePlans.detail.depthInches", undefined, 'Depth (")'),
                type: "number",
              },
              { name: "label", label: t("console.sitePlans.detail.label", undefined, "Label"), maxLength: 80 },
            ]}
          />
        </section>

        {/* STATIONS */}
        <section className="surface p-4">
          <SectionHeader
            title={t("console.sitePlans.detail.stations", undefined, "Stations")}
            count={stationRows.length}
          />
          {stationRows.length === 0 ? (
            <Empty>
              {t(
                "console.sitePlans.detail.noStations",
                undefined,
                "No stations yet. A station is a discrete work position on a band (PREP-1, PLATE-1, EXPO-1).",
              )}
            </Empty>
          ) : (
            <table className="ps-table mt-3">
              <thead>
                <tr>
                  <th>{t("console.sitePlans.detail.code", undefined, "Code")}</th>
                  <th>{t("console.sitePlans.detail.band", undefined, "Band")}</th>
                  <th>{t("console.sitePlans.detail.function", undefined, "Function")}</th>
                  <th>{t("console.sitePlans.detail.heads", undefined, "Heads")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {stationRows.map((s) => {
                  const band = bandRows.find((b) => b.id === s.band_id);
                  return (
                    <tr key={s.id}>
                      <td className="font-mono text-xs">{s.station_code}</td>
                      <td className="font-mono text-xs">
                        {band ? `${band.band_type}/${band.edge}` : <span className="text-[var(--p-text-2)]">—</span>}
                      </td>
                      <td>{s.function ?? "—"}</td>
                      <td className="font-mono text-xs">{s.head_count}</td>
                      <td className="text-end">
                        <DeleteFormBtn action={deleteStation} id={s.id} sheetId={sp.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {bandRows.length > 0 && (
            <InlineAddForm
              action={addStation}
              sheetId={sp.id}
              submitLabel={t("console.sitePlans.detail.addStation", undefined, "+ Station")}
              fields={[
                {
                  name: "station_code",
                  label: t("console.sitePlans.detail.code", undefined, "Code"),
                  placeholder: "PREP-1",
                  required: true,
                  mono: true,
                  maxLength: 40,
                },
                {
                  name: "band_id",
                  label: t("console.sitePlans.detail.band", undefined, "Band"),
                  kind: "select",
                  required: true,
                  options: bandRows.map((b) => ({
                    value: b.id,
                    label: `${b.band_type}/${b.edge}${b.label ? ` (${b.label})` : ""}`,
                  })),
                },
                {
                  name: "function",
                  label: t("console.sitePlans.detail.function", undefined, "Function"),
                  placeholder: t("console.sitePlans.detail.prepPlaceholder", undefined, "prep"),
                  maxLength: 60,
                },
                {
                  name: "head_count",
                  label: t("console.sitePlans.detail.heads", undefined, "Heads"),
                  type: "number",
                  defaultValue: "1",
                },
                {
                  name: "position_in",
                  label: t("console.sitePlans.detail.position", undefined, "Position"),
                  type: "number",
                },
              ]}
            />
          )}
        </section>

        {/* PLACEMENTS */}
        <section className="surface p-4">
          <SectionHeader
            title={t("console.sitePlans.detail.placements", undefined, "Placements · §4.5")}
            count={placementRows.length}
          />
          {placementRows.length === 0 ? (
            <Empty>
              {t(
                "console.sitePlans.detail.noPlacements",
                undefined,
                "No placements yet. A placement records that a UAC catalog item sits on this sheet at a tag.",
              )}
            </Empty>
          ) : (
            <table className="ps-table mt-3">
              <thead>
                <tr>
                  <th>{t("console.sitePlans.detail.tag", undefined, "Tag")}</th>
                  <th>{t("console.sitePlans.detail.station", undefined, "Station")}</th>
                  <th>{t("console.sitePlans.detail.band", undefined, "Band")}</th>
                  <th>{t("console.sitePlans.detail.uac", undefined, "UAC")}</th>
                  <th>{t("console.sitePlans.detail.qty", undefined, "Qty")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {placementRows.map((p) => {
                  const stn = stationRows.find((s) => s.id === p.station_id);
                  const band = bandRows.find((b) => b.id === p.band_id);
                  return (
                    <tr key={p.id}>
                      <td className="font-mono text-xs">{p.tag}</td>
                      <td className="font-mono text-xs">{stn?.station_code ?? "—"}</td>
                      <td className="font-mono text-xs">{band ? `${band.band_type}/${band.edge}` : "—"}</td>
                      <td className="font-mono text-[11px]">{p.uac_atom_id ?? "—"}</td>
                      <td className="font-mono text-xs">{p.qty}</td>
                      <td className="text-end">
                        <DeleteFormBtn action={deletePlacement} id={p.id} sheetId={sp.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <InlineAddForm
            action={addPlacement}
            sheetId={sp.id}
            submitLabel={t("console.sitePlans.detail.addPlacement", undefined, "+ Placement")}
            fields={[
              {
                name: "tag",
                label: t("console.sitePlans.detail.tag", undefined, "Tag"),
                placeholder: "CONV-1",
                required: true,
                mono: true,
                maxLength: 40,
              },
              {
                name: "station_id",
                label: t("console.sitePlans.detail.station", undefined, "Station"),
                kind: "select",
                options: [
                  { value: "", label: "—" },
                  ...stationRows.map((s) => ({ value: s.id, label: s.station_code })),
                ],
              },
              {
                name: "band_id",
                label: t("console.sitePlans.detail.band", undefined, "Band"),
                kind: "select",
                options: [
                  { value: "", label: "—" },
                  ...bandRows.map((b) => ({ value: b.id, label: `${b.band_type}/${b.edge}` })),
                ],
              },
              {
                name: "uac_atom_id",
                label: t("console.sitePlans.detail.uacAtom", undefined, "UAC Atom"),
                placeholder: "LYTE-...",
                mono: true,
                maxLength: 80,
              },
              {
                name: "qty",
                label: t("console.sitePlans.detail.qty", undefined, "Qty"),
                type: "number",
                defaultValue: "1",
              },
              { name: "notes", label: t("console.sitePlans.detail.notes", undefined, "Notes"), maxLength: 500 },
            ]}
          />
        </section>

        {/* UTILITIES */}
        <section className="surface p-4">
          <SectionHeader
            title={t("console.sitePlans.detail.utilities", undefined, "Utilities · §4.6")}
            count={utilityRows.length}
          />
          {utilityRows.length === 0 ? (
            <Empty>
              {t(
                "console.sitePlans.detail.noUtilities",
                undefined,
                "No utility drops yet. Drops are power, gas, water, drain, data, and comms hand-offs.",
              )}
            </Empty>
          ) : (
            <table className="ps-table mt-3">
              <thead>
                <tr>
                  <th>{t("console.sitePlans.detail.drop", undefined, "Drop")}</th>
                  <th>{t("console.sitePlans.detail.service", undefined, "Service")}</th>
                  <th>{t("console.sitePlans.detail.loads", undefined, "Loads")}</th>
                  <th>{t("console.sitePlans.detail.circuit", undefined, "Circuit")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {utilityRows.map((u) => (
                  <tr key={u.id}>
                    <td className="font-mono text-xs">{u.drop_code}</td>
                    <td className="font-mono text-xs">{u.service_type}</td>
                    <td className="font-mono text-[11px]">{u.loads?.join(", ") || "—"}</td>
                    <td className="font-mono text-xs">{u.circuit_id ?? "—"}</td>
                    <td className="text-end">
                      <DeleteFormBtn action={deleteUtility} id={u.id} sheetId={sp.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <InlineAddForm
            action={addUtility}
            sheetId={sp.id}
            submitLabel={t("console.sitePlans.detail.addDrop", undefined, "+ Drop")}
            fields={[
              {
                name: "drop_code",
                label: t("console.sitePlans.detail.drop", undefined, "Drop"),
                placeholder: "P-1",
                required: true,
                mono: true,
                maxLength: 40,
              },
              {
                name: "service_type",
                label: t("console.sitePlans.detail.service", undefined, "Service"),
                kind: "select",
                required: true,
                options: SITEPLAN_UTILITY_SERVICES.map((s) => ({ value: s, label: s })),
              },
              {
                name: "loads",
                label: t("console.sitePlans.detail.loadsComma", undefined, "Loads (Comma)"),
                placeholder: "CONV-1, RI-REF",
                maxLength: 400,
              },
              { name: "circuit_id", label: t("console.sitePlans.detail.circuit", undefined, "Circuit"), maxLength: 40 },
              { name: "notes", label: t("console.sitePlans.detail.notes", undefined, "Notes"), maxLength: 500 },
            ]}
          />
        </section>

        {/* ADJACENCIES */}
        <section className="surface p-4">
          <SectionHeader
            title={t("console.sitePlans.detail.adjacencies", undefined, "Adjacencies · §4.7")}
            count={adjRows.length}
          />
          {missingEdges.length > 0 && (
            <div className="mb-3 rounded-md border border-[var(--p-warning)] p-2 text-xs">
              {t("console.sitePlans.detail.missingEdgesPrefix", undefined, "Missing edges:")}{" "}
              <span className="font-mono">{missingEdges.join(", ")}</span>{" "}
              {t(
                "console.sitePlans.detail.missingEdgesSuffix",
                undefined,
                "· all four cardinal edges must be declared before issue.",
              )}
            </div>
          )}
          {adjRows.length === 0 ? (
            <Empty>
              {t(
                "console.sitePlans.detail.noAdjacencies",
                undefined,
                'No adjacencies declared. Each cardinal edge (N/S/E/W) must answer "what is on this side?"',
              )}
            </Empty>
          ) : (
            <table className="ps-table mt-3">
              <thead>
                <tr>
                  <th>{t("console.sitePlans.detail.edge", undefined, "Edge")}</th>
                  <th>{t("console.sitePlans.detail.relationship", undefined, "Relationship")}</th>
                  <th>{t("console.sitePlans.detail.adjacent", undefined, "Adjacent")}</th>
                  <th>{t("console.sitePlans.detail.notes", undefined, "Notes")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {adjRows.map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs">{a.edge}</td>
                    <td className="font-mono text-xs">{a.relationship}</td>
                    <td>
                      {a.adjacent_label ??
                        (a.adjacent_sheet_id
                          ? t("console.sitePlans.detail.linkedSheet", undefined, "(linked sheet)")
                          : "—")}
                    </td>
                    <td className="text-xs text-[var(--p-text-2)]">{a.notes ?? "—"}</td>
                    <td className="text-end">
                      <DeleteFormBtn action={deleteAdjacency} id={a.id} sheetId={sp.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <InlineAddForm
            action={addAdjacency}
            sheetId={sp.id}
            submitLabel={t("console.sitePlans.detail.addAdjacency", undefined, "+ Adjacency")}
            fields={[
              {
                name: "edge",
                label: t("console.sitePlans.detail.edge", undefined, "Edge"),
                kind: "select",
                required: true,
                options: SITEPLAN_EDGES.map((e) => ({ value: e, label: e })),
              },
              {
                name: "relationship",
                label: t("console.sitePlans.detail.relationship", undefined, "Relationship"),
                kind: "select",
                required: true,
                options: SITEPLAN_ADJACENCY_RELS.map((r) => ({ value: r, label: r })),
              },
              {
                name: "adjacent_label",
                label: t("console.sitePlans.detail.adjacent", undefined, "Adjacent"),
                placeholder: t("console.sitePlans.detail.adjacentPlaceholder", undefined, "SC Performer BOH"),
                maxLength: 120,
              },
              { name: "notes", label: t("console.sitePlans.detail.notes", undefined, "Notes"), maxLength: 500 },
            ]}
          />
        </section>

        {/* LEGACY REVISIONS + PINS */}
        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.sitePlans.detail.fileRevisions", undefined, "File Revisions")}
          </h3>
          {(revisions.data ?? []).length === 0 ? (
            <Empty>
              {t(
                "console.sitePlans.detail.noRevisions",
                undefined,
                "No file revisions yet. Upload one to render markups + pins.",
              )}
            </Empty>
          ) : (
            <table className="ps-table mt-3">
              <thead>
                <tr>
                  <th>{t("console.sitePlans.detail.rev", undefined, "Rev")}</th>
                  <th>{t("console.sitePlans.detail.uploaded", undefined, "Uploaded")}</th>
                  <th>{t("console.sitePlans.detail.notes", undefined, "Notes")}</th>
                </tr>
              </thead>
              <tbody>
                {(revisions.data ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.revision_label}</td>
                    <td className="font-mono text-xs">{fmtDate(r.uploaded_at)}</td>
                    <td>{r.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">{t("console.sitePlans.detail.pins", undefined, "Pins")}</h3>
          {(pins.data ?? []).length === 0 ? (
            <Empty>
              {t(
                "console.sitePlans.detail.noPins",
                undefined,
                "No pins yet. Pins link to RFIs, punch items, inspections, and zone callouts.",
              )}
            </Empty>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {(pins.data ?? []).map((pin) => {
                return (
                  <li key={pin.id} className="surface-inset p-2 text-xs">
                    <span className="font-mono text-[11px]">{pin.pin_type}</span> · {pin.label ?? "—"} ·
                    <span className="text-[var(--p-text-2)]">
                      {" "}
                      ({Number(pin.x_pct).toFixed(0)}%, {Number(pin.y_pct).toFixed(0)}%)
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <ConversationPanel orgId={session.orgId} recordType="site_plan" recordId={id} />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Server-component-friendly helpers (no client state needed).
// ---------------------------------------------------------------------------

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold">{title}</h3>
      <span className="text-xs text-[var(--p-text-2)]">{count}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs text-[var(--p-text-2)]">{children}</p>;
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] tracking-wide text-[var(--p-text-2)] uppercase">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

// One-click delete form. Renders a tiny client form (uses React 19 form action).
function DeleteFormBtn({
  action,
  id,
  sheetId,
}: {
  action: (prev: { error?: string; ok?: true } | null, fd: FormData) => Promise<{ error?: string; ok?: true } | null>;
  id: string;
  sheetId: string;
}) {
  // Wrap the (prev, fd) signature into a bare (fd) for raw <form action>.
  async function wrapped(fd: FormData) {
    "use server";
    await action(null, fd);
  }
  return (
    <form action={wrapped} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="sheet_id" value={sheetId} />
      <button
        type="submit"
        className="text-[11px] font-medium text-[var(--p-text-2)] hover:text-[var(--p-danger)]"
        aria-label="Delete"
      >
        ×
      </button>
    </form>
  );
}
