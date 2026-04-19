import "server-only";

import React from "react";
import { Text, View } from "@react-pdf/renderer";
import {
  BrandedPage,
  CoverPage,
  PdfDocument,
  PdfTable,
  SectionHeading,
  styles,
} from "./layout";
import type { PdfBrand } from "./branding";
import type { GuideConfig, GuideSection } from "@/lib/guides/types";

/**
 * Event Guide PDF — Opportunity #4.
 *
 * Mirrors the 16 section discriminants in `<GuideView>` one-for-one. Each
 * renderer is intentionally boring + scannable — this is a field document
 * that gets printed, folded, and carried around.
 *
 * Classification banner + tier badge come from the event_guides row; copy
 * them through as-is. The page never fabricates security posture.
 */

type GuideRenderInput = {
  brand: PdfBrand;
  title: string;
  subtitle: string | null;
  classification: string | null;
  tier: number | null;
  config: GuideConfig;
  eventName?: string;
  personaLabel?: string;
};

export function GuidePdf({ brand, title, subtitle, classification, tier, config, eventName, personaLabel }: GuideRenderInput) {
  return (
    <PdfDocument title={title} author={brand.producerName} subject={`Event guide · ${title}`}>
      <CoverPage
        brand={brand}
        eyebrow={personaLabel ? `${personaLabel} boarding pass` : "Boarding pass"}
        title={title}
        subtitle={[eventName, subtitle].filter(Boolean).join(" · ") || undefined}
        classification={classification ?? undefined}
        classificationTier={tier ?? undefined}
      />
      <BrandedPage brand={brand} pageLabel={title}>
        {config.sections.map((s, i) => (
          <SectionRenderer key={`${s.type}-${i}`} section={s} />
        ))}
      </BrandedPage>
    </PdfDocument>
  );
}

