import Link from 'next/link';
import { guides } from '@/data';
import { EVENT } from '@/data/shared';

export default function Home() {
  const sortedGuides = Object.entries(guides).sort(
    ([, a], [, b]) => a.tier - b.tier
  );

  return (
    <div className="min-h-screen bg-[#111111]">
      <main
        id="main-content"
        className="mx-auto max-w-5xl px-6 py-20 sm:px-10 lg:px-16 lg:py-28"
      >
        {/* Header */}
        <div className="mb-20 text-center">
          <h1 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
            BLACK COFFEE + CARLITA + KAZ JAMES
          </h1>
          <p className="mt-3 font-display text-xl font-bold text-white/80 sm:text-2xl lg:text-3xl">
            Open Air at the Racetrack
          </p>

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-[#E84393] sm:text-base">
            KNOW BEFORE YOU GO
          </p>

          <div className="mt-6 space-y-1 text-base text-white/60 sm:text-lg">
            <p>Saturday, March 28, 2026</p>
            <p>Miami Music Week 2026</p>
          </div>
        </div>

        {/* Guide Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedGuides.map(([slug, guide]) => (
            <Link
              key={slug}
              href={`/guide/${slug}`}
              className="group rounded-xl border border-[#333] bg-[#1E1E1E] p-6 transition-all duration-200 hover:scale-[1.02] hover:border-[#E84393] hover:shadow-lg hover:shadow-[#E84393]/20"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E84393]/15 text-xs font-bold text-[#E84393]">
                  T{guide.tier}
                </span>
                <span className="text-xl">{guide.icon}</span>
              </div>
              <h2 className="font-display text-lg font-bold text-white">
                {guide.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {guide.scope}
              </p>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center text-xs text-white/30">
          <p className="tracking-[0.2em] font-semibold text-white/40">{EVENT.producer}</p>
          <div className="flex justify-center items-center gap-5 mt-3">
            <a href={`mailto:${EVENT.contact}`} title="Email us" className="text-white/30 hover:text-[#E84393] transition-colors" aria-label="Email">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>
            </a>
            <a href="https://calendly.com/ghxstship/sync" target="_blank" rel="noopener noreferrer" title="Book a meeting" className="text-white/30 hover:text-[#E84393] transition-colors" aria-label="Schedule">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </a>
            <span className="w-px h-3 bg-white/15" />
            <a href={EVENT.socials.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="text-white/30 hover:text-[#E84393] transition-colors" aria-label="Instagram">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href={EVENT.socials.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="text-white/30 hover:text-[#E84393] transition-colors" aria-label="LinkedIn">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href={EVENT.socials.youtube} target="_blank" rel="noopener noreferrer" title="YouTube" className="text-white/30 hover:text-[#E84393] transition-colors" aria-label="YouTube">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href={EVENT.socials.website} target="_blank" rel="noopener noreferrer" title="Website" className="text-white/30 hover:text-[#E84393] transition-colors" aria-label="Website">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            </a>
          </div>
          <p className="text-[10px] text-white/20 mt-4">&copy; 2026 {EVENT.producer}</p>
        </footer>
      </main>
    </div>
  );
}
