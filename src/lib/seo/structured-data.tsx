/**
 * schema.org JSON-LD helpers — M2-04.
 *
 * One component, `<StructuredData data={...} />`, emits `<script
 * type="application/ld+json">` with the payload you give it. Typed
 * factories below produce the common shapes; the component swallows
 * whatever JSON you hand it so one-offs don't need a factory first.
 *
 * Why JSON-LD instead of microdata? It's strictly recommended by Google,
 * decouples from markup, and survives server-render without pollution.
 *
 * Why a single component and not per-schema components? DRY — every
 * schema emits the exact same `<script>` tag.
 */

type Dict = Record<string, unknown>;

export function StructuredData({ data }: { data: Dict | Dict[] }) {
  const json = Array.isArray(data) ? data.map(withContext) : withContext(data);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

function withContext(d: Dict): Dict {
  return { "@context": "https://schema.org", ...d };
}

// ---------------------------------------------------------------------------
// Factories — typed shortcuts for the schemas we emit most.
// ---------------------------------------------------------------------------

/**
 * Organization — emit once on the root layout. Surfaces in the Google
 * knowledge panel for the company name.
 */
export function organization(args: {
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
  description?: string;
}): Dict {
  return {
    "@type": "Organization",
    name: args.name,
    url: args.url,
    ...(args.logo ? { logo: args.logo } : {}),
    ...(args.sameAs && args.sameAs.length ? { sameAs: args.sameAs } : {}),
    ...(args.description ? { description: args.description } : {}),
  };
}

/**
 * Article — emit on every blog post + changelog entry.
 */
export function article(args: {
  headline: string;
  description?: string;
  url: string;
  author?: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}): Dict {
  return {
    "@type": "Article",
    headline: args.headline,
    ...(args.description ? { description: args.description } : {}),
    url: args.url,
    mainEntityOfPage: args.url,
    author: { "@type": "Person", name: args.author ?? "flyingbluewhale" },
    publisher: { "@type": "Organization", name: "flyingbluewhale" },
    datePublished: args.datePublished,
    dateModified: args.dateModified ?? args.datePublished,
    ...(args.image ? { image: args.image } : {}),
  };
}

/**
 * SoftwareApplication — for /pricing, /features pages. Google renders
 * the `offers` block inline on SERP when populated.
 */
export function softwareApplication(args: {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  offers?: Array<{ name: string; price: string; priceCurrency?: string; billingIncrement?: string }>;
}): Dict {
  return {
    "@type": "SoftwareApplication",
    name: args.name,
    description: args.description,
    url: args.url,
    applicationCategory: args.applicationCategory ?? "BusinessApplication",
    operatingSystem: "Web",
    ...(args.offers && args.offers.length
      ? {
          offers: args.offers.map((o) => ({
            "@type": "Offer",
            name: o.name,
            price: o.price,
            priceCurrency: o.priceCurrency ?? "USD",
            ...(o.billingIncrement ? { billingIncrement: o.billingIncrement } : {}),
          })),
        }
      : {}),
  };
}

/**
 * FAQPage — for solutions/[industry] + docs pages with a Q/A section.
 */
export function faqPage(questions: Array<{ question: string; answer: string }>): Dict {
  return {
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}
