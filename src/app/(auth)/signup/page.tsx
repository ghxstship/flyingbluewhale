'use client';

import { useActionState } from 'react';
import { signup, type SignupState } from './actions';

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(signup, undefined);

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

        {/* Error message */}
        {state?.error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs" role="alert">
            {state.error}
          </div>
        )}

        {/* Email confirmation success */}
        {state?.success && (
          <div className="mb-4 p-3 rounded bg-cyan/10 border border-cyan/20 text-cyan text-xs" role="status">
            Account created! Check your email to confirm your account.
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="signup-name" className="text-label text-text-tertiary block mb-2">Full Name</label>
            <input id="signup-name" name="name" type="text" placeholder="Your full name" required className="input w-full" />
          </div>
          <div>
            <label htmlFor="signup-email" className="text-label text-text-tertiary block mb-2">Email</label>
            <input id="signup-email" name="email" type="email" placeholder="you@company.com" required className="input w-full" autoComplete="email" />
          </div>
          <div>
            <label htmlFor="signup-password" className="text-label text-text-tertiary block mb-2">Password</label>
            <input id="signup-password" name="password" type="password" placeholder="••••••••" required minLength={6} className="input w-full" autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="signup-org" className="text-label text-text-tertiary block mb-2">Organization</label>
            <input id="signup-org" name="organization" type="text" placeholder="Your company or organization" className="input w-full" />
          </div>
          <button type="submit" disabled={pending} className="btn btn-primary w-full py-3 disabled:opacity-50">
            {pending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-text-disabled mt-8">
          Already have an account? <a href="/login" className="text-cyan hover:text-cyan-bright transition-colors">Sign in</a>
        </p>
      </div>
    </div>
  );
}
