import "server-only";

import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, KeyValue, PdfDocument, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";

/**
 * Brand kit PDF — Opportunity #20.
 *
 * Renders an org's branding jsonb into a one-page style guide: primary
 * color, typography hints, logo, and legal footer. Hands to vendors +
 * contractors so they know the producer's brand rules at a glance.
 */

/** Request-scoped translator: `t(key, vars?, fallback?)`. */
export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/** Identity fallback used when no translator is threaded in (existing callers). */
const identityT: Translator = (_k, _v, fb) => fb ?? "";

export function BrandKitPdf({ brand, t = identityT }: { brand: PdfBrand; t?: Translator }) {
  const brandKitLabel = t("pdf.brandKit.title", undefined, "Brand kit");
  return (
    <PdfDocument title={`${brand.producerName} · ${brandKitLabel}`} author={brand.producerName} subject={brandKitLabel}>
      <CoverPage
        brand={brand}
        eyebrow={t("pdf.brandKit.eyebrow", undefined, "Brand Kit")}
        title={brand.producerName}
        subtitle={t("pdf.brandKit.coverSubtitle", undefined, "Design tokens, logo, and style rules.")}
      />
      <BrandedPage brand={brand} pageLabel={brandKitLabel}>
        <SectionHeading title={t("pdf.brandKit.color", undefined, "Color")} />
        <View style={{ flexDirection: "row", gap: 12, marginVertical: 8 }}>
          <View style={{ backgroundColor: brand.producerAccent, width: 72, height: 72, borderRadius: 8 }} />
          <View>
            <KeyValue label={t("pdf.brandKit.accent", undefined, "Accent")} value={brand.producerAccent} />
            <KeyValue label={t("pdf.brandKit.legalFooter", undefined, "Legal Footer")} value={brand.legalFooter} />
          </View>
        </View>
        <SectionHeading title={t("pdf.brandKit.typography", undefined, "Typography")} />
        <Text style={{ fontSize: 24, marginBottom: 4 }}>
          {t("pdf.brandKit.displaySample", undefined, "Display 24pt")}
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 4 }}>{t("pdf.brandKit.titleSample", undefined, "Title 14pt")}</Text>
        <Text style={styles.p}>
          {t(
            "pdf.brandKit.bodySample",
            undefined,
            "Body 11pt, 1.45 line-height. Use Helvetica for interoperability in field prints.",
          )}
        </Text>
        <SectionHeading title={t("pdf.brandKit.usageRules", undefined, "Usage Rules")} />
        <Text style={styles.p}>
          {t("pdf.brandKit.usageRule1", undefined, "• Use the accent color for running header bars + primary CTAs.")}
          {"\n"}
          {t(
            "pdf.brandKit.usageRule2",
            undefined,
            "• Tier 4+ documents carry a crimson classification banner — override the accent only for the banner.",
          )}
          {"\n"}
          {t(
            "pdf.brandKit.usageRule3",
            undefined,
            "• Legal footer appears on every page of every producer-generated document.",
          )}
        </Text>
      </BrandedPage>
    </PdfDocument>
  );
}
