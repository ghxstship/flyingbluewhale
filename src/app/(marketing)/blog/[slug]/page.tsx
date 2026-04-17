export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-heading text-2xl text-text-primary mb-2">{slug.replace(/-/g, ' ')}</h1>
      <p className="text-text-secondary text-sm">Blog post content.</p>
    </div>
  );
}
