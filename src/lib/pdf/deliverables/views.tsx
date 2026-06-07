import "server-only";

import React from "react";
import { Text, View, Image } from "@react-pdf/renderer";
import { PdfTable, SectionHeading, styles } from "../layout";
import type {
  TechnicalRiderData,
  HospitalityRiderData,
  InputListData,
  StagePlotData,
  CrewListData,
  GuestListData,
  EquipmentPullListData,
  PowerPlanData,
  RiggingPlanData,
  SitePlanData,
  BuildScheduleData,
  VendorPackageData,
  SafetyComplianceData,
  CommsPlanData,
  SignageGridData,
  CustomData,
} from "../schemas/deliverables";

/**
 * Per-deliverable-type React-PDF views — Opportunity #2.
 *
 * Each renderer accepts the narrowed Zod-parsed data for its type and
 * produces the body of a `<BrandedPage>`. The cover page + branding +
 * classification banner come from the surrounding `DeliverablePdf` in
 * `index.tsx` which composes these via the registry.
 *
 * All views fit on a single page where possible (they reuse the shared
 * `PdfTable` + `SectionHeading` primitives so rhythm is consistent).
 *
 * i18n note: these views are composed via the registry (`renderDeliverable`)
 * which only threads `data` today — the registry signature lives in
 * `registry.tsx` / `document.tsx` (outside this file). Each view therefore
 * accepts an OPTIONAL `t` prop that defaults to the identity fallback, so the
 * English strings are centralized under `pdf.deliverablesViews.*` and become
 * locale-aware as soon as the registry render signature is widened to pass a
 * request-scoped translator through.
 */

/** Request-scoped translator: `t(key, vars?, fallback?)`. */
export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/** Identity fallback used when no translator is threaded in (registry path today). */
const identityT: Translator = (_k, _v, fb) => fb ?? "";

export function TechnicalRiderView({ data }: { data: TechnicalRiderData }) {
  return (
    <>
      {data.sections.map((s, i) => (
        <View key={i}>
          <SectionHeading title={s.heading} />
          {s.body ? <Text style={styles.p}>{s.body}</Text> : null}
          {s.items?.map((it, j) => (
            <Text key={j} style={{ marginBottom: 2 }}>
              • {it}
            </Text>
          ))}
        </View>
      ))}
    </>
  );
}

export const HospitalityRiderView = TechnicalRiderView as (p: { data: HospitalityRiderData }) => React.JSX.Element;

export function InputListView({ data, t = identityT }: { data: InputListData; t?: Translator }) {
  return (
    <>
      <SectionHeading title={t("pdf.deliverablesViews.inputList.heading", undefined, "Input List")} />
      <PdfTable
        columns={[
          {
            key: "channel",
            label: t("pdf.deliverablesViews.inputList.colCh", undefined, "Ch"),
            width: 0.5,
            align: "center",
          },
          { key: "name", label: t("pdf.deliverablesViews.inputList.colSource", undefined, "Source"), width: 3 },
          { key: "mic", label: t("pdf.deliverablesViews.inputList.colMic", undefined, "Mic/DI"), width: 2 },
          { key: "insert", label: t("pdf.deliverablesViews.inputList.colInsert", undefined, "Insert"), width: 1.5 },
          { key: "note", label: t("pdf.deliverablesViews.inputList.colNote", undefined, "Note"), width: 2 },
        ]}
        rows={data.entries.map((e) => ({
          channel: String(e.channel),
          name: e.name + (e.source ? ` (${e.source})` : ""),
          mic: e.mic ?? "",
          insert: e.insert ?? "",
          note: e.note ?? "",
        }))}
      />
    </>
  );
}

