'use client';

import { useState } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginFormProps {
  onLogin: (user: { id: string; name: string; email: string | null; avatar: string | null }) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isRegister ? 'register' : 'login',
          email,
          password,
          name: isRegister ? name : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setIsLoading(false);
        return;
      }

      if (data.success && data.user) {
        onLogin(data.user);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-mesh flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] -top-40 -left-40"
          style={{ background: 'var(--a1)' }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] -bottom-32 -right-32"
          style={{ background: 'var(--a3)' }}
        />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo & heading */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-2xl animate-float"
            style={{ boxShadow: '0 8px 32px var(--a-glow)' }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            <span className="gradient-text">LifeDash Pro</span>
          </h1>
          <p className="text-sm text-muted-foreground">AI Life Operating System</p>
        </div>

        {/* Form card */}
        <div className="glass-panel rounded-3xl p-8">
          {/* Tab switcher */}
          <div className="flex mb-6 bg-muted/30 rounded-xl p-1">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                !isRegister
                  ? 'gradient-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                isRegister
                  ? 'gradient-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field (register only) */}
            {isRegister && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required={isRegister}
                    className="w-full bg-muted/30 border border-border/50 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-[var(--a1)]/50 focus:ring-2 focus:ring-[var(--a1)]/10 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-muted/30 border border-border/50 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-[var(--a1)]/50 focus:ring-2 focus:ring-[var(--a1)]/10 transition-all placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? 'Create a password' : 'Enter your password'}
                  required
                  minLength={4}
                  className="w-full bg-muted/30 border border-border/50 rounded-xl pl-11 pr-11 py-3 text-sm outline-none focus:border-[var(--a1)]/50 focus:ring-2 focus:ring-[var(--a1)]/10 transition-all placeholder:text-muted-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-scale-in">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full gradient-primary text-white font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
              style={{ boxShadow: '0 4px 20px var(--a-glow-soft)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isRegister ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          {!isRegister && (
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground/60">
                Demo: use any email & password to login
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground/40 mt-6">
          Secured with SHA-256 encryption
        </p>
      </div>
    </div>
  );
}
