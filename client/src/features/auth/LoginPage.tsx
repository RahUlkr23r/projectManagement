import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, Code, UserPlus, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState<'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER'>('DEVELOPER');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegisterMode) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setIsRegisterMode(false);
    setEmail(demoEmail);
    setPassword('Password123!');
    setLoading(true);
    setError(null);
    login(demoEmail, 'Password123!').catch((err) => {
      setError(err.message || 'Login failed');
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 items-center justify-center font-bold text-xl text-white shadow-lg mb-3">
            V
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Velozity Global</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time Client Project Dashboard with Live Activity Feed
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-5 grid grid-cols-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setError(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                !isRegisterMode
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setError(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                isRegisterMode
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Developer"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@velozity.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Your Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="DEVELOPER">Developer (Assigned tasks & status updates)</option>
                <option value="PROJECT_MANAGER">Project Manager (Owns projects & assigns tasks)</option>
                <option value="ADMIN">Admin (Full global agency control & presence)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-md disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : isRegisterMode
              ? 'Create Live Account'
              : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Quick Demo Logins Section */}
        <div className="mt-8 border-t border-slate-800 pt-5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick 1-Click Role Accounts (Seed Data in Neon)
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@velozity.com')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-purple-500/30 text-xs text-purple-200 transition"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="font-semibold">Sarah Admin</span>
              </div>
              <span className="text-[10px] bg-purple-900/60 px-2 py-0.5 rounded text-purple-300">
                ADMIN
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('pm1@velozity.com')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-blue-500/30 text-xs text-blue-200 transition"
            >
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span className="font-semibold">Priya Sharma</span>
              </div>
              <span className="text-[10px] bg-blue-900/60 px-2 py-0.5 rounded text-blue-300">
                PM (2 Projects)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('pm2@velozity.com')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-blue-500/30 text-xs text-blue-200 transition"
            >
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span className="font-semibold">David Miller</span>
              </div>
              <span className="text-[10px] bg-blue-900/60 px-2 py-0.5 rounded text-blue-300">
                PM (1 Project)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('dev1@velozity.com')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 text-xs text-emerald-200 transition"
            >
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Ravi Kumar</span>
              </div>
              <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300">
                DEVELOPER
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
