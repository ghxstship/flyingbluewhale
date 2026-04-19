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
 */

export function TechnicalRiderView({ data }: { data: TechnicalRiderData }) {
  return (
    <>
      {data.sections.map((s, i) => (
        <View key={i}>
          <SectionHeading title={s.heading} />
          {s.body ? <Text style={styles.p}>{s.body}</Text> : null}
          {s.items?.map((it, j) => (
            <Text key={j} style={{ marginBottom: 2 }}>• {it}</Text>
          ))}
        </View>
      ))}
    </>
  );
}

export const HospitalityRiderView = TechnicalRiderView as (p: { data: HospitalityRiderData }) => React.JSX.Element;

export function InputListView({ data }: { data: InputListData }) {
  return (
    <>
      <SectionHeading title="Input list" />
      <PdfTable
        columns={[
          { key: "channel", label: "Ch", width: 0.5, align: "center" },
          { key: "name", label: "Source", width: 3 },
          { key: "mic", label: "Mic/DI", width: 2 },
          { key: "insert", label: "Insert", width: 1.5 },
          { key: "note", label: "Note", width: 2 },
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

export function StagePlotView({ data }: { data: StagePlotData }) {
  return (
    <>
      {data.svgUrl ? (
        <>
          <SectionHeading title="Stage plot" />
          <Image src={data.svgUrl} style={{ width: "100%", maxHeight: 380, objectFit: "contain" }} />
        </>
      ) : (
        <>
          <SectionHeading title="Stage plot elements" />
          <PdfTable
            columns={[
              { key: "label", label: "Element", width: 3 },
              { key: "kind", label: "Kind", width: 2 },
              { key: "position", label: "Position", width: 2 },
              { key: "rotation", label: "Rot", width: 1, align: "center" },
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

export function CrewListView({ data }: { data: CrewListData }) {
  return (
    <>
      <SectionHeading title="Crew list" />
      <PdfTable
        columns={[
          { key: "name", label: "Name", width: 3 },
          { key: "role", label: "Role", width: 2.5 },
          { key: "dept", label: "Dept", width: 2 },
          { key: "call", label: "Call", width: 1.5 },
          { key: "contact", label: "Contact", width: 3 },
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

export function GuestListView({ data }: { data: GuestListData }) {
  return (
    <>
      <SectionHeading title="Guest list" />
      <PdfTable
        columns={[
          { key: "name", label: "Name", width: 4 },
          { key: "plus_ones", label: "+", width: 0.6, align: "center" },
          { key: "tier", label: "Tier", width: 2 },
          { key: "note", label: "Note", width: 3 },
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

export function EquipmentPullListView({ data }: { data: EquipmentPullListData }) {
  return (
    <>
      <SectionHeading title="Equipment pull list" />
      <PdfTable
        columns={[
          { key: "qty", label: "Qty", width: 0.8, align: "center" },
          { key: "item", label: "Item", width: 4 },
          { key: "category", label: "Category", width: 2 },
          { key: "note", label: "Note", width: 2.5 },
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

export function PowerPlanView({ data }: { data: PowerPlanData }) {
  return (
    <>
      <SectionHeading title="Power services" />
      <PdfTable
        columns={[
          { key: "location", label: "Location", width: 3 },
          { key: "amperage", label: "Amps", width: 1 },
          { key: "voltage", label: "Volts", width: 1 },
          { key: "phase", label: "Phase", width: 1 },
          { key: "source", label: "Source", width: 2 },
          { key: "note", label: "Note", width: 2 },
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
          <SectionHeading title="Generators" />
          <PdfTable
            columns={[
              { key: "label", label: "Unit", width: 2 },
              { key: "kw", label: "kW", width: 1, align: "right" },
              { key: "fuel", label: "Fuel", width: 1.5 },
              { key: "location", label: "Location", width: 3 },
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

export function RiggingPlanView({ data }: { data: RiggingPlanData }) {
  return (
    <>
      <SectionHeading title="Rigging points" />
      <PdfTable
        columns={[
          { key: "label", label: "Point", width: 2 },
          { key: "capacity", label: "Cap (lbs)", width: 1.5, align: "right" },
          { key: "height", label: "Height (ft)", width: 1.5, align: "right" },
          { key: "note", label: "Note", width: 3 },
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

export function SitePlanView({ data }: { data: SitePlanData }) {
  return (
    <>
      {data.svgUrl ? (
        <>
          <SectionHeading title="Site plan" />
          <Image src={data.svgUrl} style={{ width: "100%", maxHeight: 380, objectFit: "contain" }} />
        </>
      ) : null}
      <SectionHeading title="Zones" />
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

export function BuildScheduleView({ data }: { data: BuildScheduleData }) {
  return (
    <>
      <SectionHeading title="Build schedule" />
      <PdfTable
        columns={[
          { key: "day", label: "Day", width: 1.5 },
          { key: "time", label: "Time", width: 1.5 },
          { key: "activity", label: "Activity", width: 3 },
          { key: "crew", label: "Crew", width: 2 },
          { key: "note", label: "Note", width: 2 },
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

export function VendorPackageView({ data }: { data: VendorPackageData }) {
  return (
    <>
      {data.vendor_name ? <SectionHeading eyebrow="Vendor" title={data.vendor_name} /> : null}
      <SectionHeading title="Deliverables" />
      <PdfTable
        columns={[
          { key: "name", label: "Deliverable", width: 4 },
          { key: "due", label: "Due", width: 2 },
          { key: "status", label: "Status", width: 2 },
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

export function SafetyComplianceView({ data }: { data: SafetyComplianceData }) {
  return (
    <>
      <SectionHeading title="Safety + compliance checklist" />
      <PdfTable
        columns={[
          { key: "topic", label: "Topic", width: 2 },
          { key: "requirement", label: "Requirement", width: 4 },
          { key: "owner", label: "Owner", width: 2 },
          { key: "status", label: "Status", width: 1.5 },
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

export function CommsPlanView({ data }: { data: CommsPlanData }) {
  return (
    <>
      <SectionHeading title="Radio channels" />
      <PdfTable
        columns={[
          { key: "channel", label: "Channel", width: 1 },
          { key: "purpose", label: "Purpose", width: 4 },
        ]}
        rows={data.channels.map((c) => ({ channel: c.channel, purpose: c.purpose }))}
      />
      {data.codeWords.length > 0 ? (
        <>
          <SectionHeading title="Code words" />
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

export function SignageGridView({ data }: { data: SignageGridData }) {
  return (
    <>
      <SectionHeading title="Signage grid" />
      <PdfTable
        columns={[
          { key: "location", label: "Location", width: 3 },
          { key: "type", label: "Type", width: 2 },
          { key: "size", label: "Size", width: 1.5 },
          { key: "install", label: "Install", width: 1.5 },
          { key: "strike", label: "Strike", width: 1.5 },
          { key: "note", label: "Note", width: 2 },
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
export function GenericDeliverableView({ data }: { data: unknown }) {
  return (
    <>
      <SectionHeading title="Deliverable data" />
      <Text style={{ fontFamily: "Courier", fontSize: 9 }}>
        {JSON.stringify(data, null, 2)}
      </Text>
    </>
  );
}
