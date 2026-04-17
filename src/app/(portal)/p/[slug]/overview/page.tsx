export const metadata = { title: 'Portal Overview' };

export default async function PortalOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">Project Overview</h1>
      <p className="text-text-secondary text-sm">Summary for {slug}</p>
    </div>
  );
}
