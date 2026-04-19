import "server-only";

import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, PdfDocument, SectionHeading } from "../layout";
import type { PdfBrand } from "../branding";
import { renderDeliverable, labelFor } from "./registry";

/**
 * Single-deliverable PDF — Opportunity #2 composed for one row.
 * Used when a user hits /api/v1/deliverables/[id]/pdf.
 */

export type DeliverableRow = {
  id: string;
  type: string;
  status: string | null;
  version: number | null;
  deadline: string | null;
  data: unknown;
};

export function DeliverablePdf({
  brand,
  projectName,
  deliverable,
}: {
  brand: PdfBrand;
  projectName?: string;
  deliverable: DeliverableRow;
}) {
  const label = labelFor(deliverable.type);
  return (
    <PdfDocument title={`${label} · ${projectName ?? ""}`} author={brand.producerName} subject={label}>
      <CoverPage
        brand={brand}
        eyebrow={projectName ?? "Deliverable"}
        title={label}
        subtitle={[
          deliverable.status ? `Status: ${deliverable.status}` : null,
          deliverable.version != null ? `Version ${deliverable.version}` : null,
          deliverable.deadline ? `Due ${deliverable.deadline}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || undefined}
      />
      <BrandedPage brand={brand} pageLabel={label}>
        {renderDeliverable(deliverable.type, deliverable.data)}
      </BrandedPage>
    </PdfDocument>
  );
}

/**
 * Advance Book — Opportunity #1.
 *
 * Multi-deliverable document. Cover + table of contents + one section
 * per included deliverable (in the enum order so two compiles of the
 * same project produce identical books). Each deliverable renders via
 * the registry so adding new types is additive.
 */

export function AdvanceBook({
  brand,
  projectName,
  classification,
  classificationTier,
  deliverables,
}: {
  brand: PdfBrand;
  projectName: string;
  classification?: string;
  classificationTier?: number;
  deliverables: DeliverableRow[];
}) {
  return (
    <PdfDocument
      title={`${projectName} · Production Advance`}
      author={brand.producerName}
      subject={`Production Advance — ${projectName}`}
    >
      <CoverPage
        brand={brand}
        eyebrow="Production Advance"
        title={projectName}
        subtitle={`${deliverables.length} approved deliverables`}
        classification={classification}
        classificationTier={classificationTier}
      />
      <BrandedPage brand={brand} pageLabel="Table of contents">
        <SectionHeading title="Contents" />
        {deliverables.map((d, i) => (
          <View key={d.id} style={{ flexDirection: "row", marginBottom: 2 }}>
            <Text style={{ width: 36, color: "#666" }}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={{ flex: 1 }}>{labelFor(d.type)}</Text>
            {d.version != null ? <Text style={{ color: "#666" }}>v{d.version}</Text> : null}
          </View>
        ))}
      </BrandedPage>

      {deliverables.map((d) => (
        <BrandedPage key={d.id} brand={brand} pageLabel={labelFor(d.type)}>
          <SectionHeading eyebrow={`§ ${labelFor(d.type)}`} title={labelFor(d.type)} />
          {renderDeliverable(d.type, d.data)}
        </BrandedPage>
      ))}
    </PdfDocument>
  );
}
