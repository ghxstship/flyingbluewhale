import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Catalog -- GVTEWAY',
  description: 'Browse the Unified Advancing Catalog: 350+ items across 10 collections.',
};

export default async function CatalogPage() {
  const supabase = await createClient();

  // Fetch catalog structure
  const { data: groups } = await supabase
    .from('advance_category_groups')
    .select(`
      id, name, slug, description, sort_order,
      advance_categories (
        id, name, slug, sort_order,
        advance_subcategories (
          id, name, slug, sort_order
        )
      )
    `)
    .order('sort_order');

  // Fetch item count
  const { count: itemCount } = await supabase
    .from('advance_items')
    .select('id', { count: 'exact', head: true });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-heading text-lg text-text-primary">Unified Advancing Catalog</h1>
            <p className="text-sm text-text-secondary mt-1">
              {itemCount ?? 0} items across {groups?.length ?? 0} collections
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="search"
              placeholder="Search catalog..."
              className="input w-72"
              id="catalog-search"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Collection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-12">
            {(groups ?? []).map((group) => (
              <div key={group.id} className="card p-5 group cursor-pointer">
                <div className="text-heading text-xs text-text-primary mb-1 group-hover:text-cyan transition-colors">
                  {group.name}
                </div>
                <div className="text-xs text-text-tertiary mb-3">
                  {group.description}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-display text-xl text-cyan">
                    {(group.advance_categories ?? []).reduce(
                      (acc: number, cat: { advance_subcategories?: unknown[] }) =>
                        acc + (cat.advance_subcategories?.length ?? 0),
                      0
                    )}
                  </span>
                  <span className="text-label text-text-disabled text-[0.5rem]">Subcategories</span>
                </div>
              </div>
            ))}
          </div>

          {/* Category Breakdown */}
          {(groups ?? []).map((group) => (
            <section key={group.id} className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-cyan rounded-full" />
                <h2 className="text-heading text-sm text-text-primary">{group.name}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(group.advance_categories ?? []).map((cat: {
                  id: string;
                  name: string;
                  advance_subcategories?: { id: string; name: string }[];
                }) => (
                  <div key={cat.id} className="card-elevated p-5">
                    <h3 className="text-heading text-xs text-text-primary mb-3">{cat.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {(cat.advance_subcategories ?? []).map((sub: { id: string; name: string }) => (
                        <span
                          key={sub.id}
                          className="px-2.5 py-1 rounded text-[0.625rem] text-text-secondary bg-surface-raised border border-border-subtle hover:border-cyan/30 hover:text-cyan transition-all cursor-pointer"
                          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                        >
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
