import { JsonLd } from "./JsonLd";
import { faqSchema } from "@/lib/seo";

export type FAQ = { q: string; a: string };

export function FAQSection({ title = "Frequently asked questions", faqs }: { title?: string; faqs: FAQ[] }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={faqSchema(faqs)} />
      <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-8 space-y-2">
        {faqs.map((f) => (
          <details key={f.q} className="surface p-5">
            <summary className="cursor-pointer text-sm font-semibold">{f.q}</summary>
            <div className="mt-3 text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{f.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
