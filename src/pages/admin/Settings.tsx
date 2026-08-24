import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  Clock,
  Layers,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Server,
  Activity,
  ExternalLink,
  Lock,
  Search,
  Check,
  X,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { supabase, supabaseConfigured, isLocalDemo } from '../../lib/supabase';
import {
  getSectionSettings,
  fetchRemoteSettings,
  saveSectionSettings,
  resetSectionSettings,
  getSessionTimeoutMinutes,
  saveSessionTimeoutMinutes,
  revokeOtherSessions,
  revokeAllSessions,
  TIMEOUT_OPTIONS,
  type DashboardSectionConfig,
  type SectionId,
} from '../../lib/settings';

type Tab = 'account' | 'sections' | 'system';

interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  color: string;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function calculatePasswordStrength(pass: string): PasswordStrength {
  const hasMinLength = pass.length >= 8;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  if (pass.length === 0) {
    return { score: 0, label: 'Empty', color: 'bg-white/10', hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial };
  }
  if (score <= 1) {
    return { score: 1, label: 'Weak', color: 'bg-red-500', hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial };
  }
  if (score === 2) {
    return { score: 2, label: 'Fair', color: 'bg-amber-500', hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial };
  }
  if (score === 3) {
    return { score: 3, label: 'Good', color: 'bg-blue-400', hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial };
  }
  return { score: 4, label: 'Strong', color: 'bg-emerald-400', hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial };
}

