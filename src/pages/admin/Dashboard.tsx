import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, Wrench, Briefcase, Award, MessageSquare, FileText,
  Bell, ArrowRight, X, Mail, Eye,
} from 'lucide-react';
import {
  getProjects, getSkills, getExperience, getCertifications,
  getMessages, getActiveResume, getProfileViewsCount,
} from '../../lib/api';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import type { Message } from '../../types';

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    projects: 0,
    skills: 0,
    experience: 0,
    certs: 0,
    messages: 0,
    unreadMessages: 0,
    resume: 0,
    views: 0,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const prevUnreadRef = useRef<number | null>(null);

  const loadData = useCallback(async (isInitial = false) => {
    try {
      const [p, s, e, c, m, r, v] = await Promise.all([
        getProjects(),
        getSkills(),
        getExperience(),
        getCertifications(),
        getMessages(),
        getActiveResume(),
        getProfileViewsCount(),
      ]);

      const unread = m.filter((msg: Message) => msg.status === 'new').length;

      // If new message arrives while admin is on the page (and not initial load), show toast
      if (!isInitial && prevUnreadRef.current !== null && unread > prevUnreadRef.current) {
        const latestMsg = m[0];
        setToastMessage(`New message received${latestMsg?.name ? ` from ${latestMsg.name}` : ''}`);
        setTimeout(() => setToastMessage(null), 4500);
      }

      prevUnreadRef.current = unread;

      setCounts({
        projects: p.length,
        skills: s.length,
        experience: e.length,
        certs: c.length,
        messages: m.length,
        unreadMessages: unread,
        resume: r ? 1 : 0,
        views: v,
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  }, []);

  useEffect(() => {
    loadData(true);

    // 1. Listen to custom event for immediate tab/local updates
    const onMessagesUpdate = () => loadData(false);
    window.addEventListener('messages_updated', onMessagesUpdate);
    window.addEventListener('storage', onMessagesUpdate);

    // 2. Real-time Supabase subscription if configured
    let channel: any = null;
    if (supabaseConfigured) {
      channel = supabase
        .channel('dashboard_messages_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          () => loadData(false)
        )
        .subscribe();
    }

    // 3. Lightweight 12-second polling fallback
    const interval = setInterval(() => loadData(false), 12000);

    return () => {
      window.removeEventListener('messages_updated', onMessagesUpdate);
      window.removeEventListener('storage', onMessagesUpdate);
      clearInterval(interval);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadData]);

  const tiles = [
    {
      id: 'projects',
      icon: FolderKanban,
      label: 'Projects',
      count: counts.projects,
      href: '/admin/projects',
      isAttention: false,
    },
    {
      id: 'skills',
      icon: Wrench,
      label: 'Skills',
      count: counts.skills,
      href: '/admin/skills',
      isAttention: false,
    },
    {
      id: 'experience',
      icon: Briefcase,
      label: 'Experience',
      count: counts.experience,
      href: '/admin/experience',
      isAttention: false,
    },
    {
      id: 'certifications',
      icon: Award,
      label: 'Certifications',
      count: counts.certs,
      href: '/admin/certifications',
      isAttention: false,
    },
    {
      id: 'messages',
      icon: MessageSquare,
      label: counts.unreadMessages > 0
        ? (counts.unreadMessages === 1 ? 'Unread Message' : 'Unread Messages')
        : 'Messages',
      count: counts.unreadMessages > 0 ? counts.unreadMessages : counts.messages,
      href: '/admin/messages',
      isAttention: counts.unreadMessages > 0,
    },
    {
      id: 'resume',
      icon: FileText,
      label: 'Resume',
      count: counts.resume,
      href: '/admin/resume',
      isAttention: false,
    },
    {
      id: 'views',
      icon: Eye,
      label: 'Profile Views',
      count: counts.views,
      href: '/admin/profile',
      isAttention: false,
    },
  ];

  return (
    <div className="relative">
      <h1 className="text-2xl font-display font-bold text-white mb-2">Dashboard</h1>
      <p className="text-white/35 text-sm mb-6">Manage your portfolio content.</p>

      {/* ── Dashboard Notification Banner (Visible when unreadMessages > 0) ── */}
      <AnimatePresence>
        {counts.unreadMessages > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-3.5 sm:p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.07] backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm shadow-lg shadow-cyan-500/5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 flex-shrink-0 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                    <span>
                      {counts.unreadMessages} new message{counts.unreadMessages > 1 ? 's' : ''}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                      Unread
                    </span>
                  </p>
                  <p className="text-white/50 text-[11px] sm:text-xs truncate">
                    You have unread messages from your portfolio visitors.
                  </p>
                </div>
              </div>
              <Link
                to="/admin/messages"
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition-all shadow-sm active:scale-[0.98] flex-shrink-0"
              >
                <span>View Messages</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2-Column Mobile / 3-Column Desktop Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {tiles.map(({ id, icon: Icon, label, count, href, isAttention }) => (
          <Link
            key={id}
            to={href}
            className={`p-5 flex flex-col gap-3 rounded-[10px] transition-all duration-200 relative group cursor-pointer ${
              isAttention
                ? 'bg-[#161a22] border border-cyan-500/40 shadow-lg shadow-cyan-500/10 hover:border-cyan-400 hover:bg-[#18202c]'
                : 'card-hover'
            }`}
          >
            <div className="flex items-center justify-between">
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isAttention ? 'text-cyan-400' : 'text-cyan-400/70 group-hover:text-cyan-400'
                }`}
              />

              {/* Attention Indicator Badge on Messages Card */}
              {isAttention && (
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                    NEW
                  </span>
                </div>
              )}
            </div>

            <div>
              <p
                className={`text-xl font-display font-bold ${
                  isAttention ? 'text-cyan-300' : 'text-white'
                }`}
              >
                {count}
              </p>
              <p
                className={`text-xs ${
                  isAttention ? 'text-cyan-200/70 font-medium' : 'text-white/40'
                }`}
              >
                {label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Quick Links ── */}
      <div className="mt-8 card p-5">
        <p className="text-white/30 text-xs font-mono mb-3">QUICK LINKS</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/" target="_blank" className="btn-outline text-xs py-1.5 px-3">
            View Portfolio ↗
          </Link>
          <Link to="/admin/profile" className="btn-outline text-xs py-1.5 px-3">
            Edit Profile
          </Link>
          <Link to="/admin/messages" className="btn-outline text-xs py-1.5 px-3">
            View Messages
          </Link>
        </div>
      </div>

      {/* ── Realtime Toast Notification ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#121620] border border-cyan-500/40 shadow-2xl flex items-center gap-3 text-sm text-white max-w-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs text-cyan-300">New Notification</p>
              <p className="text-xs text-white/70 truncate">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
