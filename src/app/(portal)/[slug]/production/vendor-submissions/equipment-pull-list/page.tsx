import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Equipment Pull List -- ${slug} -- GVTEWAY` };
}

export default async function EquipmentPullListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch full catalog (production role sees everything)
  const { data: groups } = await supabase
    .from('advance_category_groups')
    .select(`
      id, name, slug, sort_order,
      advance_categories (
        id, name, slug,
        advance_subcategories (
          id, name, slug,
          advance_items (
            id, name, manufacturer, model, unit, daily_rate, weekly_rate, specifications
          )
        )
      )
    `)
    .order('sort_order');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <Link href={`/${slug}/production/vendor-submissions`} className="text-label text-cyan hover:text-cyan-bright transition-colors mb-2 block">&larr; Vendor Submissions</Link>
          <h1 className="text-display text-3xl text-text-primary">Equipment Pull List</h1>
          <p className="text-sm text-text-secondary mt-1">Full UAC catalog. Select items and quantities for this project.</p>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Status + Actions */}
          <div className="card-elevated p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="badge border text-draft border-draft/30 bg-draft/10">Draft</span>
              <span className="text-xs text-text-tertiary">Select items from the full catalog below</span>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost text-xs py-2">Export CSV</button>
              <button className="btn btn-primary text-xs py-2 px-6">Submit Pull List</button>
            </div>
          </div>

          {/* Category groups */}
          {(groups ?? []).map((group) => (
            <section key={group.id} className="mb-10">
              <div className="flex items-center gap-3 mb-4 sticky top-0 bg-bg py-2 z-10">
                <div className="w-1 h-6 bg-cyan rounded-full" />
                <h2 className="text-heading text-sm text-text-primary">{group.name}</h2>
              </div>

              {(group.advance_categories ?? []).map((cat: {
                id: string; name: string;
                advance_subcategories?: {
                  id: string; name: string;
                  advance_items?: {
                    id: string; name: string; manufacturer: string | null;
                    model: string | null; unit: string; daily_rate: number | null;
                  }[];
                }[];
              }) => (
                <div key={cat.id} className="mb-6">
                  <h3 className="text-label text-text-secondary mb-3 px-1">{cat.name}</h3>
                  {(cat.advance_subcategories ?? []).map((sub) => (
                    <div key={sub.id} className="mb-4">
                      <div className="text-xs text-text-disabled mb-2 px-1">{sub.name}</div>
                      <div className="space-y-1">
                        {(sub.advance_items ?? []).map((item) => (
                          <div key={item.id} className="card p-3 flex items-center justify-between hover:border-cyan/30">
                            <div className="flex-1 flex items-center gap-3">
                              <input type="checkbox" className="accent-cyan-500" />
                              <div>
                                <span className="text-sm text-text-primary">{item.name}</span>
                                <span className="text-mono text-[0.625rem] text-text-disabled ml-2">
                                  {item.manufacturer} {item.model}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.daily_rate && (
                                <span className="text-mono text-xs text-text-tertiary">${item.daily_rate}/day</span>
                              )}
                              <input type="number" defaultValue={0} min={0} className="input w-16 text-center text-sm py-1" aria-label={`Quantity for ${item.name}`} />
                              <span className="text-xs text-text-disabled w-16">{item.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
