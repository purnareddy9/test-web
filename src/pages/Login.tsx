import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, AlertCircle, Info, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { setLocalSessionLoginTime } from '../lib/settings';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isTimeout = searchParams.get('reason') === 'timeout';
  const isGlobalLogout = searchParams.get('reason') === 'global_logout';
  const isRevoked = searchParams.get('reason') === 'revoked';

  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState(!supabaseConfigured ? 'admin@example.com' : '');
  const [password, setPassword] = useState(!supabaseConfigured ? 'admin' : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      try {
        if (!supabaseConfigured) {
          const isLocalAuth = localStorage.getItem('local_demo_auth') === 'true';
          if (isLocalAuth && mounted) {
            navigate('/admin', { replace: true });
            return;
          }
        } else {
          const { data, error: sessionErr } = await supabase.auth.getSession();
          if (!sessionErr && data?.session && mounted) {
            navigate('/admin', { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError('');

    try {
      if (!supabaseConfigured) {
        if (email.trim() === 'admin@example.com' && password === 'admin') {
          localStorage.setItem('local_demo_auth', 'true');
          setLocalSessionLoginTime();
          navigate('/admin', { replace: true });
          return;
        } else {
          setError('Demo credentials: admin@example.com / admin');
          return;
        }
      }

      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (err) {
        setError(err.message);
        return;
      }

      // Login successful
      setLocalSessionLoginTime();
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span className="font-display font-semibold text-white">
            Admin Login
          </span>
        </div>

        <div className="card p-7">
          {isTimeout && (
            <div className="mb-5 p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs text-amber-300 flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>Session timed out due to inactivity. Please sign in again.</span>
            </div>
          )}
          {isGlobalLogout && (
            <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>You have been signed out from all devices.</span>
            </div>
          )}
          {isRevoked && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>This session was terminated from another device. Please sign in again.</span>
            </div>
          )}
          {!supabaseConfigured && (
            <div className="mb-5 p-3 bg-cyan-400/[0.08] border border-cyan-400/20 rounded-lg text-xs">
              <div className="flex items-center gap-1.5 text-cyan-400 font-medium mb-1">
                <Info className="w-3.5 h-3.5" />
                <span>Demo Mode (Supabase Unconfigured)</span>
              </div>
              <p className="text-white/60">Email: <span className="font-mono text-cyan-300">admin@example.com</span></p>
              <p className="text-white/60">Password: <span className="font-mono text-cyan-300">admin</span></p>
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs text-white/40 mb-1.5"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="pwd"
                className="block text-xs text-white/40 mb-1.5"
              >
                Password
              </label>

              <input
                id="pwd"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-1 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/15 text-xs mt-5 font-mono">
          Portfolio Admin — restricted access
        </p>
      </motion.div>
    </div>
  );
}
