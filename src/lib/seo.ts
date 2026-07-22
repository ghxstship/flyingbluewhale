import type { Metadata } from "next";
import { BRAND, PRODUCT_ACCENTS } from "@/lib/brand";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { formatDateParts } from "@/lib/i18n/format";

/** Canonical social profile URLs (parent GHXSTSHIP) — Organization `sameAs`. */
export const SOCIAL_SAME_AS: readonly string[] = BRAND.socials.map((s) => s.href);

/**
 * Canonical CTA pair — every marketing surface that needs a primary +
 * secondary action imports these so the copy stays aligned with the
 * voice canon. Don't fork. If a page needs different wording, raise it.
 *
 * "Sign Up Free" is the canonical primary — direct action verb + value
 * loaded ("Free"). Outperforms generic "Get Started" in 2026 freemium B2B
 * conversion tests, and the "Free" qualifier earns the click from buyers
 * who'd otherwise bounce on a perceived sales-call wall.
 */
export const CANONICAL_CTAS = {
  // WORLDS canon — one primary signup label across the entire funnel.
  primary: { label: "Start building free", href: "/signup" },
  secondary: { label: "Book a Walkthrough", href: "/contact" },
} as const;

/**
 * Editorial-review provenance (E6 — WORLDS GEO). Evergreen marketing surfaces
 * (comparisons, alternatives, glossary) carry no per-row publish date, so we
 * stamp them with a single repo-level "content last reviewed" date — the day
 * the copy was last editorially verified. Surfaced both visibly (a "Last
 * updated" dateline) and in `webPageSchema().dateModified` so answer engines
 * read a real freshness signal instead of inferring staleness. Bump this when
 * an evergreen content pass lands; keep it ISO (YYYY-MM-DD) and truthful.
 */
export const CONTENT_REVISED = "2026-06-18";

/** Localized long-date for a provenance dateline (e.g. "June 18, 2026"). */
export function formatReviewedDate(iso: string = CONTENT_REVISED, locale: Locale = DEFAULT_LOCALE): string {
  // Parse as UTC midnight so the rendered day never shifts by timezone.
  return formatDateParts(
    `${iso}T00:00:00Z`,
    { year: "numeric", month: "long", day: "numeric" },
    { locale, timezone: "UTC" },
  );
}

// Locale SSOT lives in `src/lib/i18n/config.ts`. The cookie-based switcher
// in `LocaleSwitcher.tsx` is the active path today. When /[locale] URL
// routing lands, `buildMetadata.languages` already plumbs hreflang.

export const SITE = {
  name: "ATLVS Technologies",
  shortName: "ATLVS",
  domain: "atlvs.pro",
  // `||` (not `??`): fall back on an empty string too — CI/Vercel pass "" for
  // unset vars, and an empty baseUrl would make `new URL(SITE.baseUrl)` (the
  // metadataBase in layout.tsx) throw and fail the production build.
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "https://atlvs.pro",
  tagline: "The World Builder's Ecosystem",
  description:
    "One platform for the whole production, pitch to strike. ATLVS for producers, COMPVSS for crew, GVTEWAY for guests, LEG3ND for knowledge. One source of truth.",
  /**
   * Social handle. Same string across every platform we live on; not a
   * Twitter/X handle — ATLVS does not run an X account. The Twitter Card
   * metadata block below still emits because `summary_large_image` cards
   * remain the de-facto preview spec for links shared TO X.
   */
  socialHandle: "@atlvs.pro",
  /** Parent company chain — surfaces in Organization JSON-LD + legal footer. */
  parent: {
    name: "G H X S T S H I P Industries",
    nameSearch: "GHXSTSHIP Industries",
  },
  keywords: [
    "production management platform",
    "event production software",
    "live event operations",
    "experiential production software",
    "fabrication operations",
    "advancing software",
    "event advancing platform",
    "touring production software",
    "vendor management software",
    "event ticketing and check-in",
    "stakeholder portal software",
    "event PWA",
    "know before you go KBYG",
    "production crew management",
    "creative operations platform",
  ],
  apps: {
    // WORLDS canon — the locked app one-liners (kit voice.html §Canonical
    // surface copy). Reused VERBATIM across en.json, the auth rail, and schema
    // so answer engines see one identical sentence per app (GEO win, finding G2).
    // Four apps — ATLVS · COMPVSS · GVTEWAY · LEG3ND.
    atlvs: {
      name: "ATLVS",
      tagline:
        "Develop and build the world: projects, advancing, finance, procurement, and an AI that drafts the paperwork. The producer's command center.",
      color: PRODUCT_ACCENTS.atlvs,
    },
    compvss: {
      name: "COMPVSS",
      tagline:
        "Operate it in the field: scheduling, certs, gate scan, incidents. Offline-first, fast at the gate even when the signal isn't.",
      color: PRODUCT_ACCENTS.compvss,
    },
    gvteway: {
      name: "GVTEWAY",
      tagline:
        "Where the world is experienced: ticketing, portals, marketplace. A way in for every persona.",
      color: PRODUCT_ACCENTS.gvteway,
    },
    legend: {
      name: "LEG3ND",
      tagline:
        "Where the organization lives: brand, org chart, cost codes, locations, catalogs, templates, knowledge, and the academy. Configure once, every world inherits it.",
      color: PRODUCT_ACCENTS.legend,
    },
  },
} as const;

