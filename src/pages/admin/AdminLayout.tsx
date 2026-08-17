import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, User, FolderKanban, Wrench, Briefcase,
  Award, MessageSquare, FileText, Settings, LogOut, Menu, X, Terminal,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
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
  const [session, setSession] = useState<Session | null | 'loading'>('loading');
  const [sideOpen, setSideOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === 'loading') return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
  if (!session) return <Navigate to="/login" replace />;

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
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
          <button onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/35 hover:text-red-400 hover:bg-red-400/[0.06] transition-colors w-full">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSideOpen(false)} />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="fixed left-0 top-0 bottom-0 w-56 bg-[#0d0d0d] border-r border-white/[0.06] z-50 flex flex-col">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="font-display font-semibold text-white text-sm">Admin</span>
                </div>
                <button onClick={() => setSideOpen(false)} className="text-white/35 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <nav className="flex-1 p-3 space-y-0.5">
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
