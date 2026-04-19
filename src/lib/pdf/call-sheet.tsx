import "server-only";

import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, KeyValue, PdfDocument, PdfTable, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";

/**
 * Call Sheet PDF — Opportunity #6 (+ #13 labor variant via `labor` prop).
 *
 * A one-page, scannable daily PDF: project + date + weather block on the
 * cover, schedule + crew + venue + key contacts in the body. The labor
 * variant (#13) filters events + crew to a single department.
 */

export type CallSheetInput = {
  brand: PdfBrand;
  project: { name: string };
  forDate: string; // ISO date yyyy-mm-dd
  weather?: { tempF: number; conditions: string } | null;
  venue: { name: string; address?: string | null; city?: string | null; region?: string | null } | null;
  events: Array<{
    name: string;
    starts_at: string;
    ends_at: string;
    location_name?: string | null;
    description?: string | null;
  }>;
  crew: Array<{
    name: string;
    role?: string | null;
    phone?: string | null;
    email?: string | null;
  }>;
  /** Render hint: "labor" narrows framing; otherwise "full" call sheet. */
  variant?: "full" | "labor";
};

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function CallSheetPdf({ brand, project, forDate, weather, venue, events, crew, variant = "full" }: CallSheetInput) {
  const title = variant === "labor" ? `Labor call · ${project.name}` : `Call sheet · ${project.name}`;
  return (
    <PdfDocument title={title} author={brand.producerName} subject={title}>
      <CoverPage
        brand={brand}
        eyebrow={variant === "labor" ? "Labor call" : "Call sheet"}
        title={project.name}
        subtitle={[forDate, weather ? `${weather.tempF}°F ${weather.conditions}` : null].filter(Boolean).join(" · ")}
      />
      <BrandedPage brand={brand} pageLabel={`${project.name} · ${forDate}`}>
        {venue ? (
          <>
            <SectionHeading title="Venue" />
            <KeyValue label="Name" value={venue.name} />
            {venue.address ? <KeyValue label="Address" value={[venue.address, venue.city, venue.region].filter(Boolean).join(", ")} /> : null}
          </>
        ) : null}

        <SectionHeading title={variant === "labor" ? "Labor schedule" : "Schedule"} />
        <PdfTable
          columns={[
            { key: "start", label: "Start", width: 1.2 },
            { key: "end", label: "End", width: 1.2 },
            { key: "activity", label: "Activity", width: 4 },
            { key: "location", label: "Location", width: 2 },
          ]}
          rows={events.map((e) => ({
            start: fmtTime(e.starts_at),
            end: fmtTime(e.ends_at),
            activity: e.name + (e.description ? ` — ${e.description}` : ""),
            location: e.location_name ?? "",
          }))}
        />

        <SectionHeading title={variant === "labor" ? "Labor roster" : "Crew"} />
        <PdfTable
          columns={[
            { key: "name", label: "Name", width: 3 },
            { key: "role", label: "Role", width: 2.5 },
            { key: "contact", label: "Contact", width: 3.5 },
          ]}
          rows={crew.map((c) => ({
            name: c.name,
            role: c.role ?? "",
            contact: [c.phone, c.email].filter(Boolean).join(" · "),
          }))}
        />

        {weather ? (
          <>
            <SectionHeading title="Weather" />
            <Text style={styles.p}>
              {weather.tempF}°F, {weather.conditions}.
            </Text>
          </>
        ) : null}
      </BrandedPage>
    </PdfDocument>
  );
}
