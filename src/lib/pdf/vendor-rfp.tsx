import "server-only";

import React from "react";
import { Text } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, PdfDocument, PdfTable, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";

/**
 * Vendor RFP — Opportunity #22.
 *
 * Generated from a vendor + project context. Keeps the producer's brand
 * at the top; lists scope requirements + deliverables + submission
 * instructions. Payload is Zod-validated at the route; the renderer
 * just formats.
 */

export type VendorRfpInput = {
  brand: PdfBrand;
  vendor: { name: string; contact_email?: string | null };
  project: { name: string };
  scope: string;
  deliverables: Array<{ title: string; description?: string; due?: string | null }>;
  submitInstructions: string;
  deadline?: string | null;
};

export function VendorRfpPdf({ brand, vendor, project, scope, deliverables, submitInstructions, deadline }: VendorRfpInput) {
  return (
    <PdfDocument title={`RFP · ${vendor.name}`} author={brand.producerName} subject={`${project.name} RFP`}>
      <CoverPage
        brand={brand}
        eyebrow="Request for Proposal"
        title={project.name}
        subtitle={`For ${vendor.name}${deadline ? ` · responses due ${deadline}` : ""}`}
      />
      <BrandedPage brand={brand} pageLabel="RFP">
        <SectionHeading title="Scope" />
        <Text style={styles.p}>{scope}</Text>
        <SectionHeading title="Deliverables requested" />
        <PdfTable
          columns={[
            { key: "title", label: "Deliverable", width: 3 },
            { key: "description", label: "Description", width: 5 },
            { key: "due", label: "Due", width: 2 },
          ]}
          rows={deliverables.map((d) => ({
            title: d.title,
            description: d.description ?? "",
            due: d.due ?? "",
          }))}
        />
        <SectionHeading title="How to respond" />
        <Text style={styles.p}>{submitInstructions}</Text>
      </BrandedPage>
    </PdfDocument>
  );
}
