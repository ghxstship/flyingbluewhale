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

export function BrandKitPdf({ brand }: { brand: PdfBrand }) {
  return (
    <PdfDocument title={`${brand.producerName} · Brand kit`} author={brand.producerName} subject="Brand kit">
      <CoverPage
        brand={brand}
        eyebrow="Brand kit"
        title={brand.producerName}
        subtitle="Design tokens, logo, and style rules."
      />
      <BrandedPage brand={brand} pageLabel="Brand kit">
        <SectionHeading title="Color" />
        <View style={{ flexDirection: "row", gap: 12, marginVertical: 8 }}>
          <View style={{ backgroundColor: brand.producerAccent, width: 72, height: 72, borderRadius: 8 }} />
          <View>
            <KeyValue label="Accent" value={brand.producerAccent} />
            <KeyValue label="Legal footer" value={brand.legalFooter} />
          </View>
        </View>
        <SectionHeading title="Typography" />
        <Text style={{ fontSize: 24, marginBottom: 4 }}>Display 24pt</Text>
        <Text style={{ fontSize: 14, marginBottom: 4 }}>Title 14pt</Text>
        <Text style={styles.p}>Body 11pt, 1.45 line-height. Use Helvetica for interoperability in field prints.</Text>
        <SectionHeading title="Usage rules" />
        <Text style={styles.p}>
          • Use the accent color for running header bars + primary CTAs.{"\n"}
          • Tier 4+ documents carry a crimson classification banner — override the accent only for the banner.{"\n"}
          • Legal footer appears on every page of every producer-generated document.
        </Text>
      </BrandedPage>
    </PdfDocument>
  );
}
