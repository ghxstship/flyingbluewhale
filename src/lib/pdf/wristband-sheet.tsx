import "server-only";

import React from "react";
import { View, Text, Image, Page, StyleSheet } from "@react-pdf/renderer";
import { styles, PdfDocument } from "./layout";
import type { PdfBrand } from "./branding";

/**
 * Wristband + QR sheet — Opportunity #16.
 *
 * A grid of tickets printed 10-up (2 cols × 5 rows) on LETTER. Each
 * cell carries the event name + attendee + tier + QR encoding the
 * ticket code. QR images are data URLs passed from the route (the QR
 * render lives at the route so @react-pdf can consume PNG directly).
 */

export type WristbandTicket = {
  id: string;
  code: string;
  holderName: string | null;
  tier: string | null;
  qrDataUrl: string;
};

const grid = StyleSheet.create({
  page: { padding: 18 },
  row: { flexDirection: "row", marginBottom: 8 },
  cell: {
    width: "49%",
    marginRight: "2%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#eaeaea",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cellLast: { marginRight: 0 },
  qr: { width: 72, height: 72 },
  who: { flex: 1 },
});

export function WristbandSheetPdf({ brand, eventName, tickets }: { brand: PdfBrand; eventName: string; tickets: WristbandTicket[] }) {
  const perPage = 10;
  const pages: WristbandTicket[][] = [];
  for (let i = 0; i < tickets.length; i += perPage) pages.push(tickets.slice(i, i + perPage));
  return (
    <PdfDocument title={`Wristbands · ${eventName}`} author={brand.producerName} subject="Wristband sheet">
      {pages.map((page, pi) => (
        <Page key={pi} size="LETTER" style={grid.page}>
          {Array.from({ length: 5 }).map((_, row) => (
            <View key={row} style={grid.row}>
              {[0, 1].map((col) => {
                const t = page[row * 2 + col];
                if (!t) return <View key={col} style={[grid.cell, col === 1 ? grid.cellLast : {}]} />;
                return (
                  <View key={t.id} style={[grid.cell, col === 1 ? grid.cellLast : {}]}>
                    <Image src={t.qrDataUrl} style={grid.qr} />
                    <View style={grid.who}>
                      <Text style={{ fontSize: 10, fontWeight: 700 }}>{eventName}</Text>
                      <Text style={{ fontSize: 9 }}>{t.holderName ?? "Walk-up"}</Text>
                      <Text style={{ fontSize: 8, color: "#666" }}>{t.tier ?? ""}</Text>
                      <Text style={{ fontSize: 7, fontFamily: "Courier", color: "#999" }}>{t.code}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
          <Text style={{ position: "absolute", bottom: 8, left: 18, right: 18, fontSize: 7, color: "#999" }}>
            {styles.page ? "" : null}
            {brand.legalFooter} · {eventName}
          </Text>
        </Page>
      ))}
    </PdfDocument>
  );
}
