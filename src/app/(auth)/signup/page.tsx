'use client';

import { useActionState } from 'react';
import { signup, type SignupState } from './actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(signup, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-bg">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)',
        backgroundSize: '64px 64px'
      }} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-cyan" />
            <span className="text-heading text-sm tracking-[0.2em] text-text-primary">GVTEWAY</span>
          </div>
          <h1 className="text-display text-3xl text-text-primary mb-2">Create Account</h1>
          <p className="text-sm text-text-secondary">Get started with universal production advancing</p>
        </div>

        {/* Error message */}
        {state?.error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center" role="alert">
            {state.error}
          </div>
        )}

        {/* Email confirmation success */}
        {state?.success && (
          <div className="mb-4 p-3 rounded bg-cyan/10 border border-cyan/20 text-cyan text-xs text-center" role="status">
            Account created! Check your email to confirm your account.
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="signup-name" className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-2">Full Name</label>
            <Input id="signup-name" name="name" type="text" placeholder="Your full name" required className="w-full text-base py-3" />
          </div>
          <div>
            <label htmlFor="signup-email" className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-2">Email</label>
            <Input id="signup-email" name="email" type="email" placeholder="you@company.com" required className="w-full text-base py-3" autoComplete="email" />
          </div>
          <div>
            <label htmlFor="signup-password" className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-2">Password</label>
            <Input id="signup-password" name="password" type="password" placeholder="••••••••" required minLength={6} className="w-full text-base py-3" autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="signup-org" className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-2">Organization</label>
            <Input id="signup-org" name="organization" type="text" placeholder="Your company or organization" className="w-full text-base py-3" />
          </div>
          <Button type="submit" variant="primary" disabled={pending} className="w-full h-12 text-sm mt-4">
            {pending ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-xs text-text-disabled mt-8">
          Already have an account? <a href="/login" className="text-cyan hover:text-cyan-bright transition-colors">Sign in</a>
        </p>
      </div>
    </div>
  );
}
