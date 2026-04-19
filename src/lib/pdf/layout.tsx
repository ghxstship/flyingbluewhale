import "server-only";

import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { PdfBrand } from "./branding";

/**
 * Shared React-PDF layout primitives.
 *
 * Every generated document (invoice, advance book, guide, proposal, call
 * sheet, etc.) composes from the same set: <BrandedPage>, <CoverPage>,
 * <SectionHeading>, <RunningFooter>, <Table>. The stylesheet below is the
 * single source of truth for typography + rhythm in generated PDFs.
 *
 * Notes
 *  - `@react-pdf/renderer` uses its own stylesheet dialect — NOT our
 *    design tokens. We resolve brand values to concrete hex strings at
 *    render time via the `PdfBrand` input.
 *  - Images require absolute HTTPS URLs (no data URIs for tenant logos
 *    because we do not embed those at runtime).
 */

const BASE = 11;          // body font size in pt
const LINE = 1.45;        // line-height multiplier
const ACCENT_BAR = 6;     // pt, the top-edge accent rule on branded pages
const MARGIN = 48;        // pt, page gutter
const FOOTER_H = 28;      // pt, space reserved for running footer

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: BASE,
    lineHeight: LINE,
    paddingTop: ACCENT_BAR + MARGIN,
    paddingBottom: MARGIN + FOOTER_H,
    paddingLeft: MARGIN,
    paddingRight: MARGIN,
    color: "#0A0A0A",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ACCENT_BAR,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  logo: { height: 28, objectFit: "contain" },
  producerName: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  clientName: {
    fontSize: 10,
    color: "#555",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: MARGIN,
    right: MARGIN,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#666",
  },
  cover: {
    justifyContent: "space-between",
  },
  coverEyebrow: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  coverTitle: {
    fontSize: 44,
    fontWeight: 600,
    lineHeight: 1.05,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  coverSubtitle: {
    fontSize: 14,
    color: "#333",
    maxWidth: 480,
  },
  classificationBanner: {
    alignSelf: "flex-start",
    marginTop: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    borderRadius: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  sectionEyebrow: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  p: {
    marginBottom: 8,
  },
  keyValueRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  keyValueKey: {
    width: 130,
    color: "#666",
  },
});

export { styles };

// ---------------------------------------------------------------------------
// <BrandedPage> — standard page frame with accent bar + header + footer.
// ---------------------------------------------------------------------------
export function BrandedPage({
  brand,
  pageLabel,
  children,
}: {
  brand: PdfBrand;
  /** Printed in the left-footer slot (e.g. doc name). */
  pageLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={[styles.accentBar, { backgroundColor: brand.producerAccent }]} fixed />
      <View style={styles.headerRow} fixed>
        <View>
          {brand.producerLogoUrl ? (
            <Image style={styles.logo} src={brand.producerLogoUrl} />
          ) : (
            <Text style={styles.producerName}>{brand.producerName}</Text>
          )}
        </View>
        {brand.clientName ? <Text style={styles.clientName}>Prepared for {brand.clientName}</Text> : null}
      </View>

      {children}

      <View style={styles.footer} fixed>
        <Text>{pageLabel ?? brand.legalFooter}</Text>
        <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// <CoverPage> — branded title page. Classification banner + dual logos.
// ---------------------------------------------------------------------------
export function CoverPage({
  brand,
  eyebrow,
  title,
  subtitle,
  classification,
  classificationTier,
}: {
  brand: PdfBrand;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** e.g. "CONFIDENTIAL — CREW" */
  classification?: string;
  /** 1–5, higher = more restricted */
  classificationTier?: number;
}) {
  const bannerColor = classificationTier && classificationTier >= 4 ? "#991B1B" : brand.producerAccent;
  return (
    <Page size="LETTER" style={[styles.page, styles.cover]}>
      <View style={[styles.accentBar, { backgroundColor: brand.producerAccent, height: 14 }]} fixed />
      <View>
        <View style={styles.headerRow}>
          <View>
            {brand.producerLogoUrl ? (
              <Image style={{ height: 40 }} src={brand.producerLogoUrl} />
            ) : (
              <Text style={[styles.producerName, { fontSize: 16 }]}>{brand.producerName}</Text>
            )}
          </View>
          {brand.clientLogoUrl ? (
            <Image style={{ height: 32 }} src={brand.clientLogoUrl} />
          ) : brand.clientName ? (
            <Text style={styles.clientName}>{brand.clientName}</Text>
          ) : null}
        </View>
      </View>

      <View>
        {eyebrow ? <Text style={styles.coverEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.coverTitle}>{title}</Text>
        {subtitle ? <Text style={styles.coverSubtitle}>{subtitle}</Text> : null}
        {classification ? (
          <View style={[styles.classificationBanner, { backgroundColor: bannerColor, color: "#fff" }]}>
            <Text>{classification}</Text>
          </View>
        ) : null}
      </View>

      <View>
        <Text style={{ fontSize: 9, color: "#999" }}>{brand.legalFooter}</Text>
      </View>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// <SectionHeading> — canonical section break inside a branded page.
// ---------------------------------------------------------------------------
export function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View>
      {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.sectionHeading}>{title}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// <KeyValue> + <KeyValueBlock> — metadata pairs (e.g. invoice header, cover).
// ---------------------------------------------------------------------------
export function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={styles.keyValueRow}>
      <Text style={styles.keyValueKey}>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// <PdfTable> — simple tabular data used by invoices, line-item reports, etc.
// ---------------------------------------------------------------------------
export function PdfTable({
  columns,
  rows,
  accentColor,
}: {
  columns: Array<{ key: string; label: string; width?: number; align?: "left" | "right" | "center" }>;
  rows: Array<Record<string, string | number>>;
  accentColor?: string;
}) {
  const totalWidth = columns.reduce((s, c) => s + (c.width ?? 1), 0);
  return (
    <View style={{ marginTop: 8, marginBottom: 12 }}>
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: accentColor ?? "#0A0A0A",
          paddingBottom: 4,
          marginBottom: 4,
        }}
      >
        {columns.map((c) => (
          <Text
            key={c.key}
            style={{
              flex: (c.width ?? 1) / totalWidth,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              textAlign: c.align ?? "left",
            }}
          >
            {c.label}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            paddingVertical: 4,
            borderBottomWidth: i === rows.length - 1 ? 0 : 0.5,
            borderBottomColor: "#eaeaea",
          }}
        >
          {columns.map((c) => (
            <Text
              key={c.key}
              style={{
                flex: (c.width ?? 1) / totalWidth,
                fontSize: 10,
                textAlign: c.align ?? "left",
              }}
            >
              {String(row[c.key] ?? "")}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helper: <PdfDocument> — a `<Document>` wrapper that attaches metadata.
// ---------------------------------------------------------------------------
export function PdfDocument({
  title,
  author,
  subject,
  children,
}: {
  title: string;
  author: string;
  subject?: string;
  children: React.ReactNode;
}) {
  return (
    <Document title={title} author={author} subject={subject ?? title} creator="flyingbluewhale" producer="flyingbluewhale">
      {children}
    </Document>
  );
}
