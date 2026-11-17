import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { useAuthUser } from '../lib/auth';

export function SignUpPage() {
  const { user, refreshUser } = useAuthUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshUser();
        navigate('/dashboard');
      } else {
        setError(data.error || 'Failed to create account.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 pt-28 pb-16">
        <GlassCard className="p-8 w-full max-w-md">
          <h1 className="font-syne text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-frost-300 text-sm mb-6">
            Free forever — unlimited scans, AI reports, and monitors.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-widest text-frost-300 font-mono mb-2">
                Email
              </label>
              <GlassInput
                id="email"
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs uppercase tracking-widest text-frost-300 font-mono mb-2">
                Password
              </label>
              <GlassInput
                id="password"
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p role="alert" className="text-sm text-critical">{error}</p>}

            <GlassButton type="submit" isLoading={loading} className="w-full">
              Create account
            </GlassButton>
          </form>

          <p className="text-sm text-frost-300 mt-6 text-center">
            Already registered?{' '}
            <Link to="/sign-in" className="text-primary hover:text-primary-light">
              Sign in
            </Link>
          </p>
        </GlassCard>
      </main>
    </div>
  );
}
