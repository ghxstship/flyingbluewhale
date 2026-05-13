import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type CaseStudyRow = {
  slug: string;
  customer_name: string;
  hero_image_path: string | null;
  industry: string | null;
  format: string | null;
  region: string | null;
  challenge: string | null;
  solution: string | null;
  outcomes: string | null;
  metrics: unknown;
  quote_text: string | null;
  quote_author: string | null;
  quote_role: string | null;
  published_at: string | null;
};

type Metric = { label?: string; value?: string };

function parseMetrics(raw: unknown): Metric[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is Metric => typeof x === "object" && x !== null);
}

async function loadCaseStudy(slug: string): Promise<CaseStudyRow | null> {
  if (!hasSupabase) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("case_studies")
    .select(
      "slug, customer_name, hero_image_path, industry, format, region, challenge, solution, outcomes, metrics, quote_text, quote_author, quote_role, published_at",
    )
    .eq("slug", slug)
    .not("published_at", "is", null)
    .maybeSingle();
  return (data as unknown as CaseStudyRow) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cs = await loadCaseStudy(slug);
  if (!cs) {
    return buildMetadata({
      title: "Customer story",
      description: "ATLVS customer story",
      path: `/customers/${slug}`,
    });
  }
  return buildMetadata({
    title: `${cs.customer_name} — Customer story`,
    description: cs.challenge?.slice(0, 160) ?? `How ${cs.customer_name} runs production on ATLVS.`,
    path: `/customers/${cs.slug}`,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cs = await loadCaseStudy(slug);
  if (!cs) notFound();

  const metrics = parseMetrics(cs.metrics);
  const meta = [cs.industry, cs.format, cs.region].filter(Boolean).join(" · ");

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">Customer story</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{cs.customer_name}</h1>
      {meta && <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">{meta}</p>}

      {metrics.length > 0 && (
        <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {metrics.map((m, i) => (
            <div key={i} className="surface p-4">
              <div className="text-2xl font-semibold tracking-tight">{m.value ?? "—"}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{m.label ?? ""}</div>
            </div>
          ))}
        </section>
      )}

      {cs.challenge && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">Challenge</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-primary)]">{cs.challenge}</p>
        </section>
      )}

      {cs.solution && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">Solution</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-primary)]">{cs.solution}</p>
        </section>
      )}

      {cs.outcomes && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">Outcomes</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-primary)]">{cs.outcomes}</p>
        </section>
      )}

      {cs.quote_text && (
        <blockquote className="surface mt-10 p-6">
          <p className="text-base leading-snug">"{cs.quote_text}"</p>
          {(cs.quote_author || cs.quote_role) && (
            <footer className="mt-3 text-xs text-[var(--text-muted)]">
              — {cs.quote_author ?? ""}
              {cs.quote_author && cs.quote_role ? ", " : ""}
              {cs.quote_role ?? ""}
            </footer>
          )}
        </blockquote>
      )}

      <div className="mt-12 flex items-center gap-3">
        <Link href="/customers" className="text-xs text-[var(--org-primary)]">
          ← All customer stories
        </Link>
      </div>
    </article>
  );
}
