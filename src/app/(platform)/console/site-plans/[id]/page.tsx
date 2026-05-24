import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import {
  SITEPLAN_ADJACENCY_RELS,
  SITEPLAN_BAND_TYPES,
  SITEPLAN_EDGES,
  SITEPLAN_UTILITY_SERVICES,
  type SitePlanAdjacency,
  type SitePlanBand,
  type SitePlanPlacement,
  type SitePlanSheet,
  type SitePlanStation,
  type SitePlanUtility,
  type SitePlanZoneRegion,
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
  const loose = supabase as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const fmtDate = (iso: string): string => fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });

  const { data: sheet } = await supabase
    .from("site_plans")
    .select("*, project:project_id(name), venue:venue_id(name), event:event_id(name)")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!sheet) notFound();
  const sp = sheet as unknown as SitePlanSheet & {
    project: { name: string | null } | null;
    venue: { name: string | null } | null;
    event: { name: string | null } | null;
  };

  const [regions, bands, stations, placements, utilities, adjacencies, acceptance, revisions, pins] = await Promise.all(
    [
      loose.from("siteplan_zone_region").select("*").eq("sheet_id", id).order("code"),
      loose.from("siteplan_band").select("*").eq("sheet_id", id).order("created_at"),
      loose.from("siteplan_station").select("*").eq("sheet_id", id).order("station_code"),
      loose.from("siteplan_placement").select("*").eq("sheet_id", id).order("tag"),
      loose.from("siteplan_utility").select("*").eq("sheet_id", id).order("drop_code"),
      loose.from("siteplan_adjacency").select("*").eq("sheet_id", id).order("edge"),
      loose.from("v_siteplan_sheet_acceptance").select("*").eq("sheet_id", id).maybeSingle(),
      supabase
        .from("site_plan_revisions")
        .select("*")
        .eq("site_plan_id", id)
        .order("uploaded_at", { ascending: false }),
      supabase.from("site_plan_pins").select("*").eq("site_plan_id", id).order("created_at", { ascending: false }),
    ],
  );

  const regionRows = (regions.data ?? []) as unknown as SitePlanZoneRegion[];
  const bandRows = (bands.data ?? []) as unknown as SitePlanBand[];
  const stationRows = (stations.data ?? []) as unknown as SitePlanStation[];
  const placementRows = (placements.data ?? []) as unknown as SitePlanPlacement[];
  const utilityRows = (utilities.data ?? []) as unknown as SitePlanUtility[];
  const adjRows = (adjacencies.data ?? []) as unknown as SitePlanAdjacency[];
  const acc = acceptance.data as
    | (Record<string, boolean | string | null> & { sheet_id: string; document_state: string })
    | null;

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
        eyebrow="Creative · Site Plans"
        breadcrumbs={[{ label: "Site Plans", href: "/console/site-plans" }, { label: sp.atom_id ?? sp.code }]}
        title={sp.title}
        subtitle={
          <span className="flex items-center gap-2 text-xs">
            {sp.atom_id ? (
              <span className="font-mono">{sp.atom_id}</span>
            ) : (
              <span className="text-[var(--text-muted)]">— no atom id —</span>
            )}
            <span>·</span>
            <Badge variant={STATE_TONE[sp.document_state]}>{STATE_LABEL[sp.document_state]}</Badge>
            <Badge variant="muted">{sp.sheet_type}</Badge>
            <Badge variant="info">Rev {sp.revision_letter}</Badge>
          </span>
        }
        action={
          <Button href={`/console/site-plans/${sp.id}/edit`} variant="secondary" size="sm">
            Edit
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {/* TRANSITION BAR */}
        <TransitionBar sheetId={sp.id} transitions={legalTransitions} labels={TRANSITION_LABEL} />

        {/* SUMMARY GRID */}
        <section className="surface p-4">
          <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase">Sheet</h3>
          <dl className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <SummaryItem
              label="XPMS Class"
              value={sp.primary_class != null ? XPMS_CLASS_LABEL[sp.primary_class] : "—"}
            />
            <SummaryItem label="Tier" value={sp.tier_primary != null ? `Tier ${sp.tier_primary}` : "—"} />
            <SummaryItem label="Sheet Type" value={sp.sheet_type} />
            <SummaryItem label="Code" value={sp.code} />
            <SummaryItem label="Shell" value={sp.shell_type ?? "—"} />
            <SummaryItem
              label="Dimensions"
              value={
                dims
                  ? `${dims.length_in}" × ${dims.width_in}" × ${dims.height_in}" · ${dims.gross_sqft ?? "?"} sqft`
                  : "—"
              }
            />
            <SummaryItem label="Orientation" value={sp.orientation_deg != null ? `${sp.orientation_deg}°` : "—"} />
            <SummaryItem label="Scale" value={sp.scale ?? "—"} />
            <SummaryItem label="Project" value={sp.project?.name ?? "—"} />
            <SummaryItem label="Event" value={sp.event?.name ?? "—"} />
            <SummaryItem label="Venue" value={sp.venue?.name ?? "—"} />
            <SummaryItem label="Issued" value={sp.issued_at ? fmtDate(sp.issued_at) : "—"} />
          </dl>
        </section>

        {/* ACCEPTANCE CHECKLIST (§8.3) */}
        <section className="surface p-4">
          <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase">Acceptance · §8.3</h3>
          {acc ? (
            <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
              {ACCEPTANCE_ITEMS.map((it) => {
                const ok = Boolean(acc[it.key]);
                return (
                  <li key={it.key} className="flex items-center gap-2 text-xs">
                    <span
                      aria-hidden="true"
                      className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-[var(--color-success)]" : "bg-[var(--color-warning)]"}`}
                    />
                    <span>{it.label}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Acceptance snapshot unavailable.</p>
          )}
          {violations.length > 0 && (
            <div className="mt-3 rounded-md border border-[var(--color-warning)] bg-[var(--color-warning-subtle,transparent)] p-3 text-xs">
              <div className="font-semibold tracking-wide uppercase">Placement Law Violations (§9)</div>
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
          <SectionHeader title="Zone Regions" count={regionRows.length} />
          {regionRows.length === 0 ? (
            <Empty>No zone regions yet. Add Cold / Cook / Pass / Hold zones to anchor bands.</Empty>
          ) : (
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Label</th>
                  <th>Class</th>
                  <th>Notes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {regionRows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.code}</td>
                    <td>{r.label}</td>
                    <td className="font-mono text-xs">{r.class_tag != null ? XPMS_CLASS_LABEL[r.class_tag] : "—"}</td>
                    <td className="text-xs text-[var(--text-muted)]">{r.notes ?? "—"}</td>
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
            submitLabel="+ Region"
            fields={[
              { name: "code", label: "Code", placeholder: "COLD", required: true, mono: true, maxLength: 16 },
              { name: "label", label: "Label", placeholder: "Cold Zone", required: true, maxLength: 80 },
              {
                name: "class_tag",
                label: "Class",
                kind: "select",
                options: [
                  { value: "", label: "—" },
                  ...Object.entries(XPMS_CLASS_LABEL).map(([v, l]) => ({ value: v, label: l })),
                ],
              },
              { name: "notes", label: "Notes", maxLength: 500 },
            ]}
          />
        </section>

        {/* BANDS */}
        <section className="surface p-4">
          <SectionHeader title="Bands · §6" count={bandRows.length} />
          {bandRows.length === 0 ? (
            <Empty>
              No bands yet. Bands are the canonical name for blue/orange lines — every linear surface is one.
            </Empty>
          ) : (
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Edge</th>
                  <th>Depth</th>
                  <th>Label</th>
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
            submitLabel="+ Band"
            fields={[
              {
                name: "band_type",
                label: "Type",
                kind: "select",
                required: true,
                options: SITEPLAN_BAND_TYPES.map((t) => ({ value: t, label: t })),
              },
              {
                name: "edge",
                label: "Edge",
                kind: "select",
                required: true,
                options: SITEPLAN_EDGES.map((e) => ({ value: e, label: e })),
              },
              { name: "depth_in", label: 'Depth (")', type: "number" },
              { name: "label", label: "Label", maxLength: 80 },
            ]}
          />
        </section>

        {/* STATIONS */}
        <section className="surface p-4">
          <SectionHeader title="Stations" count={stationRows.length} />
          {stationRows.length === 0 ? (
            <Empty>No stations yet. A station is a discrete work position on a band (PREP-1, PLATE-1, EXPO-1).</Empty>
          ) : (
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Band</th>
                  <th>Function</th>
                  <th>Heads</th>
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
                        {band ? `${band.band_type}/${band.edge}` : <span className="text-[var(--text-muted)]">—</span>}
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
              submitLabel="+ Station"
              fields={[
                {
                  name: "station_code",
                  label: "Code",
                  placeholder: "PREP-1",
                  required: true,
                  mono: true,
                  maxLength: 40,
                },
                {
                  name: "band_id",
                  label: "Band",
                  kind: "select",
                  required: true,
                  options: bandRows.map((b) => ({
                    value: b.id,
                    label: `${b.band_type}/${b.edge}${b.label ? ` (${b.label})` : ""}`,
                  })),
                },
                { name: "function", label: "Function", placeholder: "prep", maxLength: 60 },
                { name: "head_count", label: "Heads", type: "number", defaultValue: "1" },
                { name: "position_in", label: "Position", type: "number" },
              ]}
            />
          )}
        </section>

        {/* PLACEMENTS */}
        <section className="surface p-4">
          <SectionHeader title="Placements · §4.5" count={placementRows.length} />
          {placementRows.length === 0 ? (
            <Empty>No placements yet. A placement records that a UAC catalog item sits on this sheet at a tag.</Empty>
          ) : (
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Station</th>
                  <th>Band</th>
                  <th>UAC</th>
                  <th>Qty</th>
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
            submitLabel="+ Placement"
            fields={[
              { name: "tag", label: "Tag", placeholder: "CONV-1", required: true, mono: true, maxLength: 40 },
              {
                name: "station_id",
                label: "Station",
                kind: "select",
                options: [
                  { value: "", label: "—" },
                  ...stationRows.map((s) => ({ value: s.id, label: s.station_code })),
                ],
              },
              {
                name: "band_id",
                label: "Band",
                kind: "select",
                options: [
                  { value: "", label: "—" },
                  ...bandRows.map((b) => ({ value: b.id, label: `${b.band_type}/${b.edge}` })),
                ],
              },
              { name: "uac_atom_id", label: "UAC Atom", placeholder: "LYTE-...", mono: true, maxLength: 80 },
              { name: "qty", label: "Qty", type: "number", defaultValue: "1" },
              { name: "notes", label: "Notes", maxLength: 500 },
            ]}
          />
        </section>

        {/* UTILITIES */}
        <section className="surface p-4">
          <SectionHeader title="Utilities · §4.6" count={utilityRows.length} />
          {utilityRows.length === 0 ? (
            <Empty>No utility drops yet. Drops are power, gas, water, drain, data, and comms hand-offs.</Empty>
          ) : (
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Drop</th>
                  <th>Service</th>
                  <th>Loads</th>
                  <th>Circuit</th>
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
            submitLabel="+ Drop"
            fields={[
              { name: "drop_code", label: "Drop", placeholder: "P-1", required: true, mono: true, maxLength: 40 },
              {
                name: "service_type",
                label: "Service",
                kind: "select",
                required: true,
                options: SITEPLAN_UTILITY_SERVICES.map((s) => ({ value: s, label: s })),
              },
              { name: "loads", label: "Loads (comma)", placeholder: "CONV-1, RI-REF", maxLength: 400 },
              { name: "circuit_id", label: "Circuit", maxLength: 40 },
              { name: "notes", label: "Notes", maxLength: 500 },
            ]}
          />
        </section>

        {/* ADJACENCIES */}
        <section className="surface p-4">
          <SectionHeader title="Adjacencies · §4.7" count={adjRows.length} />
          {missingEdges.length > 0 && (
            <div className="mb-3 rounded-md border border-[var(--color-warning)] p-2 text-xs">
              Missing edges: <span className="font-mono">{missingEdges.join(", ")}</span> — all four cardinal edges must
              be declared before issue.
            </div>
          )}
          {adjRows.length === 0 ? (
            <Empty>No adjacencies declared. Each cardinal edge (N/S/E/W) must answer "what is on this side?"</Empty>
          ) : (
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Edge</th>
                  <th>Relationship</th>
                  <th>Adjacent</th>
                  <th>Notes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {adjRows.map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs">{a.edge}</td>
                    <td className="font-mono text-xs">{a.relationship}</td>
                    <td>{a.adjacent_label ?? (a.adjacent_sheet_id ? "(linked sheet)" : "—")}</td>
                    <td className="text-xs text-[var(--text-muted)]">{a.notes ?? "—"}</td>
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
            submitLabel="+ Adjacency"
            fields={[
              {
                name: "edge",
                label: "Edge",
                kind: "select",
                required: true,
                options: SITEPLAN_EDGES.map((e) => ({ value: e, label: e })),
              },
              {
                name: "relationship",
                label: "Relationship",
                kind: "select",
                required: true,
                options: SITEPLAN_ADJACENCY_RELS.map((r) => ({ value: r, label: r })),
              },
              { name: "adjacent_label", label: "Adjacent", placeholder: "SC Performer BOH", maxLength: 120 },
              { name: "notes", label: "Notes", maxLength: 500 },
            ]}
          />
        </section>

        {/* LEGACY REVISIONS + PINS */}
        <section className="surface p-4">
          <h3 className="text-sm font-semibold">File Revisions</h3>
          {(revisions.data ?? []).length === 0 ? (
            <Empty>No file revisions yet. Upload one to render markups + pins.</Empty>
          ) : (
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Rev</th>
                  <th>Uploaded</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(revisions.data ?? []).map((r) => (
                  <tr key={(r as { id: string }).id}>
                    <td className="font-mono text-xs">{(r as { revision_label: string }).revision_label}</td>
                    <td className="font-mono text-xs">{fmtDate((r as { uploaded_at: string }).uploaded_at)}</td>
                    <td>{(r as { notes: string | null }).notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Pins</h3>
          {(pins.data ?? []).length === 0 ? (
            <Empty>No pins yet. Pins link to RFIs, punch items, inspections, and zone callouts.</Empty>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {(pins.data ?? []).map((p) => {
                const pin = p as { id: string; pin_type: string; label: string | null; x_pct: number; y_pct: number };
                return (
                  <li key={pin.id} className="surface-inset p-2 text-xs">
                    <span className="font-mono text-[10px]">{pin.pin_type}</span> · {pin.label ?? "—"} ·
                    <span className="text-[var(--text-muted)]">
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
      <span className="text-xs text-[var(--text-muted)]">{count}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs text-[var(--text-muted)]">{children}</p>;
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] tracking-wide text-[var(--text-muted)] uppercase">{label}</dt>
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
        className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--color-error)]"
        aria-label="Delete"
      >
        ×
      </button>
    </form>
  );
}