export function StagePlotView({ data, t = identityT }: { data: StagePlotData; t?: Translator }) {
  return (
    <>
      {data.svgUrl ? (
        <>
          <SectionHeading title={t("pdf.deliverablesViews.stagePlot.heading", undefined, "Stage Plot")} />
          <Image src={data.svgUrl} style={{ width: "100%", maxHeight: 380, objectFit: "contain" }} />
        </>
      ) : (
        <>
          <SectionHeading
            title={t("pdf.deliverablesViews.stagePlot.elementsHeading", undefined, "Stage Plot Elements")}
          />
          <PdfTable
            columns={[
              { key: "label", label: t("pdf.deliverablesViews.stagePlot.colElement", undefined, "Element"), width: 3 },
              { key: "kind", label: t("pdf.deliverablesViews.stagePlot.colKind", undefined, "Kind"), width: 2 },
              {
                key: "position",
                label: t("pdf.deliverablesViews.stagePlot.colPosition", undefined, "Position"),
                width: 2,
              },
              {
                key: "rotation",
                label: t("pdf.deliverablesViews.stagePlot.colRot", undefined, "Rot"),
                width: 1,
                align: "center",
              },
            ]}
            rows={data.elements.map((e) => ({
              label: e.label,
              kind: e.kind ?? "",
              position: e.x !== undefined && e.y !== undefined ? `${e.x}, ${e.y}` : "",
              rotation: e.rotation !== undefined ? `${e.rotation}°` : "",
            }))}
          />
        </>
      )}
      {data.notes ? <Text style={styles.p}>{data.notes}</Text> : null}
    </>
  );
}

export function CrewListView({ data, t = identityT }: { data: CrewListData; t?: Translator }) {
  return (
    <>
      <SectionHeading title={t("pdf.deliverablesViews.crewList.heading", undefined, "Crew List")} />
      <PdfTable
        columns={[
          { key: "name", label: t("pdf.deliverablesViews.crewList.colName", undefined, "Name"), width: 3 },
          { key: "role", label: t("pdf.deliverablesViews.crewList.colRole", undefined, "Role"), width: 2.5 },
          { key: "dept", label: t("pdf.deliverablesViews.crewList.colDept", undefined, "Dept"), width: 2 },
          { key: "call", label: t("pdf.deliverablesViews.crewList.colCall", undefined, "Call"), width: 1.5 },
          { key: "contact", label: t("pdf.deliverablesViews.crewList.colContact", undefined, "Contact"), width: 3 },
        ]}
        rows={data.entries.map((e) => ({
          name: e.name,
          role: e.role ?? "",
          dept: e.department ?? "",
          call: e.call ?? "",
          contact: [e.phone, e.email].filter(Boolean).join(" · "),
        }))}
      />
    </>
  );
}

export function GuestListView({ data, t = identityT }: { data: GuestListData; t?: Translator }) {
  return (
    <>
      <SectionHeading title={t("pdf.deliverablesViews.guestList.heading", undefined, "Guest List")} />
      <PdfTable
        columns={[
          { key: "name", label: t("pdf.deliverablesViews.guestList.colName", undefined, "Name"), width: 4 },
          { key: "plus_ones", label: "+", width: 0.6, align: "center" },
          { key: "tier", label: t("pdf.deliverablesViews.guestList.colTier", undefined, "Tier"), width: 2 },
          { key: "note", label: t("pdf.deliverablesViews.guestList.colNote", undefined, "Note"), width: 3 },
        ]}
        rows={data.entries.map((e) => ({
          name: e.name,
          plus_ones: e.plus_ones !== undefined ? String(e.plus_ones) : "",
          tier: e.credential_tier ?? "",
          note: e.note ?? "",
        }))}
      />
    </>
  );
}

export function EquipmentPullListView({ data, t = identityT }: { data: EquipmentPullListData; t?: Translator }) {
  return (
    <>
      <SectionHeading title={t("pdf.deliverablesViews.equipmentPullList.heading", undefined, "Equipment Pull List")} />
      <PdfTable
        columns={[
          {
            key: "qty",
            label: t("pdf.deliverablesViews.equipmentPullList.colQty", undefined, "Qty"),
            width: 0.8,
            align: "center",
          },
          { key: "item", label: t("pdf.deliverablesViews.equipmentPullList.colItem", undefined, "Item"), width: 4 },
          {
            key: "category",
            label: t("pdf.deliverablesViews.equipmentPullList.colCategory", undefined, "Category"),
            width: 2,
          },
          { key: "note", label: t("pdf.deliverablesViews.equipmentPullList.colNote", undefined, "Note"), width: 2.5 },
        ]}
        rows={data.entries.map((e) => ({
          qty: String(e.qty),
          item: e.item,
          category: e.category ?? "",
          note: e.note ?? "",
        }))}
      />
    </>
  );
}

