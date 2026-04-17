import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { SectionHeading } from '@/components/data/SectionHeading';
import { Input } from '@/components/ui/Input';

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
    <>
      <ModuleHeader
        title="Unified Advancing Catalog"
        subtitle={`${itemCount ?? 0} items across ${groups?.length ?? 0} collections`}
        maxWidth="7xl"
      >
        <Input
          type="search"
          placeholder="Search catalog..."
          className="w-72 h-[30px] text-xs py-1.5"
          inputId="catalog-search"
        />
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '7xl' }}>
        {/* Collection Grid */}
        <ContentGrid columns={{ sm: 1, md: 2, lg: 3 }} gap="1rem" className="mb-12">
          {(groups ?? []).map((group) => (
            <div key={group.id} className="card p-5 group cursor-pointer hover:border-cyan transition-colors">
              <div className="font-heading text-xs text-text-primary mb-1 group-hover:text-cyan transition-colors">
                {group.name}
              </div>
              <div className="text-xs text-text-tertiary mb-3">
                {group.description}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl text-cyan">
                  {(group.advance_categories ?? []).reduce(
                    (acc: number, cat: { advance_subcategories?: unknown[] }) =>
                      acc + (cat.advance_subcategories?.length ?? 0),
                    0
                  )}
                </span>
                <span className="text-[0.5rem] tracking-wider uppercase text-text-disabled">Subcategories</span>
              </div>
            </div>
          ))}
        </ContentGrid>

        {/* Category Breakdown */}
        {(groups ?? []).map((group) => (
          <section key={group.id} className="mb-12">
            <SectionHeading accentColor="var(--color-cyan)">{group.name}</SectionHeading>

            <ContentGrid columns={{ sm: 1, md: 2, lg: 3 }} gap="1rem">
              {(group.advance_categories ?? []).map((cat: {
                id: string;
                name: string;
                advance_subcategories?: { id: string; name: string }[];
              }) => (
                <div key={cat.id} className="card-elevated p-5">
                  <h3 className="font-heading text-xs text-text-primary mb-3">{cat.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {(cat.advance_subcategories ?? []).map((sub: { id: string; name: string }) => (
                      <span
                        key={sub.id}
                        className="px-2.5 py-1 rounded text-[0.625rem] text-text-secondary bg-surface-raised border border-border-subtle hover:border-cyan/30 hover:text-cyan transition-all cursor-pointer font-heading tracking-wider uppercase"
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </ContentGrid>
          </section>
        ))}
      </div>
    </>
  );
}
