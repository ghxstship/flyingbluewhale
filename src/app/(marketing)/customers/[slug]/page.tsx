export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const readable = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Case study</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{readable}</h1>
      <p className="mt-6 text-sm text-[var(--text-secondary)]">
        Case study page — populated via CMS when content lands. Until then, this placeholder renders the SEO-safe detail view.
      </p>
    </div>
  );
}
