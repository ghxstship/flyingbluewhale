import Link from 'next/link';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { SectionHeading } from '@/components/data/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Stage Plot -- ${slug} -- GVTEWAY` };
}

export default async function StagePlotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <>
      <ModuleHeader
        title="Stage Plot"
        subtitle="Physical stage layout showing equipment positions, monitors, and sight lines."
        backHref={`/${slug}/artist/advancing`}
        backLabel="Advancing"
        maxWidth="4xl"
      />

      <div className="page-content" style={{ maxWidth: '4xl' }}>
        <div className="card-elevated p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="muted">Draft</Badge>
          </div>
          <Button variant="primary" size="sm">Submit</Button>
        </div>

        {/* Stage canvas */}
        <div className="card p-8 mb-6">
          <div className="aspect-[16/9] bg-[var(--color-bg)] rounded-lg border border-border-subtle flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Stage front indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-cyan/40" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[0.625rem] tracking-wider uppercase text-text-tertiary">Stage Front / Audience</div>

            {/* DJ position marker */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
              <div className="w-32 h-16 border-2 border-dashed border-cyan/50 bg-cyan/5 rounded-md flex items-center justify-center">
                <span className="text-[0.625rem] tracking-wider uppercase text-cyan font-semibold">DJ Booth</span>
              </div>
              <span className="text-[0.625rem] text-text-tertiary font-mono">CDJ x4 + Mixer</span>
            </div>

            {/* Monitor positions */}
            <div className="absolute bottom-16 left-1/4 w-10 h-6 border-2 border-text-disabled/40 bg-surface-raised rounded-sm flex items-center justify-center -rotate-12">
              <span className="text-[0.4rem] font-bold text-text-tertiary">MON</span>
            </div>
            <div className="absolute bottom-16 right-1/4 w-10 h-6 border-2 border-text-disabled/40 bg-surface-raised rounded-sm flex items-center justify-center rotate-12">
              <span className="text-[0.4rem] font-bold text-text-tertiary">MON</span>
            </div>
          </div>
        </div>

        {/* Upload / draw options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-8 text-center flex flex-col items-center justify-center h-full">
            <SectionHeading className="justify-center">Upload Stage Plot</SectionHeading>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">Upload a PDF, PNG, or JPG of your stage plot</p>
            <label className="btn btn-secondary text-sm py-2 px-6 cursor-pointer inline-block">
              Choose File
              <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
            </label>
          </div>
          <div className="card p-6">
            <SectionHeading>Describe Your Setup</SectionHeading>
            <p className="text-xs text-text-secondary mb-3 leading-relaxed">Or describe your stage requirements in detail</p>
            <textarea className="input w-full h-24 resize-none text-sm p-3 bg-surface border border-border focus:outline-none focus:border-cyan text-text-primary rounded-md" placeholder="Describe positions, monitor placement, sight line requirements..." />
          </div>
        </div>
      </div>
    </>
  );
}
