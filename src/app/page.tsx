import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1E1E1E' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan" />
          <span className="text-heading text-sm tracking-[0.2em] text-text-primary">GVTEWAY</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-label text-text-secondary hover:text-text-primary transition-colors">
            Login
          </Link>
          <Link href="/signup" className="btn btn-primary text-xs py-2 px-5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-8 pt-32 pb-20 relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }} />

        {/* Glow orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{
          background: 'radial-gradient(circle, #00E5FF 0%, transparent 70%)'
        }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="text-label text-cyan mb-6 animate-fade-in">Universal Production Advancing</div>

          <h1 className="text-display text-6xl md:text-8xl lg:text-9xl text-text-primary mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            GVTEWAY
          </h1>

          <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            One catalog. Two views. Enterprise-grade production advancing that unifies talent and production workflows into a single source of truth.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link href="/signup" className="btn btn-primary px-8 py-3">
              Start Advancing
            </Link>
            <Link href="/login" className="btn btn-secondary px-8 py-3">
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="relative z-10 max-w-6xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <FeatureCard
            title="Unified Catalog"
            description="350+ items across 10 collections. One catalog, role-filtered views. Talent sees backline. Production sees everything."
            stat="350+"
            statLabel="Catalog Items"
          />
          <FeatureCard
            title="Dual-Track Advancing"
            description="6 talent deliverables. 9 production deliverables. Approval chains, version history, deadline enforcement."
            stat="15"
            statLabel="Deliverable Types"
          />
          <FeatureCard
            title="11-Role RBAC"
            description="Developer to industry guest. Org-scoped, project-scoped, row-level security. Every query filtered at the database."
            stat="11"
            statLabel="Platform Roles"
          />
        </div>

        {/* Parity markers */}
        <div className="relative z-10 max-w-6xl mx-auto mt-24 w-full">
          <div className="text-label text-text-tertiary text-center mb-8">Exceeds Lennd In</div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Catalog Intelligence',
              'Dual-Track Advancing',
              'Template System',
              'Catering Module',
              'Multi-Project',
              'CMS Blocks',
              'Notification Engine',
              'Open API',
              'Role Granularity',
              'Version History',
            ].map((item) => (
              <span key={item} className="px-4 py-2 rounded-full text-xs text-text-secondary border border-border hover:border-cyan/30 hover:text-cyan transition-all cursor-default" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan" />
          <span className="text-label text-text-tertiary">GVTEWAY</span>
        </div>
        <span className="text-xs text-text-disabled" style={{ fontFamily: 'var(--font-mono)' }}>
          GHXSTSHIP &copy; {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, stat, statLabel }: {
  title: string;
  description: string;
  stat: string;
  statLabel: string;
}) {
  return (
    <div className="card p-8 flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-heading text-sm text-text-primary">{title}</h3>
        <div className="text-right">
          <div className="text-display text-2xl text-cyan">{stat}</div>
          <div className="text-label text-[0.5rem] text-text-tertiary mt-0.5">{statLabel}</div>
        </div>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed flex-1">{description}</p>
    </div>
  );
}
