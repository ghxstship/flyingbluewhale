import Link from 'next/link';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { CheckInScanner } from '@/components/modules/CheckInScanner';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { 
  const { slug } = await params; 
  return { title: `Check-In -- ${slug} -- GVTEWAY` }; 
}

export default async function CheckInPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const modes = [
    { id: 'credentials', label: 'Credentials', desc: 'Scan QR → verify identity → mark picked up', icon: '🎫' },
    { id: 'catering', label: 'Catering', desc: 'Scan or search → verify meal allocation → check in', icon: '🍽' },
    { id: 'equipment', label: 'Equipment', desc: 'Scan barcode → checkout or return → condition report', icon: '📦' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="border-b border-border py-3 px-4 flex justify-between items-center bg-surface w-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan" />
          <span className="font-heading text-sm tracking-[0.15em] text-text-primary">GVTEWAY</span>
        </div>
        <Link 
          href={`/check-in/${slug}/dashboard`} 
          className="text-xs text-text-secondary px-3 py-1 border border-border rounded-md hover:text-cyan hover:border-cyan/50 transition-colors"
        >
          Dashboard
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="font-display text-4xl text-text-primary capitalize mb-1">
          {slug.replace(/-/g, ' ')}
        </h1>
        <p className="text-[0.625rem] tracking-[0.15em] uppercase text-text-tertiary mb-8">
          On-Site Check-In
        </p>

        <CheckInScanner fallbackSlug={slug} />

        <div className="w-full max-w-md flex flex-col gap-3">
          {modes.map((m) => (
            <button 
              key={m.id} 
              className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4 cursor-pointer text-left w-full hover:border-cyan/50 hover:bg-surface-raised transition-all group"
            >
              <span className="text-3xl">{m.icon}</span>
              <div className="flex-1">
                <h3 className="font-heading text-sm text-text-primary group-hover:text-cyan transition-colors">{m.label}</h3>
                <p className="text-xs text-text-tertiary mt-1">{m.desc}</p>
              </div>
              <span className="text-text-disabled group-hover:text-cyan transition-colors">&rarr;</span>
            </button>
          ))}
        </div>

        <div className="w-full max-w-md mt-10 grid grid-cols-3 gap-3">
          {[{ l: 'Credentials', s: 'issued' }, { l: 'Catering', s: 'checked in' }, { l: 'Equipment', s: 'checked out' }].map((st) => (
            <div key={st.l} className="bg-surface border border-border rounded-xl p-3 text-center">
              <div className="font-display text-xl text-cyan">—</div>
              <div className="text-[0.5rem] tracking-wider uppercase text-text-disabled mt-1">{st.s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
