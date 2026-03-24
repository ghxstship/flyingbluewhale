import Link from 'next/link';
import { guides } from '@/data';

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
          <p>GHXSTSHIP Industries</p>
          <p className="mt-1">sos@ghxstship.pro</p>
        </footer>
      </main>
    </div>
  );
}
