import "server-only";

import PptxGenJS from "pptxgenjs";

/**
 * Sponsor activation deck — Opportunity #23.
 *
 * A 5-slide PPTX post-event wrap-up: cover, attendance, demographics,
 * activation metrics, thank-you. Dual-branded (producer + sponsor)
 * styling. Rendered via pptxgenjs to a Buffer and uploaded to the
 * `exports` bucket by the route.
 *
 * `metrics` is free-form and the renderer falls back gracefully if a
 * field is missing — a first-deck run may be light on data.
 */

export type SponsorDeckInput = {
  producerName: string;
  sponsorName: string;
  projectName: string;
  dateRange: string;
  accentColor: string;            // hex
  metrics: {
    totalAttendees?: number;
    uniqueAttendees?: number;
    scans?: number;
    avgSpendCents?: number;
    topMarkets?: string[];
  };
  activations: Array<{
    title: string;
    summary: string;
    impressions?: number;
    engagements?: number;
  }>;
  photos?: Array<{ url: string; caption?: string }>;
};

export async function buildSponsorDeck(input: SponsorDeckInput): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.company = input.producerName;
  pptx.subject = `Sponsor activation · ${input.sponsorName} · ${input.projectName}`;
  pptx.title = `${input.sponsorName} · ${input.projectName}`;

  const accent = input.accentColor.replace(/^#/, "");

  // Slide 1 — cover
  const s1 = pptx.addSlide();
  s1.background = { color: "FFFFFF" };
  s1.addText(input.sponsorName.toUpperCase(), { x: 0.5, y: 0.4, w: 9, h: 0.4, fontSize: 10, color: accent, bold: true, charSpacing: 2 });
  s1.addText(input.projectName, { x: 0.5, y: 1.2, w: 9, h: 1.5, fontSize: 44, bold: true });
  s1.addText(`Activation Recap · ${input.dateRange}`, { x: 0.5, y: 3.0, w: 9, h: 0.5, fontSize: 18, color: "444444" });
  s1.addShape("rect", { x: 0, y: 0, w: 10, h: 0.08, fill: { color: accent } });
  s1.addText(`Prepared by ${input.producerName}`, { x: 0.5, y: 5.0, w: 9, h: 0.3, fontSize: 10, color: "999999" });

  // Slide 2 — attendance metrics
  const s2 = pptx.addSlide();
  s2.addText("Attendance", { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 28, bold: true });
  s2.addText("Reach + scan velocity", { x: 0.5, y: 0.9, w: 9, h: 0.3, fontSize: 14, color: "666666" });
  const m = input.metrics;
  const metricsRows: Array<{ label: string; value: string }> = [
    { label: "Total attendees", value: m.totalAttendees?.toLocaleString() ?? "—" },
    { label: "Unique attendees", value: m.uniqueAttendees?.toLocaleString() ?? "—" },
    { label: "Scans", value: m.scans?.toLocaleString() ?? "—" },
    { label: "Avg spend", value: m.avgSpendCents != null ? `$${(m.avgSpendCents / 100).toFixed(2)}` : "—" },
  ];
  metricsRows.forEach((row, i) => {
    s2.addText(row.value, { x: 0.5 + i * 2.3, y: 1.8, w: 2, h: 1.0, fontSize: 36, bold: true, color: accent });
    s2.addText(row.label, { x: 0.5 + i * 2.3, y: 3.0, w: 2, h: 0.4, fontSize: 12, color: "666666" });
  });

  // Slide 3 — activations
  const s3 = pptx.addSlide();
  s3.addText("Activations", { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 28, bold: true });
  const acts = input.activations.slice(0, 4);
  acts.forEach((a, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.5 + col * 4.6;
    const y = 1.2 + row * 2.2;
    s3.addShape("rect", { x, y, w: 4.3, h: 2.0, line: { color: "EAEAEA", width: 1 } });
    s3.addText(a.title, { x: x + 0.2, y: y + 0.1, w: 4, h: 0.4, fontSize: 14, bold: true });
    s3.addText(a.summary, { x: x + 0.2, y: y + 0.5, w: 4, h: 1.0, fontSize: 11, color: "333333" });
    const stats = [a.impressions ? `${a.impressions.toLocaleString()} impressions` : null, a.engagements ? `${a.engagements.toLocaleString()} engagements` : null].filter(Boolean).join(" · ");
    if (stats) s3.addText(stats, { x: x + 0.2, y: y + 1.55, w: 4, h: 0.3, fontSize: 10, color: accent });
  });

  // Slide 4 — markets
  const s4 = pptx.addSlide();
  s4.addText("Top markets", { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 28, bold: true });
  if (m.topMarkets?.length) {
    m.topMarkets.slice(0, 8).forEach((market, i) => {
      s4.addText(`${i + 1}. ${market}`, { x: 0.7, y: 1.0 + i * 0.5, w: 5, h: 0.4, fontSize: 16 });
    });
  } else {
    s4.addText("No market data available for this run.", { x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 14, color: "666666" });
  }

  // Slide 5 — thank you
  const s5 = pptx.addSlide();
  s5.background = { color: accent };
  s5.addText("Thank you.", { x: 0.5, y: 2.5, w: 9, h: 1.5, fontSize: 60, bold: true, color: "FFFFFF" });
  s5.addText(`${input.producerName} × ${input.sponsorName}`, { x: 0.5, y: 4.0, w: 9, h: 0.5, fontSize: 16, color: "FFFFFF" });

  // Buffer return
   
  const nodeBuf = (await pptx.write({ outputType: "nodebuffer" })) as any;
  return Buffer.isBuffer(nodeBuf) ? nodeBuf : Buffer.from(nodeBuf);
}
