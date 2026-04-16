'use client';

import { useActionState, useState } from 'react';
import { loginWithPassword, loginWithMagicLink, type LoginState } from './actions';

export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [passwordState, passwordAction, passwordPending] = useActionState<LoginState, FormData>(loginWithPassword, undefined);
  const [magicState, magicAction, magicPending] = useActionState<LoginState, FormData>(loginWithMagicLink, undefined);

  const state = mode === 'password' ? passwordState : magicState;
  const pending = mode === 'password' ? passwordPending : magicPending;

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
          <p className="text-sm text-text-secondary">
            {mode === 'password' ? 'Sign in with your credentials' : 'Enter your email to receive a magic link'}
          </p>
        </div>

        {/* Error message */}
        {state?.error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs" role="alert">
            {state.error}
          </div>
        )}

        {/* Magic link success */}
        {mode === 'magic' && magicState?.success && (
          <div className="mb-4 p-3 rounded bg-cyan/10 border border-cyan/20 text-cyan text-xs" role="status">
            Check your email for the magic link!
          </div>
        )}

        {/* Form */}
        <form action={mode === 'password' ? passwordAction : magicAction} className="space-y-4">
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

          {mode === 'password' && (
            <div>
              <label htmlFor="password" className="text-label text-text-tertiary block mb-2">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="input w-full"
                autoComplete="current-password"
              />
            </div>
          )}

          <button type="submit" disabled={pending} className="btn btn-primary w-full py-3 disabled:opacity-50">
            {pending ? 'Signing in...' : mode === 'password' ? 'Sign In' : 'Send Magic Link'}
          </button>
        </form>

        {/* Mode toggle */}
        <div className="text-center mt-4">
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
          Don&apos;t have an account? <a href="/signup" className="text-cyan hover:text-cyan-bright transition-colors">Sign up</a>
        </p>
      </div>
    </div>
  );
}
