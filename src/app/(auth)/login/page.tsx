import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Sign In -- GVTEWAY',
  description: 'Sign in to GVTEWAY with magic link or OAuth.',
};

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/console');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)',
        backgroundSize: '64px 64px'
      }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-cyan" />
            <span className="text-heading text-sm tracking-[0.2em]">GVTEWAY</span>
          </div>
          <h1 className="text-display text-3xl text-text-primary mb-2">Sign In</h1>
          <p className="text-sm text-text-secondary">Enter your email to receive a magic link</p>
        </div>

        {/* Form */}
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="text-label text-text-tertiary block mb-2">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
              className="input w-full"
              autoComplete="email"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full py-3">
            Send Magic Link
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-border" />
          <span className="text-label text-text-disabled">Or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* OAuth */}
        <div className="space-y-3">
          <button className="btn btn-ghost w-full py-3 border border-border text-text-secondary text-xs">
            Continue with Google
          </button>
          <button className="btn btn-ghost w-full py-3 border border-border text-text-secondary text-xs">
            Continue with GitHub
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-disabled mt-8">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