export type PageMeta = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImageTitle?: string;
  ogImageEyebrow?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    tags?: string[];
  };
  /** Locale variants that ship a translation. Keys are BCP-47 codes
   *  (`es-ES`, `pt-BR`, …) and values are absolute or relative URLs. */
  languages?: Record<string, string>;
  /** OpenGraph locale override (default `en_US`). Use `es_ES` / `pt_BR`
   *  on the localized variants so social previews render correctly. */
  ogLocale?: string;
  noIndex?: boolean;
};

/**
 * Squeeze entity copy (bio / tagline / scope text) into a meta description:
 * collapse whitespace, truncate at a word boundary near 155 chars, and fall
 * back when the source text is missing or empty.
 */
export function metaDescription(text: string | null | undefined, fallback: string, max = 155): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.!?—-]+$/, "")}…`;
}

export function buildMetadata(m: PageMeta): Metadata {
  const url = `${SITE.baseUrl}${m.path}`;
  const ogImage = `${SITE.baseUrl}/og?${new URLSearchParams({
    title: m.ogImageTitle ?? m.title,
    eyebrow: m.ogImageEyebrow ?? SITE.name,
  }).toString()}`;

  // hreflang map: only emit when the caller declares translated variants.
  // Including `x-default` lets Google route ambiguous geos to the canonical.
  const languages = m.languages && Object.keys(m.languages).length ? { "x-default": url, ...m.languages } : undefined;

  return {
    title: m.title,
    description: m.description,
    keywords: [...(m.keywords ?? []), ...SITE.keywords],
    alternates: { canonical: url, ...(languages ? { languages } : {}) },
    robots: m.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-snippet": -1,
            "max-image-preview": "large",
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: m.article ? "article" : "website",
      locale: m.ogLocale ?? "en_US",
      url,
      siteName: SITE.name,
      title: m.title,
      description: m.description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: m.title }],
      ...(m.article
        ? {
            publishedTime: m.article.publishedTime,
            modifiedTime: m.article.modifiedTime,
            authors: m.article.authors,
            tags: m.article.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: m.title,
      description: m.description,
      images: [ogImage],
    },
  };
}

// Structured data helpers — each returns a JSON-LD object to serialize in <script type="application/ld+json">.

export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    // D2 — disambiguate the "ATLVS" brand entity from the common term.
    alternateName: "ATLVS Technologies",
    legalName: "ATLVS Technologies, Inc.",
    url: SITE.baseUrl,
    logo: `${SITE.baseUrl}/og/logo.png`,
    // Company social presence lives on the parent GHXSTSHIP profiles
    // (source of truth: src/lib/brand.ts `socials`, mirrored from
    // linktr.ee/ghxstship).
    sameAs: SOCIAL_SAME_AS,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: `support@${SITE.domain}`,
      availableLanguage: "en",
    },
    // Alphabet/Google-style parent lineage — consumed by Google Knowledge Graph
    // and mentioned in the marketing footer trademark line.
    parentOrganization: {
      "@type": "Organization",
      name: SITE.parent.nameSearch,
    },
    brand: [
      { "@type": "Brand", name: "ATLVS" },
      { "@type": "Brand", name: "COMPVSS" },
      { "@type": "Brand", name: "GVTEWAY" },
      { "@type": "Brand", name: "LEG3ND" },
    ],
  };
}

export function softwareApplicationSchema({
  name,
  description,
  url,
  appName,
  price,
}: {
  name: string;
  description: string;
  url: string;
  appName?: string;
  price?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: appName ?? name,
    description,
    url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: price ?? "0",
      priceCurrency: "USD",
      priceValidUntil: "2099-12-31",
    },
    // D1 — no hardcoded aggregateRating. There are no on-page reviews to back
    // it, so emitting 4.9/87 risks a Google structured-data manual action.
    // Re-add only when real reviews render on-page (wire reviewSchema then).
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function articleSchema({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  author = SITE.name,
}: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: { "@type": "Organization", name: author },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: `${SITE.baseUrl}/og/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export function productSchema({
  name,
  description,
  url,
  sku,
  price,
  currency = "USD",
  inStock = true,
  brand = SITE.name,
}: {
  name: string;
  description: string;
  url: string;
  sku?: string;
  price?: string;
  /** ISO 4217 code; defaults USD (back-compat with existing callers). */
  currency?: string;
  /** false → schema.org/OutOfStock; defaults in-stock. */
  inStock?: boolean;
  brand?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url,
    sku: sku ?? name.toLowerCase().replace(/\s+/g, "-"),
    brand: { "@type": "Brand", name: brand },
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: currency,
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };
}

