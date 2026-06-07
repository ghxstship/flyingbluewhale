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

/** Request-scoped translator: `t(key, vars?, fallback?)`. */
export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/** Identity fallback used when no translator is threaded in (existing callers). */
const identityT: Translator = (_k, _v, fb) => fb ?? "";

export type VendorRfpInput = {
  brand: PdfBrand;
  /** Optional request-scoped translator; defaults to English fallbacks. */
  t?: Translator;
  vendor: { name: string; contact_email?: string | null };
  project: { name: string };
  scope: string;
  deliverables: Array<{ title: string; description?: string; due?: string | null }>;
  submitInstructions: string;
  deadline?: string | null;
};

export function VendorRfpPdf({
  brand,
  t = identityT,
  vendor,
  project,
  scope,
  deliverables,
  submitInstructions,
  deadline,
}: VendorRfpInput) {
  return (
    <PdfDocument title={`RFP · ${vendor.name}`} author={brand.producerName} subject={`${project.name} RFP`}>
      <CoverPage
        brand={brand}
        eyebrow={t("pdf.vendorRfp.eyebrow", undefined, "Request for Proposal")}
        title={project.name}
        subtitle={
          deadline
            ? t(
                "pdf.vendorRfp.subtitleWithDeadline",
                { vendor: vendor.name, deadline },
                `For ${vendor.name} · responses due ${deadline}`,
              )
            : t("pdf.vendorRfp.subtitle", { vendor: vendor.name }, `For ${vendor.name}`)
        }
      />
      <BrandedPage brand={brand} pageLabel="RFP">
        <SectionHeading title={t("pdf.vendorRfp.scope", undefined, "Scope")} />
        <Text style={styles.p}>{scope}</Text>
        <SectionHeading title={t("pdf.vendorRfp.deliverablesRequested", undefined, "Deliverables Requested")} />
        <PdfTable
          columns={[
            { key: "title", label: t("pdf.vendorRfp.colDeliverable", undefined, "Deliverable"), width: 3 },
            { key: "description", label: t("pdf.vendorRfp.colDescription", undefined, "Description"), width: 5 },
            { key: "due", label: t("pdf.vendorRfp.colDue", undefined, "Due"), width: 2 },
          ]}
          rows={deliverables.map((d) => ({
            title: d.title,
            description: d.description ?? "",
            due: d.due ?? "",
          }))}
        />
        <SectionHeading title={t("pdf.vendorRfp.howToRespond", undefined, "How to Respond")} />
        <Text style={styles.p}>{submitInstructions}</Text>
      </BrandedPage>
    </PdfDocument>
  );
}
