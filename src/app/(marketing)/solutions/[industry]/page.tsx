export default async function SolutionPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = await params;
  const title = industry.charAt(0).toUpperCase() + industry.slice(1).replace(/-/g, ' ');
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">{title}</h1>
      <p className="text-text-secondary text-sm">How the platform serves the {title} industry.</p>
    </div>
  );
}
