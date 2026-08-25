import { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, User, FolderKanban, Wrench, Briefcase,
  Award, MessageSquare, FileText, Settings, LogOut, Menu, X, Terminal,
  Clock, ShieldAlert,
} from 'lucide-react';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { getSessionTimeoutMinutes } from '../../lib/settings';
import type { Session } from '@supabase/supabase-js';

const NAV = [
  { href: '/admin',                icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/profile',        icon: User,            label: 'Profile' },
  { href: '/admin/projects',       icon: FolderKanban,    label: 'Projects' },
  { href: '/admin/skills',         icon: Wrench,          label: 'Skills' },
  { href: '/admin/experience',     icon: Briefcase,       label: 'Experience' },
  { href: '/admin/certifications', icon: Award,           label: 'Certifications' },
  { href: '/admin/messages',       icon: MessageSquare,   label: 'Messages' },
  { href: '/admin/resume',         icon: FileText,        label: 'Resume' },
  { href: '/admin/settings',       icon: Settings,        label: 'Settings' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null | 'loading'>('loading');
  const [sideOpen, setSideOpen] = useState(false);
  const [warningSeconds, setWarningSeconds] = useState<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = 'Admin Panel';
    let mounted = true;

    async function checkAuth() {
      try {
        if (!supabaseConfigured) {
          const isLocalAuth = localStorage.getItem('local_demo_auth') === 'true';
          if (mounted) {
            setSession(isLocalAuth ? ({ user: { email: 'admin@example.com' } } as unknown as Session) : null);
          }
          return;
        }

        // 1. Check local session
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          if (mounted) setSession(null);
          return;
        }

        // 2. Validate token with Supabase server (fails if refresh token revoked)
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          console.warn('Session revoked on server backend:', userError);
          await supabase.auth.signOut().catch(() => {});
          localStorage.removeItem('local_demo_auth');
          if (mounted) setSession(null);
          return;
        }

        // 3. Cross-device revocation verification via site_settings
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('last_revoked_at, active_session_id')
          .eq('id', 'default')
          .maybeSingle();

        if (settingsData?.last_revoked_at) {
          const revokedTime = new Date(settingsData.last_revoked_at).getTime();
          const loginTime = parseInt(localStorage.getItem('admin_login_timestamp') || '0', 10);
          const currentDeviceSessionId = localStorage.getItem('admin_device_session_id');

          // If another device revoked all other sessions:
          if (settingsData.active_session_id && settingsData.active_session_id !== currentDeviceSessionId) {
            console.warn('This device session was revoked from another device.');
            await supabase.auth.signOut().catch(() => {});
            localStorage.removeItem('local_demo_auth');
            if (mounted) {
              setSession(null);
              navigate('/login?reason=revoked', { replace: true });
            }
            return;
          }

          // Or if session was globally revoked:
          if (!settingsData.active_session_id && loginTime > 0 && loginTime < revokedTime) {
            console.warn('This device session was revoked globally.');
            await supabase.auth.signOut().catch(() => {});
            localStorage.removeItem('local_demo_auth');
            if (mounted) {
              setSession(null);
              navigate('/login?reason=revoked', { replace: true });
            }
            return;
          }
        }

        if (mounted) {
          setSession(sessionData.session);
        }
      } catch (err) {
        console.error('Session check failed:', err);
        if (mounted) {
          setSession(null);
        }
      }
    }

    checkAuth();

    if (supabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
        if (mounted) setSession(s);
      });
      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // ── Inactivity Timeout Watchdog with Countdown Warning ──
  useEffect(() => {
    if (!session || session === 'loading') return;

    let timeoutMinutes = getSessionTimeoutMinutes();
    lastActivityRef.current = Date.now();
    let lastThrottle = 0;

    const updateActivity = () => {
      const now = Date.now();
      if (now - lastThrottle < 1000) return; // throttle activity events to 1s
      lastThrottle = now;
      lastActivityRef.current = now;
      setWarningSeconds(null);
    };

    const onTimeoutSettingChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === 'number') {
        timeoutMinutes = customEvent.detail;
        lastActivityRef.current = Date.now();
        setWarningSeconds(null);
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }));
    window.addEventListener('session_timeout_updated', onTimeoutSettingChange);

    const interval = setInterval(() => {
      if (timeoutMinutes <= 0) return;
      const totalTimeoutMs = timeoutMinutes * 60 * 1000;
      const elapsedMs = Date.now() - lastActivityRef.current;
      const remainingMs = totalTimeoutMs - elapsedMs;

      // Warning appears 2 minutes (120s) before logout, or in final 20% for shorter sessions
      // e.g. for 5m session -> warns at 60s. For 10m+ session -> warns at 120s (2m).
      const warningWindowMs = Math.min(120000, Math.max(30000, Math.floor(totalTimeoutMs * 0.2)));

      if (remainingMs <= 0) {
        setWarningSeconds(null);
        handleLogout(true);
      } else if (remainingMs <= warningWindowMs) {
        setWarningSeconds(Math.ceil(remainingMs / 1000));
      } else {
        setWarningSeconds(null);
      }
    }, 1000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, updateActivity));
      window.removeEventListener('session_timeout_updated', onTimeoutSettingChange);
      clearInterval(interval);
    };
  }, [session]);

  const extendSession = () => {
    lastActivityRef.current = Date.now();
    setWarningSeconds(null);
  };

  async function handleLogout(timedOut = false) {
    localStorage.removeItem('local_demo_auth');
    localStorage.removeItem('admin_device_session_id');
    localStorage.removeItem('admin_login_timestamp');
    if (supabaseConfigured) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    setSession(null);
    if (timedOut) {
      navigate('/login?reason=timeout', { replace: true });
    }
  }

  if (session === 'loading') return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
  if (!session) return <Navigate to="/login" replace />;

  async function logout() {
    await handleLogout(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex relative">
      {/* ── Session Inactivity Countdown Warning Modal ── */}
      <AnimatePresence>
        {warningSeconds !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              className="w-full max-w-md rounded-2xl bg-[#111622] border border-amber-500/30 p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden"
            >
              {/* Top ambient glow */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>

              <h2 className="text-lg font-display font-bold text-white mb-1.5 flex items-center justify-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Session Expiring Soon
              </h2>

              <p className="text-xs text-white/55 mb-5 leading-relaxed">
                You have been inactive for a while. For your security, your admin session will expire in:
              </p>

              {/* Large Monospace Countdown (MM:SS) */}
              <div className="mb-6 py-3 px-5 rounded-xl bg-black/50 border border-amber-500/20 inline-flex items-center justify-center gap-3 shadow-inner">
                <span className="font-mono text-3xl sm:text-4xl font-bold text-amber-400 tracking-widest">
                  {String(Math.floor(warningSeconds / 60)).padStart(2, '0')}:
                  {String(warningSeconds % 60).padStart(2, '0')}
                </span>
                <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">min</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={extendSession}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
                >
                  Stay Logged In
                </button>
                <button
                  type="button"
                  onClick={() => handleLogout(false)}
                  className="py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 font-medium text-xs transition-colors"
                >
                  Sign Out Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-white/[0.06] bg-[#0d0d0d] flex-shrink-0">
        <div className="px-5 py-5 border-b border-white/[0.06] flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-display font-semibold text-white text-sm">Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5" aria-label="Admin navigation">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} to={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-cyan-400/10 text-cyan-400' : 'text-white/45 hover:text-white hover:bg-white/[0.04]'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/[0.06]">
          <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/35 hover:text-red-400 w-full transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Sidebar — mobile overlay */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSideOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
            <motion.aside initial={{ x: -224 }} animate={{ x: 0 }} exit={{ x: -224 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="lg:hidden fixed top-0 bottom-0 left-0 z-50 w-56 bg-[#0d0d0d] border-r border-white/[0.06] flex flex-col">
              <div className="px-5 py-5 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="font-display font-semibold text-white text-sm">Admin</span>
                </div>
                <button onClick={() => setSideOpen(false)} className="text-white/45 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-0.5" aria-label="Mobile admin navigation">
                {NAV.map(({ href, icon: Icon, label }) => {
                  const active = pathname === href;
                  return (
                    <Link key={href} to={href} onClick={() => setSideOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-cyan-400/10 text-cyan-400' : 'text-white/45 hover:text-white hover:bg-white/[0.04]'}`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-white/[0.06]">
                <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/35 hover:text-red-400 w-full">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-white/[0.06]">
          <button onClick={() => setSideOpen(true)} className="text-white/45 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-semibold text-white text-sm">Admin</span>
        </div>
        <main className="flex-1 p-6 sm:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
