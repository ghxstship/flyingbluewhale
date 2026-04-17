export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const readable = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">flyingbluewhale · Blog</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{readable}</h1>
      <div className="mt-8 space-y-4 text-sm text-[var(--text-secondary)]">
        <p>This article is rendered from a slug-based route. CMS-backed content wires in the next release.</p>
      </div>
    </div>
  );
}
