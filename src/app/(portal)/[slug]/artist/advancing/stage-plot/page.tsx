import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Stage Plot -- ${slug} -- GVTEWAY` };
}

export default async function StagePlotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${slug}/artist/advancing`} className="text-label text-cyan hover:text-cyan-bright transition-colors mb-2 block">&larr; Advancing</Link>
          <h1 className="text-display text-3xl text-text-primary">Stage Plot</h1>
          <p className="text-sm text-text-secondary mt-1">Physical stage layout showing equipment positions, monitors, and sight lines.</p>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="card-elevated p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="badge border text-draft border-draft/30 bg-draft/10">Draft</span>
            </div>
            <button className="btn btn-primary text-xs py-2 px-6">Submit</button>
          </div>

          {/* Stage canvas */}
          <div className="card p-8 mb-6">
            <div className="aspect-[16/9] bg-surface-raised rounded border border-border-subtle flex items-center justify-center relative overflow-hidden">
              {/* Stage front indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan/30" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-label text-text-disabled text-[0.5rem]">Stage Front / Audience</div>

              {/* DJ position marker */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                <div className="w-24 h-12 border-2 border-dashed border-cyan/40 rounded flex items-center justify-center">
                  <span className="text-label text-cyan text-[0.5rem]">DJ Booth</span>
                </div>
                <span className="text-[0.5rem] text-text-disabled">CDJ x4 + Mixer</span>
              </div>

              {/* Monitor positions */}
              <div className="absolute bottom-12 left-1/4 w-8 h-4 border border-text-disabled/30 rounded flex items-center justify-center">
                <span className="text-[0.4rem] text-text-disabled">MON</span>
              </div>
              <div className="absolute bottom-12 right-1/4 w-8 h-4 border border-text-disabled/30 rounded flex items-center justify-center">
                <span className="text-[0.4rem] text-text-disabled">MON</span>
              </div>
            </div>
          </div>

          {/* Upload / draw options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-6 text-center">
              <h3 className="text-heading text-xs text-text-primary mb-2">Upload Stage Plot</h3>
              <p className="text-xs text-text-tertiary mb-4">Upload a PDF, PNG, or JPG of your stage plot</p>
              <label className="btn btn-secondary text-xs py-2 px-6 cursor-pointer">
                Choose File
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
              </label>
            </div>
            <div className="card p-6 text-center">
              <h3 className="text-heading text-xs text-text-primary mb-2">Describe Your Setup</h3>
              <p className="text-xs text-text-tertiary mb-4">Or describe your stage requirements in detail</p>
              <textarea className="input w-full h-20 resize-none text-sm" placeholder="Describe positions, monitor placement, sight line requirements..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
