import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `Technical Rider -- ${slug} -- GVTEWAY`,
    description: `Confirm or override backline equipment for your set.`,
  };
}

export default async function TechnicalRiderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch talent-facing catalog items (backline)
  const { data: backlineItems } = await supabase
    .from('advance_items')
    .select(`
      id, name, manufacturer, model, unit, specifications, visibility_tags,
      advance_subcategories!inner (
        id, name,
        advance_categories!inner (
          id, name, slug
        )
      )
    `)
    .contains('visibility_tags', ['talent_facing'])
    .eq('is_active', true)
    .order('name');

  // Group items by subcategory
  const grouped = (backlineItems ?? []).reduce<Record<string, { name: string; items: typeof backlineItems }>>((acc, item) => {
    const sub = item.advance_subcategories as unknown as { id: string; name: string };
    if (!acc[sub.id]) {
      acc[sub.id] = { name: sub.name, items: [] };
    }
    acc[sub.id].items!.push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${slug}/artist/advancing`} className="text-label text-cyan hover:text-cyan-bright transition-colors mb-2 block">
            &larr; Advancing
          </Link>
          <h1 className="text-display text-3xl text-text-primary">Technical Rider</h1>
          <p className="text-sm text-text-secondary mt-1">
            Review the default backline below. Confirm each item, override with a substitute, or add custom requirements.
          </p>
        </div>
      </header>

      {/* Backline confirmation */}
      <div className="flex-1 px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Status bar */}
          <div className="card-elevated p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="badge border text-draft border-draft/30 bg-draft/10">Draft</span>
              <span className="text-xs text-text-tertiary">Auto-saves as you make changes</span>
            </div>
            <button className="btn btn-primary text-xs py-2 px-6">
              Submit Rider
            </button>
          </div>

          {/* Item groups */}
          {Object.entries(grouped).map(([subId, group]) => (
            <section key={subId} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-cyan rounded-full" />
                <h2 className="text-heading text-sm text-text-primary">{group.name}</h2>
                <span className="text-label text-text-disabled text-[0.5rem]">{group.items!.length} items</span>
              </div>

              <div className="space-y-2">
                {group.items!.map((item) => (
                  <div key={item.id} className="card p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-primary font-medium">{item.name}</span>
                        <span className="text-mono text-[0.625rem] text-text-disabled">
                          {item.manufacturer} {item.model}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={0}
                        min={0}
                        max={99}
                        className="input w-16 text-center text-sm py-1.5"
                        aria-label={`Quantity for ${item.name}`}
                      />
                      <select
                        className="input text-xs py-1.5 w-28"
                        defaultValue="confirm"
                        aria-label={`Action for ${item.name}`}
                      >
                        <option value="confirm">Confirm</option>
                        <option value="override">Override</option>
                        <option value="remove">Remove</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Custom additions */}
          <section className="mt-12 card p-6">
            <h3 className="text-heading text-sm text-text-primary mb-4">Custom Requirements</h3>
            <p className="text-xs text-text-tertiary mb-4">
              Need something not in the catalog? Add it here and the production team will review.
            </p>
            <textarea
              className="input w-full h-24 resize-none"
              placeholder="Describe any additional equipment, special requirements, or notes for the production team..."
              aria-label="Custom requirements"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
