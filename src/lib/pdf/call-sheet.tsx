import "server-only";

import React from "react";
import { Text } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, KeyValue, PdfDocument, PdfTable, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";
import { formatDateParts } from "@/lib/i18n/format";

/**
 * Call Sheet PDF — Opportunity #6 (+ #13 labor variant via `labor` prop).
 *
 * A one-page, scannable daily PDF: project + date + weather block on the
 * cover, schedule + crew + venue + key contacts in the body. The labor
 * variant (#13) filters events + crew to a single department.
 */

/** Request-scoped translator: `t(key, vars?, fallback?)`. */
export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/** Identity fallback used when no translator is threaded in (existing callers). */
const identityT: Translator = (_k, _v, fb) => fb ?? "";

export type CallSheetInput = {
  brand: PdfBrand;
  /** Optional request-scoped translator; defaults to English fallbacks. */
  t?: Translator;
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
    return formatDateParts(new Date(iso), { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function CallSheetPdf({
  brand,
  t = identityT,
  project,
  forDate,
  weather,
  venue,
  events,
  crew,
  variant = "full",
}: CallSheetInput) {
  const eyebrow =
    variant === "labor"
      ? t("pdf.callSheet.eyebrowLabor", undefined, "Labor call")
      : t("pdf.callSheet.eyebrow", undefined, "Call sheet");
  const title = `${eyebrow} · ${project.name}`;
  return (
    <PdfDocument title={title} author={brand.producerName} subject={title}>
      <CoverPage
        brand={brand}
        eyebrow={eyebrow}
        title={project.name}
        subtitle={[forDate, weather ? `${weather.tempF}°F ${weather.conditions}` : null].filter(Boolean).join(" · ")}
      />
      <BrandedPage brand={brand} pageLabel={`${project.name} · ${forDate}`}>
        {venue ? (
          <>
            <SectionHeading title={t("pdf.callSheet.venue", undefined, "Venue")} />
            <KeyValue label={t("pdf.callSheet.venueName", undefined, "Name")} value={venue.name} />
            {venue.address ? (
              <KeyValue
                label={t("pdf.callSheet.venueAddress", undefined, "Address")}
                value={[venue.address, venue.city, venue.region].filter(Boolean).join(", ")}
              />
            ) : null}
          </>
        ) : null}

        <SectionHeading
          title={
            variant === "labor"
              ? t("pdf.callSheet.laborSchedule", undefined, "Labor schedule")
              : t("pdf.callSheet.schedule", undefined, "Schedule")
          }
        />
        <PdfTable
          columns={[
            { key: "start", label: t("pdf.callSheet.colStart", undefined, "Start"), width: 1.2 },
            { key: "end", label: t("pdf.callSheet.colEnd", undefined, "End"), width: 1.2 },
            { key: "activity", label: t("pdf.callSheet.colActivity", undefined, "Activity"), width: 4 },
            { key: "location", label: t("pdf.callSheet.colLocation", undefined, "Location"), width: 2 },
          ]}
          rows={events.map((e) => ({
            start: fmtTime(e.starts_at),
            end: fmtTime(e.ends_at),
            activity: e.name + (e.description ? ` — ${e.description}` : ""),
            location: e.location_name ?? "",
          }))}
        />

        <SectionHeading
          title={
            variant === "labor"
              ? t("pdf.callSheet.laborRoster", undefined, "Labor roster")
              : t("pdf.callSheet.crew", undefined, "Crew")
          }
        />
        <PdfTable
          columns={[
            { key: "name", label: t("pdf.callSheet.colName", undefined, "Name"), width: 3 },
            { key: "role", label: t("pdf.callSheet.colRole", undefined, "Role"), width: 2.5 },
            { key: "contact", label: t("pdf.callSheet.colContact", undefined, "Contact"), width: 3.5 },
          ]}
          rows={crew.map((c) => ({
            name: c.name,
            role: c.role ?? "",
            contact: [c.phone, c.email].filter(Boolean).join(" · "),
          }))}
        />

        {weather ? (
          <>
            <SectionHeading title={t("pdf.callSheet.weather", undefined, "Weather")} />
            <Text style={styles.p}>
              {weather.tempF}°F, {weather.conditions}.
            </Text>
          </>
        ) : null}
      </BrandedPage>
    </PdfDocument>
  );
}
