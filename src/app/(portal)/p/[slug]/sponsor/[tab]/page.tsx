import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { EmptyState } from '@/components/data/EmptyState';

export async function generateMetadata({ params }: { params: Promise<{ slug: string, tab: string }> }) {
  const { slug, tab } = await params;
  return { title: `Sponsor Portal -- ${tab.replace(/-/g, ' ')} -- GVTEWAY` };
}

export default async function SponsorTabPage({ params }: { params: Promise<{ slug: string, tab: string }> }) {
  const { slug, tab } = await params;
  const projectName = slug.replace(/-/g, ' ').toUpperCase();
  const tabName = tab.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <>
      <ModuleHeader
        title={tabName}
        subtitle={`${projectName} · Sponsor Portal`}
        backHref={`/${slug}/sponsor`}
        backLabel="Portal Hub"
        maxWidth="4xl"
      />

      <div className="page-content" style={{ maxWidth: '4xl' }}>
        <ContentGrid columns={{ sm: 1 }} gap="1rem">
          <div className="card p-8 border border-border">
            <EmptyState 
              title={`${tabName} Module`} 
              description={`This module is currently being provisioned for the ${projectName} sponsor portal.`}
              actionLabel="Return to Hub"
              actionHref={`/${slug}/sponsor`}
            />
          </div>
        </ContentGrid>
      </div>
    </>
  );
}
