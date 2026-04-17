'use client';

import { useActionState, useState } from 'react';
import { loginWithPassword, loginWithMagicLink, type LoginState } from './actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [passwordState, passwordAction, passwordPending] = useActionState<LoginState, FormData>(loginWithPassword, undefined);
  const [magicState, magicAction, magicPending] = useActionState<LoginState, FormData>(loginWithMagicLink, undefined);

  const state = mode === 'password' ? passwordState : magicState;
  const pending = mode === 'password' ? passwordPending : magicPending;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-bg">
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
            <span className="text-heading text-sm tracking-[0.2em] text-text-primary">GVTEWAY</span>
          </div>
          <h1 className="text-display text-3xl text-text-primary mb-2">Sign In</h1>
          <p className="text-sm text-text-secondary">
            {mode === 'password' ? 'Sign in with your credentials' : 'Enter your email to receive a magic link'}
          </p>
        </div>

        {/* Error message */}
        {state?.error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center" role="alert">
            {state.error}
          </div>
        )}

        {/* Magic link success */}
        {mode === 'magic' && magicState?.success && (
          <div className="mb-4 p-3 rounded bg-cyan/10 border border-cyan/20 text-cyan text-xs text-center" role="status">
            Check your email for the magic link!
          </div>
        )}

        {/* Form */}
        <form action={mode === 'password' ? passwordAction : magicAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-2">Email</label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
              className="w-full text-base py-3"
              autoComplete="email"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label htmlFor="password" className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-2">Password</label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="w-full text-base py-3"
                autoComplete="current-password"
              />
            </div>
          )}

          <Button type="submit" variant="primary" disabled={pending} className="w-full h-12 text-sm mt-2">
            {pending ? 'Signing in...' : mode === 'password' ? 'Sign In' : 'Send Magic Link'}
          </Button>
        </form>

        {/* Mode toggle */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
            className="text-xs text-cyan hover:text-cyan-bright transition-colors"
          >
            {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-[0.625rem] tracking-wider uppercase text-text-disabled">Or</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* OAuth */}
        <div className="space-y-3">
          <Button variant="ghost" className="w-full h-12 border border-border text-text-secondary text-sm hover:text-text-primary hover:border-cyan/30">
            Continue with Google
          </Button>
          <Button variant="ghost" className="w-full h-12 border border-border text-text-secondary text-sm hover:text-text-primary hover:border-cyan/30">
            Continue with GitHub
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-disabled mt-10">
          Don&apos;t have an account? <a href="/signup" className="text-cyan hover:text-cyan-bright transition-colors">Sign up</a>
        </p>
      </div>
    </div>
  );
}
