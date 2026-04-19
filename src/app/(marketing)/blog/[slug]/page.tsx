// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/marketing/Breadcrumb";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, articleSchema } from "@/lib/seo";
import { POSTS, POST_LIST } from "@/lib/blog";

export function generateStaticParams() {
  return POST_LIST.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) return buildMetadata({ title: "Post not found", description: "", path: `/blog/${slug}` });
  return buildMetadata({
    title: post.title,
    description: post.blurb,
    path: `/blog/${post.slug}`,
    keywords: post.keywords,
    ogImageEyebrow: "Blog",
    ogImageTitle: post.title,
  });
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          articleSchema({
            headline: post.title,
            description: post.blurb,
            datePublished: post.date,
            author: post.author,
            url: `https://flyingbluewhale.app/blog/${post.slug}`,
          }),
        ]}
      />
      <Breadcrumbs crumbs={crumbs} />

      <article className="mx-auto max-w-3xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">
          flyingbluewhale · Blog
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readingTime}</span>
          <span>·</span>
          <span>{post.author}</span>
        </div>

        <div className="mt-10 space-y-5 text-[15px] leading-7 text-[var(--text-secondary)]">
          {post.body.map((block, i) => {
            if (block.kind === "p") return <p key={i}>{block.text}</p>;
            if (block.kind === "h2") return <h2 key={i} className="mt-10 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{block.text}</h2>;
            if (block.kind === "h3") return <h3 key={i} className="mt-8 text-lg font-semibold tracking-tight text-[var(--text-primary)]">{block.text}</h3>;
            if (block.kind === "ul") return (
              <ul key={i} className="ml-5 list-disc space-y-1.5">
                {block.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            );
            if (block.kind === "ol") return (
              <ol key={i} className="ml-5 list-decimal space-y-1.5">
                {block.items.map((item, j) => <li key={j}>{item}</li>)}
              </ol>
            );
            if (block.kind === "quote") return (
              <blockquote key={i} className="border-l-2 border-[var(--org-primary)] pl-4 italic">
                {block.text}
                {block.cite && <cite className="mt-1 block not-italic text-xs text-[var(--text-muted)]">— {block.cite}</cite>}
              </blockquote>
            );
            if (block.kind === "code") return (
              <pre key={i} className="surface-inset overflow-x-auto p-4 font-mono text-xs">
                <code>{block.text}</code>
              </pre>
            );
            return null;
          })}
        </div>

        <div className="mt-12 flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-6">
          {post.keywords.map((k) => (
            <span key={k} className="rounded-full bg-[var(--surface-inset)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
              {k}
            </span>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/blog" className="text-sm text-[var(--org-primary)]">← All posts</Link>
        </div>
      </article>

      <CTASection title="Run your next show on flyingbluewhale" subtitle="Start free. No credit card." />
    </div>
  );
}