export function breadcrumbSchema(items: Array<{ label: string; href?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE.baseUrl}${c.href}` } : {}),
    })),
  };
}

export function howToSchema({
  name,
  description,
  steps,
  totalTime,
}: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
  totalTime?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    ...(totalTime ? { totalTime } : {}),
    step: steps.map((s, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function videoSchema({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  contentUrl,
  embedUrl,
  duration,
}: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  contentUrl?: string;
  embedUrl?: string;
  duration?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description,
    thumbnailUrl,
    uploadDate,
    ...(contentUrl ? { contentUrl } : {}),
    ...(embedUrl ? { embedUrl } : {}),
    ...(duration ? { duration } : {}),
  };
}

export function reviewSchema({
  itemName,
  rating,
  reviewBody,
  authorName,
  datePublished,
}: {
  itemName: string;
  rating: number;
  reviewBody: string;
  authorName: string;
  datePublished?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: { "@type": "SoftwareApplication", name: itemName },
    reviewRating: {
      "@type": "Rating",
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody,
    author: { "@type": "Person", name: authorName },
    ...(datePublished ? { datePublished } : {}),
  };
}

export function eventSchema({
  name,
  description,
  url,
  startDate,
  endDate,
  location,
  isOnline,
}: {
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate?: string;
  location?: { name: string; address?: string };
  isOnline?: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    description,
    url,
    startDate,
    ...(endDate ? { endDate } : {}),
    eventAttendanceMode: isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    ...(location
      ? {
          location: isOnline
            ? {
                "@type": "VirtualLocation",
                url,
              }
            : {
                "@type": "Place",
                name: location.name,
                ...(location.address ? { address: location.address } : {}),
              },
        }
      : {}),
  };
}

export function jobPostingSchema({
  title,
  description,
  url,
  datePosted,
  employmentType,
  location,
  baseSalary,
}: {
  title: string;
  description: string;
  url: string;
  datePosted: string;
  employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACTOR" | "TEMPORARY" | "INTERN";
  location?: { city?: string; region?: string; country?: string; remote?: boolean };
  baseSalary?: { min: number; max: number; currency?: string; unitText?: "HOUR" | "DAY" | "MONTH" | "YEAR" };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description,
    url,
    datePosted,
    hiringOrganization: {
      "@type": "Organization",
      name: SITE.name,
      sameAs: SITE.baseUrl,
    },
    ...(employmentType ? { employmentType } : {}),
    ...(location?.remote ? { jobLocationType: "TELECOMMUTE" } : {}),
    ...(location && !location.remote
      ? {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              ...(location.city ? { addressLocality: location.city } : {}),
              ...(location.region ? { addressRegion: location.region } : {}),
              ...(location.country ? { addressCountry: location.country } : {}),
            },
          },
        }
      : {}),
    ...(baseSalary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: baseSalary.currency ?? "USD",
            value: {
              "@type": "QuantitativeValue",
              minValue: baseSalary.min,
              maxValue: baseSalary.max,
              unitText: baseSalary.unitText ?? "YEAR",
            },
          },
        }
      : {}),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function definedTermSchema({
  name,
  description,
  url,
  inDefinedTermSet,
}: {
  name: string;
  description: string;
  url: string;
  inDefinedTermSet?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name,
    description,
    url,
    ...(inDefinedTermSet ? { inDefinedTermSet } : {}),
  };
}

/**
 * Minimal WebPage node carrying provenance (E6). Use on evergreen pages that
 * have no Article/Product schema of their own to advertise a `dateModified`
 * freshness signal. Defaults the revision date to the repo-level
 * `CONTENT_REVISED` stamp.
 */
export function webPageSchema({
  url,
  name,
  description,
  dateModified = CONTENT_REVISED,
}: {
  url: string;
  name: string;
  description?: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": url,
    url,
    name,
    ...(description ? { description } : {}),
    dateModified,
    isPartOf: { "@type": "WebSite", "@id": SITE.baseUrl },
  };
}
