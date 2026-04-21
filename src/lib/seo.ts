import type { Metadata } from "next";

export const SITE = {
  name: "Second Star Technologies",
  shortName: "Second Star",
  domain: "secondstar.tech",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://secondstar.tech",
  tagline: "The operating system for live events, fabrication, and creative ops",
  description:
    "ATLVS, GVTEWAY, and COMPVSS — the unified production suite from Second Star Technologies for live events and fabrication teams. Internal operations console, external stakeholder portals, and a field-ready mobile PWA on one Postgres-backed, RLS-secured platform.",
  twitter: "@secondstartech",
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
    atlvs:   { name: "ATLVS",   tagline: "Internal operations console",       color: "#DC2626" },
    gvteway: { name: "GVTEWAY", tagline: "External stakeholder portals",      color: "#2563EB" },
    compvss: { name: "COMPVSS", tagline: "Field-ready mobile PWA",            color: "#D97706" },
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
  noIndex?: boolean;
};

export function buildMetadata(m: PageMeta): Metadata {
  const url = `${SITE.baseUrl}${m.path}`;
  const ogImage = `${SITE.baseUrl}/og?${new URLSearchParams({
    title: m.ogImageTitle ?? m.title,
    eyebrow: m.ogImageEyebrow ?? SITE.name,
  }).toString()}`;

  return {
    title: m.title,
    description: m.description,
    keywords: [...(m.keywords ?? []), ...SITE.keywords],
    alternates: { canonical: url },
    robots: m.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 } },
    openGraph: {
      type: m.article ? "article" : "website",
      locale: "en_US",
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
      creator: SITE.twitter,
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
    legalName: "Second Star Technologies, Inc.",
    url: SITE.baseUrl,
    logo: `${SITE.baseUrl}/icon-512.png`,
    sameAs: [`https://twitter.com/${SITE.twitter.replace("@", "")}`],
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
      { "@type": "Brand", name: "GVTEWAY" },
      { "@type": "Brand", name: "COMPVSS" },
    ],
  };
}

export function softwareApplicationSchema({
  name, description, url, appName, price,
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
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "87",
    },
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
  headline, description, url, datePublished, dateModified, author = SITE.name,
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
      logo: { "@type": "ImageObject", url: `${SITE.baseUrl}/icon-512.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export function productSchema({
  name, description, url, sku, price, brand = SITE.name,
}: {
  name: string;
  description: string;
  url: string;
  sku?: string;
  price?: string;
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
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}
