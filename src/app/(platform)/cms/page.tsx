import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'CMS -- GVTEWAY',
  description: 'Block-based CMS for portal track content.',
};

const BLOCK_TYPES = [
  'heading', 'paragraph', 'image', 'card_grid', 'hero_banner', 'accordion',
  'table', 'callout', 'embed', 'divider', 'code', 'quote', 'countdown',
  'map', 'contact_card', 'file_download', 'schedule_table', 'faq',
];

export default async function CmsPage() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from('cms_pages')
    .select('*')
    .order('updated_at', { ascending: false });

  const tracks = ['artist', 'production', 'talent', 'crew', 'management', 'staff', 'sponsor', 'press', 'guest', 'attendee', 'client'] as const;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-heading text-lg text-text-primary">CMS Pages</h1>
            <p className="text-sm text-text-secondary mt-1">{BLOCK_TYPES.length} block types &middot; {pages?.length ?? 0} pages</p>
          </div>
          <button className="btn btn-primary text-xs py-2 px-4">New Page</button>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Track Tabs */}
          <div className="flex gap-2 mb-8">
            {tracks.map((track) => (
              <button key={track} className="btn btn-ghost text-xs py-2 px-4 border border-border hover:border-cyan/30">
                {track.charAt(0).toUpperCase() + track.slice(1)}
              </button>
            ))}
          </div>

          {/* Pages List */}
          {(pages?.length ?? 0) === 0 ? (
            <div className="card p-16 text-center">
              <div className="text-text-tertiary text-sm mb-4">No CMS pages yet</div>
              <p className="text-text-disabled text-xs max-w-md mx-auto mb-6">
                Create portal-specific content pages using {BLOCK_TYPES.length} block types including schedules, maps, FAQs, file downloads, and more.
              </p>
              <button className="btn btn-primary text-xs py-2 px-6">Create First Page</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Track</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Updated</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {pages?.map((page) => (
                  <tr key={page.id}>
                    <td className="text-text-primary font-medium">{page.title}</td>
                    <td><span className="badge border text-cyan border-cyan/20 bg-cyan-subtle">{page.track}</span></td>
                    <td>
                      <span className={`badge border ${page.published ? 'text-approved border-approved/30 bg-approved/10' : 'text-draft border-draft/30 bg-draft/10'}`}>
                        {page.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="text-mono text-text-tertiary text-xs">v{page.version}</td>
                    <td className="text-text-tertiary text-xs">{new Date(page.updated_at).toLocaleDateString()}</td>
                    <td><button className="btn btn-ghost text-xs py-1 px-3">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Block Type Reference */}
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-cyan rounded-full" />
              <h2 className="text-heading text-sm text-text-primary">Available Block Types</h2>
              <span className="text-label text-text-disabled text-[0.5rem]">{BLOCK_TYPES.length} Types</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BLOCK_TYPES.map((type) => (
                <span key={type} className="px-3 py-1.5 rounded text-xs text-text-secondary bg-surface-elevated border border-border-subtle hover:border-cyan/30 hover:text-cyan transition-all cursor-pointer" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {type.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
