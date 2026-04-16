import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Hospitality Rider -- ${slug} -- GVTEWAY` };
}

export default async function HospitalityRiderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const sections = [
    { id: 'dressing', label: 'Dressing Room', fields: [
      { label: 'Private dressing room required', type: 'toggle' },
      { label: 'Mirror and lighting', type: 'toggle' },
      { label: 'Clothing rack / steamer', type: 'toggle' },
      { label: 'Additional notes', type: 'textarea' },
    ]},
    { id: 'beverages', label: 'Beverages', fields: [
      { label: 'Still water (quantity)', type: 'number' },
      { label: 'Sparkling water (quantity)', type: 'number' },
      { label: 'Coconut water', type: 'toggle' },
      { label: 'Fresh juice', type: 'toggle' },
      { label: 'Hot tea / coffee', type: 'toggle' },
      { label: 'Specific alcohol requests', type: 'textarea' },
    ]},
    { id: 'food', label: 'Food', fields: [
      { label: 'Pre-show meal required', type: 'toggle' },
      { label: 'Dietary restrictions', type: 'text' },
      { label: 'Fresh fruit', type: 'toggle' },
      { label: 'Snacks / nuts / trail mix', type: 'toggle' },
      { label: 'Additional food requests', type: 'textarea' },
    ]},
    { id: 'misc', label: 'Miscellaneous', fields: [
      { label: 'Towels (quantity)', type: 'number' },
      { label: 'Wi-Fi access', type: 'toggle' },
      { label: 'Power strips with USB', type: 'toggle' },
      { label: 'Iron / steamer', type: 'toggle' },
      { label: 'Other requests', type: 'textarea' },
    ]},
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${slug}/artist/advancing`} className="text-label text-cyan hover:text-cyan-bright transition-colors mb-2 block">&larr; Advancing</Link>
          <h1 className="text-display text-3xl text-text-primary">Hospitality Rider</h1>
          <p className="text-sm text-text-secondary mt-1">Green room, catering, and dressing room requirements.</p>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="card-elevated p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="badge border text-draft border-draft/30 bg-draft/10">Draft</span>
              <span className="text-xs text-text-tertiary">Auto-saves as you make changes</span>
            </div>
            <button className="btn btn-primary text-xs py-2 px-6">Submit Rider</button>
          </div>

          {sections.map((section) => (
            <section key={section.id} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-cyan rounded-full" />
                <h2 className="text-heading text-sm text-text-primary">{section.label}</h2>
              </div>
              <div className="card p-5 space-y-4">
                {section.fields.map((field) => (
                  <div key={field.label} className="flex items-center justify-between">
                    <label className="text-sm text-text-secondary">{field.label}</label>
                    {field.type === 'toggle' && (
                      <button className="w-10 h-5 rounded-full bg-surface-raised border border-border transition-colors hover:border-cyan/40 relative" aria-label={field.label}>
                        <div className="w-3.5 h-3.5 rounded-full bg-text-disabled absolute top-0.5 left-0.5 transition-transform" />
                      </button>
                    )}
                    {field.type === 'number' && <input type="number" defaultValue={0} min={0} className="input w-20 text-center text-sm py-1.5" />}
                    {field.type === 'text' && <input type="text" className="input w-64 text-sm py-1.5" placeholder="Specify..." />}
                    {field.type === 'textarea' && <textarea className="input w-64 text-sm py-1.5 h-16 resize-none" placeholder="Details..." />}
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