export function PowerPlanView({ data, t = identityT }: { data: PowerPlanData; t?: Translator }) {
  return (
    <>
      <SectionHeading title={t("pdf.deliverablesViews.powerPlan.servicesHeading", undefined, "Power Services")} />
      <PdfTable
        columns={[
          { key: "location", label: t("pdf.deliverablesViews.powerPlan.colLocation", undefined, "Location"), width: 3 },
          { key: "amperage", label: t("pdf.deliverablesViews.powerPlan.colAmps", undefined, "Amps"), width: 1 },
          { key: "voltage", label: t("pdf.deliverablesViews.powerPlan.colVolts", undefined, "Volts"), width: 1 },
          { key: "phase", label: t("pdf.deliverablesViews.powerPlan.colPhase", undefined, "Phase"), width: 1 },
          { key: "source", label: t("pdf.deliverablesViews.powerPlan.colSource", undefined, "Source"), width: 2 },
          { key: "note", label: t("pdf.deliverablesViews.powerPlan.colNote", undefined, "Note"), width: 2 },
        ]}
        rows={data.services.map((s) => ({
          location: s.location,
          amperage: s.amperage ?? "",
          voltage: s.voltage ?? "",
          phase: s.phase ?? "",
          source: s.source ?? "",
          note: s.note ?? "",
        }))}
      />
      {data.generators.length > 0 ? (
        <>
          <SectionHeading title={t("pdf.deliverablesViews.powerPlan.generatorsHeading", undefined, "Generators")} />
          <PdfTable
            columns={[
              { key: "label", label: t("pdf.deliverablesViews.powerPlan.colUnit", undefined, "Unit"), width: 2 },
              {
                key: "kw",
                label: t("pdf.deliverablesViews.powerPlan.colKw", undefined, "kW"),
                width: 1,
                align: "right",
              },
              { key: "fuel", label: t("pdf.deliverablesViews.powerPlan.colFuel", undefined, "Fuel"), width: 1.5 },
              {
                key: "location",
                label: t("pdf.deliverablesViews.powerPlan.colLocation", undefined, "Location"),
                width: 3,
              },
            ]}
            rows={data.generators.map((g) => ({
              label: g.label,
              kw: g.kw !== undefined ? String(g.kw) : "",
              fuel: g.fuel ?? "",
              location: g.location ?? "",
            }))}
          />
        </>
      ) : null}
    </>
  );
}

export function RiggingPlanView({ data, t = identityT }: { data: RiggingPlanData; t?: Translator }) {
  return (
    <>
      <SectionHeading title={t("pdf.deliverablesViews.riggingPlan.heading", undefined, "Rigging Points")} />
      <PdfTable
        columns={[
          { key: "label", label: t("pdf.deliverablesViews.riggingPlan.colPoint", undefined, "Point"), width: 2 },
          {
            key: "capacity",
            label: t("pdf.deliverablesViews.riggingPlan.colCapacity", undefined, "Cap · lbs"),
            width: 1.5,
            align: "right",
          },
          {
            key: "height",
            label: t("pdf.deliverablesViews.riggingPlan.colHeight", undefined, "Height · ft"),
            width: 1.5,
            align: "right",
          },
          { key: "note", label: t("pdf.deliverablesViews.riggingPlan.colNote", undefined, "Note"), width: 3 },
        ]}
        rows={data.points.map((p) => ({
          label: p.label,
          capacity: p.capacity_lbs !== undefined ? String(p.capacity_lbs) : "",
          height: p.height_ft !== undefined ? String(p.height_ft) : "",
          note: p.note ?? "",
        }))}
      />
      {data.notes ? <Text style={styles.p}>{data.notes}</Text> : null}
    </>
  );
}

