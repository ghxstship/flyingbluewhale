import Link from 'next/link';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { SectionHeading } from '@/components/data/SectionHeading';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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
    <>
      <ModuleHeader
        title="Hospitality Rider"
        subtitle="Green room, catering, and dressing room requirements."
        backHref={`/${slug}/artist/advancing`}
        backLabel="Advancing"
        maxWidth="4xl"
      />

      <div className="page-content" style={{ maxWidth: '4xl' }}>
        <div className="card-elevated p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="muted">Draft</Badge>
            <span className="text-xs text-text-tertiary">Auto-saves as you make changes</span>
          </div>
          <Button variant="primary" size="sm">Submit Rider</Button>
        </div>

        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.id}>
              <SectionHeading accentColor="var(--color-cyan)">{section.label}</SectionHeading>
              
              <div className="card mt-4">
                <div className="flex flex-col">
                  {section.fields.map((field, idx) => (
                    <div key={field.label} className={`flex items-center justify-between p-4 ${idx !== section.fields.length - 1 ? 'border-b border-border-subtle' : ''} hover:bg-surface-raised transition-colors`}>
                      <label className="text-sm text-text-secondary">{field.label}</label>
                      {field.type === 'toggle' && (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-surface-raised peer-focus:outline-none border border-border peer-focus:ring-1 peer-focus:ring-cyan rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-disabled peer-checked:after:bg-cyan peer-checked:border-cyan/30 after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        </label>
                      )}
                      {field.type === 'number' && <Input type="number" defaultValue={0} min={0} className="w-20 text-center font-mono text-sm py-1" />}
                      {field.type === 'text' && <Input type="text" className="w-64 text-sm py-1" placeholder="Specify..." />}
                      {field.type === 'textarea' && <textarea className="input w-64 text-sm py-2 px-3 h-16 resize-none bg-surface border border-border focus:outline-none focus:border-cyan text-text-primary rounded-md" placeholder="Details..." />}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
