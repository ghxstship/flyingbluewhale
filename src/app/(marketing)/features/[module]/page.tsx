export default async function FeatureModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: mod } = await params;
  const title = mod.charAt(0).toUpperCase() + mod.slice(1).replace(/-/g, ' ');
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">{title}</h1>
      <p className="text-text-secondary text-sm">Feature details for {title}.</p>
    </div>
  );
}