export function SitePlanView({ data, t = identityT }: { data: SitePlanData; t?: Translator }) {
  return (
    <>
      {data.svgUrl ? (
        <>
          <SectionHeading title={t("pdf.deliverablesViews.sitePlan.heading", undefined, "Site Plan")} />
          <Image src={data.svgUrl} style={{ width: "100%", maxHeight: 380, objectFit: "contain" }} />
        </>
      ) : null}
      <SectionHeading title={t("pdf.deliverablesViews.sitePlan.zonesHeading", undefined, "Zones")} />
      {data.zones.map((z, i) => (
        <View key={i} style={{ marginBottom: 4 }}>
          <Text style={{ fontWeight: 700 }}>{z.name}</Text>
          {z.description ? <Text>{z.description}</Text> : null}
          {z.contact ? <Text style={{ fontSize: 9, color: "#555" }}>{z.contact}</Text> : null}
        </View>
      ))}
    </>
  );
}

export function BuildScheduleView({ data, t = identityT }: { data: BuildScheduleData; t?: Translator }) {
  return (
    <>
      <SectionHeading title={t("pdf.deliverablesViews.buildSchedule.heading", undefined, "Build Schedule")} />
      <PdfTable
        columns={[
          { key: "day", label: t("pdf.deliverablesViews.buildSchedule.colDay", undefined, "Day"), width: 1.5 },
          { key: "time", label: t("pdf.deliverablesViews.buildSchedule.colTime", undefined, "Time"), width: 1.5 },
          {
            key: "activity",
            label: t("pdf.deliverablesViews.buildSchedule.colActivity", undefined, "Activity"),
            width: 3,
          },
          { key: "crew", label: t("pdf.deliverablesViews.buildSchedule.colCrew", undefined, "Crew"), width: 2 },
          { key: "note", label: t("pdf.deliverablesViews.buildSchedule.colNote", undefined, "Note"), width: 2 },
        ]}
        rows={data.entries.map((e) => ({
          day: e.day,
          time: e.time ?? "",
          activity: e.activity,
          crew: e.crew ?? "",
          note: e.note ?? "",
        }))}
      />
    </>
  );
}

export function VendorPackageView({ data, t = identityT }: { data: VendorPackageData; t?: Translator }) {
  return (
    <>
      {data.vendor_name ? (
        <SectionHeading
          eyebrow={t("pdf.deliverablesViews.vendorPackage.vendorEyebrow", undefined, "Vendor")}
          title={data.vendor_name}
        />
      ) : null}
      <SectionHeading title={t("pdf.deliverablesViews.vendorPackage.deliverablesHeading", undefined, "Deliverables")} />
      <PdfTable
        columns={[
          {
            key: "name",
            label: t("pdf.deliverablesViews.vendorPackage.colDeliverable", undefined, "Deliverable"),
            width: 4,
          },
          { key: "due", label: t("pdf.deliverablesViews.vendorPackage.colDue", undefined, "Due"), width: 2 },
          { key: "status", label: t("pdf.deliverablesViews.vendorPackage.colStatus", undefined, "Status"), width: 2 },
        ]}
        rows={data.deliverables.map((d) => ({
          name: d.name,
          due: d.due ?? "",
          status: d.status ?? "",
        }))}
      />
      {data.notes ? <Text style={styles.p}>{data.notes}</Text> : null}
    </>
  );
}

