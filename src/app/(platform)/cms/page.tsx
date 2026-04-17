import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { EmptyState } from '@/components/data/EmptyState';
import { SectionHeading } from '@/components/data/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'CMS -- GVTEWAY',
  description: 'Block-based CMS for portal track content.',
};

const BLOCK_TYPES = [
  'heading', 'paragraph', 'image', 'card_grid', 'hero_banner', 'accordion',
  'table', 'callout', 'embed', 'divider', 'code', 'quote', 'countdown',
  'map', 'contact_card', 'file_download', 'schedule_table', 'faq',
];

type CMSPageRow = {
  id: string;
  title: string;
  track: string;
  published: boolean;
  version: number;
  updated_at: string;
};

const CMS_COLUMNS: DataTableColumn<CMSPageRow>[] = [
  {
    key: 'title',
    header: 'Title',
    render: (p) => <span className="text-text-primary font-medium">{p.title}</span>,
  },
  {
    key: 'track',
    header: 'Track',
    render: (p) => <Badge variant="cyan">{p.track}</Badge>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (p) => (
      <Badge variant={p.published ? 'success' : 'muted'}>
        {p.published ? 'Published' : 'Draft'}
      </Badge>
    ),
  },
  {
    key: 'version',
    header: 'Version',
    render: (p) => <span className="font-mono text-text-tertiary text-xs">v{p.version}</span>,
  },
  {
    key: 'updated',
    header: 'Updated',
    render: (p) => <span className="text-text-tertiary text-xs">{new Date(p.updated_at).toLocaleDateString()}</span>,
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: () => <Button variant="ghost" size="sm">Edit</Button>,
  },
];

export default async function CmsPage() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from('cms_pages')
    .select('*')
    .order('updated_at', { ascending: false });

  const typedPages = (pages ?? []) as CMSPageRow[];
  const tracks = ['artist', 'production', 'talent', 'crew', 'management', 'staff', 'sponsor', 'press', 'guest', 'attendee', 'client'] as const;

  return (
    <>
      <ModuleHeader
        title="CMS Pages"
        subtitle={`${BLOCK_TYPES.length} block types · ${typedPages.length} pages`}
        maxWidth="6xl"
      >
        <Button variant="primary" size="sm">New Page</Button>
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        {/* Track Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tracks.map((track) => (
            <Button key={track} variant="ghost" size="sm" className="border border-border hover:border-cyan/30 capitalize">
              {track}
            </Button>
          ))}
        </div>

        {/* Pages List */}
        {(typedPages.length) === 0 ? (
          <EmptyState 
            title="No CMS pages yet" 
            description={`Create portal-specific content pages using ${BLOCK_TYPES.length} block types including schedules, maps, FAQs, file downloads, and more.`}
            actionLabel="Create First Page"
            actionHref="#"
          />
        ) : (
          <DataTable
            columns={CMS_COLUMNS}
            data={typedPages}
            emptyText="No CMS Pages"
          />
        )}

        {/* Block Type Reference */}
        <section className="mt-12">
          <SectionHeading>
            Available Block Types
            <span className="ml-3 badge text-[0.5rem] tracking-wider uppercase bg-surface-raised text-text-disabled border border-border">
              {BLOCK_TYPES.length} Types
            </span>
          </SectionHeading>
          
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map((type) => (
              <span 
                key={type} 
                className="px-3 py-1.5 rounded text-xs text-text-secondary bg-surface-elevated border border-border-subtle hover:border-cyan/30 hover:text-cyan transition-all cursor-pointer font-heading tracking-wider uppercase" 
              >
                {type.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
