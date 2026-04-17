import Link from 'next/link';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { SectionHeading } from '@/components/data/SectionHeading';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { 
  const { slug } = await params; 
  return { title: `Catering -- ${slug} -- GVTEWAY` }; 
}

export default async function ArtistCateringPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const opts = [
    { id: 'vegan', l: 'Vegan' }, { id: 'vegetarian', l: 'Vegetarian' }, 
    { id: 'gluten_free', l: 'Gluten Free' }, { id: 'halal', l: 'Halal' }, 
    { id: 'kosher', l: 'Kosher' }, { id: 'dairy_free', l: 'Dairy Free' }, 
    { id: 'nut_free', l: 'Nut Free' }
  ];

  return (
    <>
      <ModuleHeader
        title="Catering Preferences"
        subtitle="Set dietary requirements for your team"
        backHref={`/${slug}/artist`}
        backLabel="Artist Portal"
        maxWidth="4xl"
      />

      <div className="page-content" style={{ maxWidth: '4xl' }}>
        <form className="flex flex-col gap-6">
          <section className="card p-6">
            <SectionHeading>Dietary Requirements</SectionHeading>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {opts.map((o) => (
                <label 
                  key={o.id} 
                  className="flex items-center gap-3 bg-surface-raised rounded-lg p-3 cursor-pointer hover:border-cyan/50 border border-transparent transition-colors"
                >
                  <input type="checkbox" name={o.id} className="accent-cyan w-4 h-4 shrink-0" />
                  <span className="text-sm text-text-primary">{o.l}</span>
                </label>
              ))}
            </div>
          </section>
          
          <section className="card p-6">
            <SectionHeading>Allergies & Notes</SectionHeading>
            <textarea 
              rows={3} 
              placeholder="List any specific allergies or dietary notes..." 
              className="w-full p-3 bg-surface-raised border border-border rounded-md text-text-primary text-sm focus:outline-none focus:border-cyan resize-y min-h-[80px]"
            />
          </section>

          <section className="card p-6">
            <h2 className="font-heading text-[0.875rem] text-text-primary mb-2">Head Count</h2>
            <p className="text-xs text-text-tertiary mb-3">How many people in your party need meals?</p>
            <Input type="number" defaultValue={1} min={1} className="w-24 text-center font-mono" />
          </section>

          <div className="flex justify-end pt-2">
            <Button variant="primary" type="submit" size="lg" className="px-8 font-heading tracking-wider uppercase text-xs">
              Save Preferences
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
