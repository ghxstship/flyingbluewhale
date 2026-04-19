import "server-only";

import React from "react";
import { BrandedPage, CoverPage, PdfDocument, PdfTable } from "./layout";
import type { PdfBrand } from "./branding";

/**
 * Audit log compliance export — Opportunity #15.
 * PDF cover stamps the time range + actor filter; table renders rows
 * with the same columns SOC-2 auditors request: at, actor_email,
 * action, target_table, target_id, operation, request_id.
 */

export type AuditExportInput = {
  brand: PdfBrand;
  rangeFrom: string;
  rangeTo: string;
  actor?: string;
  rows: Array<{
    at: string;
    actor_email: string | null;
    action: string;
    target_table: string | null;
    target_id: string | null;
    operation: string | null;
    request_id: string | null;
  }>;
};

export function AuditExportPdf({ brand, rangeFrom, rangeTo, actor, rows }: AuditExportInput) {
  return (
    <PdfDocument title="Audit log export" author={brand.producerName} subject="Audit log">
      <CoverPage
        brand={brand}
        eyebrow="Audit"
        title="Audit log export"
        subtitle={[`Range ${rangeFrom} → ${rangeTo}`, actor ? `Actor ${actor}` : null, `${rows.length} entries`].filter(Boolean).join(" · ")}
        classification="CONFIDENTIAL — COMPLIANCE"
        classificationTier={4}
      />
      <BrandedPage brand={brand} pageLabel="Audit log">
        <PdfTable
          columns={[
            { key: "at", label: "At", width: 2 },
            { key: "actor", label: "Actor", width: 2.5 },
            { key: "action", label: "Action", width: 2 },
            { key: "target", label: "Target", width: 2.5 },
            { key: "op", label: "Op", width: 1 },
            { key: "req", label: "Req id", width: 1.5 },
          ]}
          rows={rows.map((r) => ({
            at: new Date(r.at).toISOString(),
            actor: r.actor_email ?? "—",
            action: r.action,
            target: [r.target_table, r.target_id].filter(Boolean).join("·"),
            op: r.operation ?? "",
            req: r.request_id ?? "",
          }))}
        />
      </BrandedPage>
    </PdfDocument>
  );
}