const CATEGORY_COLORS: Record<string, string> = {
  Core: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Interactive Visualization': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Showcase: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Engagement: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

export default function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('account');

  // ── Account & Security State ──────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Session Timeout
  const [sessionTimeout, setSessionTimeout] = useState<number>(() => getSessionTimeoutMinutes());
  const [timeoutSaved, setTimeoutSaved] = useState(false);

  // Modals
  const [showLogoutOthersModal, setShowLogoutOthersModal] = useState(false);
  const [loggingOutOthers, setLoggingOutOthers] = useState(false);
  const [logoutOthersMsg, setLogoutOthersMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const [showResetSectionsModal, setShowResetSectionsModal] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

  // ── Dashboard Sections State ──────────────────────────────
  const [sections, setSections] = useState<DashboardSectionConfig[]>(() => getSectionSettings());
  const [sectionSearch, setSectionSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [saveBanner, setSaveBanner] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchRemoteSettings().then(remoteSections => {
      if (mounted && remoteSections) {
        setSections(remoteSections);
        setSessionTimeout(getSessionTimeoutMinutes());
      }
    });

    const onUpdate = () => {
      setSections(getSectionSettings());
      setSessionTimeout(getSessionTimeoutMinutes());
    };
    window.addEventListener('sections_config_updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('sections_config_updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  const strength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);

  // ── Password Handlers ─────────────────────────────────────
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'err', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: 'New password and confirmation do not match.' });
      return;
    }
    if (strength.score < 2) {
      setPasswordMsg({ type: 'err', text: 'Please choose a stronger password.' });
      return;
    }

    setUpdatingPassword(true);
    try {
      if (isLocalDemo) {
        await new Promise(r => setTimeout(r, 600));
        setPasswordMsg({ type: 'ok', text: 'Demo mode: Password updated locally for this session.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        return;
      }

      if (!supabaseConfigured) {
        throw new Error('Supabase is not configured.');
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordMsg({ type: 'ok', text: 'Admin password successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPasswordMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to update password.',
      });
    } finally {
      setUpdatingPassword(false);
    }
  }

  // ── Session Handlers ──────────────────────────────────────
  function handleTimeoutChange(minutes: number) {
    setSessionTimeout(minutes);
    saveSessionTimeoutMinutes(minutes);
    setTimeoutSaved(true);
    setTimeout(() => setTimeoutSaved(false), 2500);
  }

  async function handleLogoutOtherSessions() {
    setLoggingOutOthers(true);
    setLogoutOthersMsg(null);
    try {
      await revokeOtherSessions();
      setLogoutOthersMsg({ type: 'ok', text: 'All other device sessions have been revoked.' });
      setShowLogoutOthersModal(false);
    } catch (err: unknown) {
      setLogoutOthersMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to log out of other sessions.',
      });
      setShowLogoutOthersModal(false);
    } finally {
      setLoggingOutOthers(false);
    }
  }

  async function handleLogoutAllSessions() {
    setLoggingOutAll(true);
    try {
      await revokeAllSessions();
      navigate('/login?reason=global_logout', { replace: true });
    } catch (err: unknown) {
      console.error(err);
      navigate('/login?reason=global_logout', { replace: true });
    } finally {
      setLoggingOutAll(false);
    }
  }

  // ── Section Visibility & Ordering Handlers ────────────────
  function toggleSection(id: SectionId) {
    const updated = sections.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setSections(updated);
    saveSectionSettings(updated);
    triggerSaveToast();
  }

  function moveSection(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const copy = [...sections];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    const reordered = copy.map((s, idx) => ({ ...s, order: idx }));
    setSections(reordered);
    saveSectionSettings(reordered);
    triggerSaveToast();
  }

  function setAllSections(enabled: boolean) {
    const updated = sections.map(s => ({ ...s, enabled }));
    setSections(updated);
    saveSectionSettings(updated);
    triggerSaveToast();
  }

  async function handleResetSections() {
    const reset = await resetSectionSettings();
    setSections(reset);
    setShowResetSectionsModal(false);
    triggerSaveToast();
  }

  function triggerSaveToast() {
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 2000);
  }

  function handleClearCache() {
    localStorage.clear();
    sessionStorage.clear();
    setShowClearCacheModal(false);
    window.location.reload();
  }

  const filteredSections = useMemo(() => {
    return sections.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(sectionSearch.toLowerCase()) ||
        s.description.toLowerCase().includes(sectionSearch.toLowerCase()) ||
        s.id.toLowerCase().includes(sectionSearch.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [sections, sectionSearch, categoryFilter]);

  const enabledCount = sections.filter(s => s.enabled).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* ── Control Center Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Settings & Security
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Manage account security, active sessions, and portfolio layout configurations.
          </p>
        </div>

        {/* Quick SaaS Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03]">
            <span className={`w-2 h-2 rounded-full ${supabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-white/60">Auth:</span>
            <span className="text-white font-medium">
              {supabaseConfigured ? 'Supabase Connected' : isLocalDemo ? 'Local Demo Mode' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] text-cyan-300">
            <Layers className="w-3.5 h-3.5" />
            <span>{enabledCount} / {sections.length} Sections Active</span>
          </div>
        </div>
      </div>

      {/* ── Top Navigation Tabs ── */}
      <div className="flex border-b border-white/[0.08] gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'account'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-400/[0.03]'
              : 'border-transparent text-white/45 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Account & Security</span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'sections'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-400/[0.03]'
              : 'border-transparent text-white/45 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Dashboard Sections</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/[0.08] text-white/70">
            {enabledCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'system'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-400/[0.03]'
              : 'border-transparent text-white/45 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>System & Environment</span>
        </button>
      </div>

      {/* ── TAB 1: Account & Security ── */}
      {activeTab === 'account' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          {logoutOthersMsg && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
                logoutOthersMsg.type === 'ok'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/25 text-red-300'
              }`}
            >
              {logoutOthersMsg.type === 'ok' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{logoutOthersMsg.text}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Change Password Card */}
            <div className="lg:col-span-7 card p-6 sm:p-7 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-white">Change Admin Password</h2>
                  <p className="text-xs text-white/40">Ensure your administrative account is protected.</p>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="form-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="form-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Dynamic Password Strength Indicator */}
                  {newPassword.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40">Strength:</span>
                        <span
                          className={`font-medium ${
                            strength.score <= 1
                              ? 'text-red-400'
                              : strength.score === 2
                              ? 'text-amber-400'
                              : strength.score === 3
                              ? 'text-blue-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {strength.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map(idx => (
                          <div
                            key={idx}
                            className={`rounded-full transition-all duration-300 ${
                              strength.score >= idx ? strength.color : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Criteria Checklist */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-2 text-[11px]">
                        <span className={`flex items-center gap-1.5 ${strength.hasMinLength ? 'text-emerald-400' : 'text-white/30'}`}>
                          {strength.hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          8+ characters
                        </span>
                        <span className={`flex items-center gap-1.5 ${strength.hasUpper && strength.hasLower ? 'text-emerald-400' : 'text-white/30'}`}>
                          {strength.hasUpper && strength.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Mixed case (A-z)
                        </span>
                        <span className={`flex items-center gap-1.5 ${strength.hasNumber ? 'text-emerald-400' : 'text-white/30'}`}>
                          {strength.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Numbers (0-9)
                        </span>
                        <span className={`flex items-center gap-1.5 ${strength.hasSpecial ? 'text-emerald-400' : 'text-white/30'}`}>
                          {strength.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Special symbol
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="form-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Passwords do not match
                    </p>
                  )}
                </div>

                {passwordMsg && (
                  <p
                    className={`flex items-center gap-1.5 text-xs p-3 rounded-lg border ${
                      passwordMsg.type === 'ok'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    {passwordMsg.type === 'ok' ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    {passwordMsg.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={updatingPassword || !newPassword || newPassword !== confirmPassword}
                  className="btn-primary w-full justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {updatingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Updating Password…
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Save New Password
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Session Security & Timeout Card */}
            <div className="lg:col-span-5 space-y-6">
              {/* Session Timeout */}
              <div className="card p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-semibold text-white">Session Inactivity Timeout</h2>
                    <p className="text-xs text-white/40">Auto-lock session after duration.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs text-white/50">
                    Select inactivity duration:
                  </label>
                  <select
                    value={sessionTimeout}
                    onChange={e => handleTimeoutChange(parseInt(e.target.value, 10))}
                    className="form-input cursor-pointer"
                  >
                    {TIMEOUT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-[#121212] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {timeoutSaved && (
                    <p className="text-emerald-400 text-xs flex items-center gap-1.5 animate-fadeIn">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Timeout preference saved.
                    </p>
                  )}
                </div>
              </div>

              {/* Multi-Session Termination */}
              <div className="card p-6 space-y-4 border-red-500/15 bg-gradient-to-b from-white/[0.02] to-red-500/[0.02]">
                <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-semibold text-white">Session Security</h2>
                    <p className="text-xs text-white/40">Revoke unauthorized access.</p>
                  </div>
                </div>

                <p className="text-xs text-white/50 leading-relaxed">
                  Revoke active refresh tokens on other devices, or sign out everywhere immediately.
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowLogoutOthersModal(true)}
                    className="btn-outline w-full justify-center text-xs py-2.5 text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout Other Devices (Keep This One)
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLogoutAllModal(true)}
                    className="btn-outline w-full justify-center text-xs py-2.5 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Sign Out Everywhere (All Devices)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TAB 2: Dashboard Sections Visibility ── */}
      {activeTab === 'sections' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Header & Quick Controls */}
          <div className="card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  Portfolio Section Orchestrator
                </h2>
                <p className="text-xs text-white/40 mt-1">
                  Enable or disable sections on your live homepage, or reorder their sequence.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setAllSections(true)}
                  className="btn-outline text-xs py-1.5 px-3"
                >
                  Enable All
                </button>
                <button
                  onClick={() => setAllSections(false)}
                  className="btn-outline text-xs py-1.5 px-3 text-white/50"
                >
                  Disable All
                </button>
                <button
                  onClick={() => setShowResetSectionsModal(true)}
                  className="btn-outline text-xs py-1.5 px-3 text-amber-400 border-amber-500/25 hover:bg-amber-500/10"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  View Live <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-3 border-t border-white/[0.06]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter sections by name, keyword, or ID…"
                  value={sectionSearch}
                  onChange={e => setSectionSearch(e.target.value)}
                  className="form-input pl-9 text-xs"
                />
                {sectionSearch && (
                  <button
                    onClick={() => setSectionSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {['All', 'Core', 'Interactive Visualization', 'Showcase', 'Engagement'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                        : 'bg-white/[0.03] text-white/45 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section Items List */}
          <div className="space-y-2.5">
            {filteredSections.map((section) => {
              const fullIndex = sections.findIndex(s => s.id === section.id);
              const isFirst = fullIndex === 0;
              const isLast = fullIndex === sections.length - 1;

              return (
                <div
                  key={section.id}
                  className={`card p-4 sm:p-5 flex items-start sm:items-center gap-4 transition-all ${
                    section.enabled
                      ? 'border-white/10 hover:border-cyan-500/30 bg-white/[0.02]'
                      : 'opacity-55 border-white/[0.04] bg-transparent'
                  }`}
                >
                  {/* Order Controls */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 text-white/30">
                    <GripVertical className="w-3.5 h-3.5 text-white/20 hidden sm:block cursor-grab" />
                    <span className="font-mono text-xs text-white/35 w-6 text-center">
                      #{fullIndex + 1}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveSection(fullIndex, 'up')}
                        disabled={isFirst}
                        className="p-1 rounded hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveSection(fullIndex, 'down')}
                        disabled={isLast}
                        className="p-1 rounded hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-medium text-white text-sm sm:text-base">
                        {section.name}
                      </h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[section.category] ?? 'text-white/40'}`}>
                        {section.category}
                      </span>
                      <span className="text-[10px] font-mono text-white/20">
                        id: #{section.id}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs leading-relaxed">
                      {section.description}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3 flex-shrink-0 self-center">
                    <span
                      className={`text-xs font-mono hidden sm:inline-block ${
                        section.enabled ? 'text-cyan-400' : 'text-white/25'
                      }`}
                    >
                      {section.enabled ? 'Visible' : 'Hidden'}
                    </span>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={section.enabled}
                      onClick={() => toggleSection(section.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                        section.enabled ? 'bg-cyan-500' : 'bg-white/15'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                          section.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredSections.length === 0 && (
              <div className="card p-12 text-center text-white/30 space-y-3">
                <Search className="w-8 h-8 mx-auto text-white/20" />
                <p className="text-sm">No sections match your search or filter.</p>
                <button
                  onClick={() => {
                    setSectionSearch('');
                    setCategoryFilter('All');
                  }}
                  className="btn-outline text-xs mx-auto"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── TAB 3: System & Diagnostics ── */}
      {activeTab === 'system' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Supabase Status Card */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-display font-semibold text-white">Database & Backend</h2>
                  <p className="text-xs text-white/40">Supabase Cloud Infrastructure.</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-white/40">Configuration Status</span>
                  <span className={supabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                    {supabaseConfigured ? 'Connected ✓' : 'Unconfigured (Fallback)'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-white/40">App Environment</span>
                  <span className="text-white">
                    {import.meta.env.DEV ? 'Local Development' : 'Production Build'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-white/40">Storage Bucket</span>
                  <span className="text-white">portfolio</span>
                </div>
              </div>
            </div>

            {/* Application Diagnostics Card */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-display font-semibold text-white">Cache & Diagnostics</h2>
                  <p className="text-xs text-white/40">Client state maintenance.</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-white/50 leading-relaxed">
                  Clear local settings, session cache, and reset section ordering to pristine defaults.
                </p>

                <button
                  type="button"
                  onClick={() => setShowClearCacheModal(true)}
                  className="btn-outline w-full justify-center text-xs py-2.5 text-amber-400 border-amber-500/25 hover:bg-amber-500/10"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Local Storage & Reset Cache
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── MODALS ── */}

      {/* 1. Logout Others Modal */}
      <AnimatePresence>
        {showLogoutOthersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="card max-w-md w-full p-6 space-y-5 border-red-500/30"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">Terminate All Other Sessions?</h3>
                  <p className="text-xs text-white/40">Destructive security action</p>
                </div>
              </div>

              <p className="text-xs text-white/60 leading-relaxed">
                This will immediately revoke all active refresh tokens and sign out all other devices, tablets,
                or browser tabs logged into your admin account. You will remain logged in on this current device.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutOthersModal(false)}
                  className="btn-outline flex-1 justify-center text-sm"
                  disabled={loggingOutOthers}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogoutOtherSessions}
                  disabled={loggingOutOthers}
                  className="btn-primary flex-1 justify-center text-sm !bg-amber-500 hover:!bg-amber-600 !text-black font-semibold"
                >
                  {loggingOutOthers ? 'Revoking…' : 'Yes, Revoke Other Sessions'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1.1 Logout Everywhere Modal */}
      <AnimatePresence>
        {showLogoutAllModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="card max-w-md w-full p-6 space-y-5 border-red-500/40 shadow-2xl shadow-red-500/10"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">Sign Out Everywhere?</h3>
                  <p className="text-xs text-white/40">Global logout from all devices</p>
                </div>
              </div>

              <p className="text-xs text-white/60 leading-relaxed">
                This will immediately revoke all access tokens across all browsers, phones, and devices—including this current browser. You will be redirected to the login page.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutAllModal(false)}
                  className="btn-outline flex-1 justify-center text-sm"
                  disabled={loggingOutAll}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogoutAllSessions}
                  disabled={loggingOutAll}
                  className="btn-primary flex-1 justify-center text-sm !bg-red-500 hover:!bg-red-600 !text-white"
                >
                  {loggingOutAll ? 'Signing out…' : 'Sign Out Everywhere'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Reset Sections Modal */}
      <AnimatePresence>
        {showResetSectionsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="card max-w-md w-full p-6 space-y-5"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">Reset Sections Layout?</h3>
                  <p className="text-xs text-white/40">Restore default ordering & visibility</p>
                </div>
              </div>

              <p className="text-xs text-white/60 leading-relaxed">
                This will reset all section visibility flags to enabled and restore the standard portfolio sequence.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetSectionsModal(false)}
                  className="btn-outline flex-1 justify-center text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetSections}
                  className="btn-primary flex-1 justify-center text-sm"
                >
                  Reset to Defaults
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Clear Cache Modal */}
      <AnimatePresence>
        {showClearCacheModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="card max-w-md w-full p-6 space-y-5"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">Clear Local Storage?</h3>
                  <p className="text-xs text-white/40">Reload application state</p>
                </div>
              </div>

              <p className="text-xs text-white/60 leading-relaxed">
                This will clear all browser-saved preferences, cached tokens, and reload the application.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearCacheModal(false)}
                  className="btn-outline flex-1 justify-center text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="btn-primary flex-1 justify-center text-sm !bg-amber-500 hover:!bg-amber-600 !text-black font-semibold"
                >
                  Clear & Reload
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Save Feedback Toast */}
      <AnimatePresence>
        {saveBanner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 text-black px-4 py-2.5 rounded-xl font-medium text-xs shadow-2xl shadow-emerald-500/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences saved & applied live!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