function SectionRenderer({ section }: { section: GuideSection }) {
  switch (section.type) {
    case "overview":
      return (
        <>
          <SectionHeading title={section.heading} />
          <Text style={styles.p}>{section.body}</Text>
          {section.callouts?.map((c, i) => (
            <View
              key={i}
              style={{
                marginTop: 6,
                marginBottom: 6,
                padding: 8,
                borderLeftWidth: 3,
                borderLeftColor: c.kind === "red" ? "#991B1B" : c.kind === "gold" ? "#A16207" : "#BE185D",
              }}
            >
              {c.title ? <Text style={{ fontWeight: 700, marginBottom: 2 }}>{c.title}</Text> : null}
              <Text>{c.body}</Text>
            </View>
          ))}
        </>
      );
    case "schedule":
    case "timeline":
      return (
        <>
          <SectionHeading title={section.heading} />
          <PdfTable
            columns={[
              { key: "time", label: "Time", width: 1.2 },
              { key: "activity", label: "Activity", width: 3 },
              { key: "location", label: "Location", width: 2 },
            ]}
            rows={section.entries.map((e) => ({
              time: e.time,
              activity: e.activity + (e.note ? ` — ${e.note}` : ""),
              location: "location" in e ? e.location ?? "" : "",
            }))}
          />
        </>
      );
    case "set_times":
      return (
        <>
          <SectionHeading title={section.heading} />
          <PdfTable
            columns={[
              { key: "artist", label: "Artist", width: 3 },
              { key: "stage", label: "Stage", width: 1.5 },
              { key: "window", label: "Window", width: 2 },
            ]}
            rows={section.entries.map((e) => ({
              artist: e.artist,
              stage: e.stage ?? "",
              window: `${e.start} – ${e.end}`,
            }))}
          />
        </>
      );
    case "credentials":
      return (
        <>
          <SectionHeading title={section.heading} />
          <PdfTable
            columns={[
              { key: "area", label: "Area", width: 2 },
              ...section.columns.map((c) => ({ key: c, label: c, width: 1, align: "center" as const })),
            ]}
            rows={section.rows.map((row) => ({
              area: row.area,
              ...Object.fromEntries(
                section.columns.map((c) => [c, row.access[c] === true ? "✓" : row.access[c] === false ? "—" : String(row.access[c] ?? "")]),
              ),
            }))}
          />
        </>
      );
    case "contacts":
      return (
        <>
          <SectionHeading title={section.heading} />
          {section.entries.map((e, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              {e.header ? <Text style={{ fontWeight: 700 }}>{e.header}</Text> : null}
              {e.role || e.name ? (
                <Text>
                  {[e.role, e.name].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
              {e.phone || e.email ? (
                <Text style={{ fontSize: 9, color: "#555" }}>
                  {[e.phone, e.email].filter(Boolean).join("  ·  ")}
                </Text>
              ) : null}
            </View>
          ))}
        </>
      );
    case "faq":
      return (
        <>
          <SectionHeading title={section.heading} />
          {section.entries.map((e, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 700 }}>{e.q}</Text>
              <Text>{e.a}</Text>
            </View>
          ))}
        </>
      );
    case "sops":
      return (
        <>
          <SectionHeading title={section.heading} />
          {section.entries.map((e, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: 700 }}>
                {[e.code, e.title].filter(Boolean).join(" · ")}
              </Text>
              {e.steps.map((st, j) => (
                <Text key={j} style={{ marginLeft: 10 }}>
                  {j + 1}. {st}
                </Text>
              ))}
              {e.note ? <Text style={{ fontSize: 9, color: "#555" }}>{e.note}</Text> : null}
            </View>
          ))}
        </>
      );
    case "ppe":
      return (
        <>
          <SectionHeading title={section.heading} />
          <PdfTable
            columns={[
              { key: "item", label: "Item", width: 3 },
              { key: "required", label: "Required", width: 1, align: "center" },
              { key: "note", label: "Notes", width: 3 },
            ]}
            rows={section.entries.map((e) => ({
              item: e.item,
              required: e.required ? "Required" : "Optional",
              note: e.note ?? "",
            }))}
          />
        </>
      );
    case "radio":
      return (
        <>
          <SectionHeading title={section.heading} />
          <PdfTable
            columns={[
              { key: "channel", label: "Channel", width: 1 },
              { key: "purpose", label: "Purpose", width: 4 },
            ]}
            rows={section.channels.map((c) => ({ channel: c.channel, purpose: c.purpose }))}
          />
          {section.codeWords?.length ? (
            <>
              <Text style={{ marginTop: 8, fontWeight: 700 }}>Code words</Text>
              {section.codeWords.map((cw, i) => (
                <Text key={i}>
                  {cw.code} — {cw.meaning}
                </Text>
              ))}
            </>
          ) : null}
        </>
      );
    case "resources":
      return (
        <>
          <SectionHeading title={section.heading} />
          <PdfTable
            columns={[
              { key: "name", label: "Resource", width: 2 },
              { key: "location", label: "Location", width: 2 },
              { key: "details", label: "Details", width: 3 },
            ]}
            rows={section.entries.map((e) => ({ name: e.name, location: e.location, details: e.details ?? "" }))}
          />
        </>
      );
    case "evacuation":
      return (
        <>
          <SectionHeading title={section.heading} />
          <PdfTable
            columns={[
              { key: "from", label: "From", width: 2 },
              { key: "to", label: "To", width: 2 },
              { key: "via", label: "Via", width: 3 },
            ]}
            rows={section.routes.map((r) => ({ from: r.from, to: r.to, via: r.via ?? "" }))}
          />
          {section.assemblyPoint ? (
            <Text style={{ marginTop: 6, fontWeight: 700 }}>
              Assembly point: {section.assemblyPoint}
            </Text>
          ) : null}
        </>
      );
    case "fire_safety":
    case "accessibility":
    case "sustainability":
    case "code_of_conduct":
      return (
        <>
          <SectionHeading title={section.heading} />
          {section.entries.map((e, i) => (
            <View key={i} style={{ marginBottom: 4 }}>
              <Text style={{ fontWeight: 700 }}>
                {"item" in e ? e.item : ""}
              </Text>
              {"detail" in e && e.detail ? <Text>{e.detail}</Text> : null}
              {"location" in e && e.location ? <Text style={{ fontSize: 9, color: "#555" }}>{e.location}</Text> : null}
              {"note" in e && e.note ? <Text style={{ fontSize: 9, color: "#555" }}>{e.note}</Text> : null}
            </View>
          ))}
        </>
      );
    case "custom":
      return (
        <>
          <SectionHeading title={section.heading} />
          <Text style={styles.p}>{section.body}</Text>
        </>
      );
  }
}
