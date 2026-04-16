import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Signup -- GVTEWAY` };
}

export default async function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)',
        backgroundSize: '64px 64px'
      }} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-cyan" />
            <span className="text-heading text-sm tracking-[0.2em]">GVTEWAY</span>
          </div>
          <h1 className="text-display text-3xl text-text-primary mb-2">Create Account</h1>
          <p className="text-sm text-text-secondary">Get started with universal production advancing</p>
        </div>

        <form className="space-y-4">
          <div>
            <label htmlFor="signup-name" className="text-label text-text-tertiary block mb-2">Full Name</label>
            <input id="signup-name" name="name" type="text" placeholder="Your full name" required className="input w-full" />
          </div>
          <div>
            <label htmlFor="signup-email" className="text-label text-text-tertiary block mb-2">Email</label>
            <input id="signup-email" name="email" type="email" placeholder="you@company.com" required className="input w-full" autoComplete="email" />
          </div>
          <div>
            <label htmlFor="signup-org" className="text-label text-text-tertiary block mb-2">Organization</label>
            <input id="signup-org" name="organization" type="text" placeholder="Your company or organization" className="input w-full" />
          </div>
          <button type="submit" className="btn btn-primary w-full py-3">Create Account</button>
        </form>

        <p className="text-center text-xs text-text-disabled mt-8">
          Already have an account? <a href="/login" className="text-cyan hover:text-cyan-bright transition-colors">Sign in</a>
        </p>
      </div>
    </div>
  );
}
