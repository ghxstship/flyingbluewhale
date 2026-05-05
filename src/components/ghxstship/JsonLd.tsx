import { jsonLd } from "@/lib/seo";

/**
 * Inline JSON-LD emitter for the GHXSTSHIP marketing surface. Wraps the
 * canonical helper so every page in this surface stays single-import.
 */
export function GhxstshipJsonLd({ data }: { data: object | object[] }) {
  const arr = Array.isArray(data) ? data : [data];
  return (
    <>
      {arr.map((d, i) => (
        // eslint-disable-next-line react/no-danger
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(d) }} />
      ))}
    </>
  );
}

const BASE = "https://ghxstship.pro";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GHXSTSHIP Industries",
    url: BASE,
    description:
      "GHXSTSHIP is an experiential production company building festivals, immersive experiences, theme parks, theatrical performances, brand activations, and premium hospitality at scale.",
    sameAs: ["https://lytehaus.tech"],
    areaServed: [
      "Miami",
      "New York City",
      "Chicago",
      "Los Angeles",
      "Orlando",
      "Nashville",
      "Austin",
      "Atlanta",
      "Minneapolis",
      "Denver",
      "Las Vegas",
      "Seattle",
      "United States",
    ],
  };
}

export function breadcrumbSchema(items: Array<{ label: string; href: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: `${BASE}${item.href}`,
    })),
  };
}

export function serviceSchema(opts: {
  name: string;
  description: string;
  serviceType?: string;
  identifier?: string;
  areaServed?: string[];
  category?: string;
  offers?: Array<{ name: string; identifier?: string }>;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    provider: {
      "@type": "Organization",
      name: "GHXSTSHIP Industries",
      url: BASE,
    },
  };
  if (opts.serviceType) data.serviceType = opts.serviceType;
  if (opts.identifier) data.identifier = opts.identifier;
  if (opts.category) data.category = opts.category;
  if (opts.areaServed?.length) data.areaServed = opts.areaServed;
  if (opts.offers?.length) {
    data.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: `${opts.name} Catalog`,
      itemListElement: opts.offers.map((o) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: o.name,
          ...(o.identifier ? { identifier: o.identifier } : {}),
        },
      })),
    };
  }
  return data;
}

export function faqSchema(faqs: Array<{ q: string; a: string }>) {
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