export function SafetyComplianceView({ data, t = identityT }: { data: SafetyComplianceData; t?: Translator }) {
  return (
    <>
      <SectionHeading
        title={t("pdf.deliverablesViews.safetyCompliance.heading", undefined, "Safety + compliance checklist")}
      />
      <PdfTable
        columns={[
          { key: "topic", label: t("pdf.deliverablesViews.safetyCompliance.colTopic", undefined, "Topic"), width: 2 },
          {
            key: "requirement",
            label: t("pdf.deliverablesViews.safetyCompliance.colRequirement", undefined, "Requirement"),
            width: 4,
          },
          { key: "owner", label: t("pdf.deliverablesViews.safetyCompliance.colOwner", undefined, "Owner"), width: 2 },
          {
            key: "status",
            label: t("pdf.deliverablesViews.safetyCompliance.colStatus", undefined, "Status"),
            width: 1.5,
          },
        ]}
        rows={data.items.map((it) => ({
          topic: it.topic,
          requirement: it.requirement,
          owner: it.owner ?? "",
          status: it.status ?? "",
        }))}
      />
    </>
  );
}

export function CommsPlanView({ data, t = identityT }: { data: CommsPlanData; t?: Translator }) {
  return (
    <>
      <SectionHeading title={t("pdf.deliverablesViews.commsPlan.radioChannelsHeading", undefined, "Radio Channels")} />
      <PdfTable
        columns={[
          { key: "channel", label: t("pdf.deliverablesViews.commsPlan.colChannel", undefined, "Channel"), width: 1 },
          { key: "purpose", label: t("pdf.deliverablesViews.commsPlan.colPurpose", undefined, "Purpose"), width: 4 },
        ]}
        rows={data.channels.map((c) => ({ channel: c.channel, purpose: c.purpose }))}
      />
      {data.codeWords.length > 0 ? (
        <>
          <SectionHeading title={t("pdf.deliverablesViews.commsPlan.codeWordsHeading", undefined, "Code Words")} />
          {data.codeWords.map((c, i) => (
            <Text key={i}>
              <Text style={{ fontWeight: 700 }}>{c.code}</Text> — {c.meaning}
            </Text>
          ))}
        </>
      ) : null}
    </>
  );
}

export function SignageGridView({ data, t = identityT }: { data: SignageGridData; t?: Translator }) {
  return (
    <>
      <SectionHeading title={t("pdf.deliverablesViews.signageGrid.heading", undefined, "Signage Grid")} />
      <PdfTable
        columns={[
          {
            key: "location",
            label: t("pdf.deliverablesViews.signageGrid.colLocation", undefined, "Location"),
            width: 3,
          },
          { key: "type", label: t("pdf.deliverablesViews.signageGrid.colType", undefined, "Type"), width: 2 },
          { key: "size", label: t("pdf.deliverablesViews.signageGrid.colSize", undefined, "Size"), width: 1.5 },
          {
            key: "install",
            label: t("pdf.deliverablesViews.signageGrid.colInstall", undefined, "Install"),
            width: 1.5,
          },
          { key: "strike", label: t("pdf.deliverablesViews.signageGrid.colStrike", undefined, "Strike"), width: 1.5 },
          { key: "note", label: t("pdf.deliverablesViews.signageGrid.colNote", undefined, "Note"), width: 2 },
        ]}
        rows={data.entries.map((e) => ({
          location: e.location,
          type: e.type,
          size: e.size ?? "",
          install: e.install ?? "",
          strike: e.strike ?? "",
          note: e.note ?? "",
        }))}
      />
    </>
  );
}

export function CustomView({ data }: { data: CustomData }) {
  return (
    <>
      {data.sections.map((s, i) => (
        <View key={i}>
          <SectionHeading title={s.heading} />
          <Text style={styles.p}>{s.body}</Text>
        </View>
      ))}
    </>
  );
}

/** Generic fallback for types we don't (yet) have a specialized renderer for. */
export function GenericDeliverableView({ data, t = identityT }: { data: unknown; t?: Translator }) {
  return (
    <>
      <SectionHeading title={t("pdf.deliverablesViews.generic.heading", undefined, "Deliverable Data")} />
      <Text style={{ fontFamily: "Courier", fontSize: 9 }}>{JSON.stringify(data, null, 2)}</Text>
    </>
  );
}
