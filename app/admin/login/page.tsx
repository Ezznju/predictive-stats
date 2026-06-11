'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError('Wrong password');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-amber via-brand-yellow to-brand-orange flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your password to continue</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              <Lock className="w-3 h-3 inline mr-1" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password..."
                autoFocus
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-orange-600 hover:bg-orange-600/90 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-display font-semibold text-sm transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
