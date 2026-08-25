import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSectionSettings, type DashboardSectionConfig } from '../../lib/settings';
import { getProfile } from '../../lib/api';

const ALL_NAV_LINKS = [
  { id: 'about', href: '/#about', label: 'About' },
  { id: 'skills', href: '/#skills', label: 'Skills' },
  { id: 'workflow', href: '/#workflow', label: 'DevOps Workflow' },
  { id: 'experience', href: '/#experience', label: 'Experience' },
  { id: 'projects', href: '/#projects', label: 'Projects' },
  { id: 'certifications', href: '/#certifications', label: 'Certifications' },
  { id: 'contact', href: '/#contact', label: 'Contact' },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Navbar({ resumeUrl, name }: { resumeUrl?: string; name?: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [sections, setSections] = useState<DashboardSectionConfig[]>(getSectionSettings);
  const [profileName, setProfileName] = useState<string>(() => name || localStorage.getItem('portfolio_owner_name') || 'alex');
  const { pathname } = useLocation();

  useEffect(() => {
    if (name) {
      setProfileName(name);
      localStorage.setItem('portfolio_owner_name', name);
    } else {
      getProfile().then(p => {
        if (p?.name) {
          setProfileName(p.name);
          localStorage.setItem('portfolio_owner_name', p.name);
        }
      }).catch(() => {});
    }
  }, [name]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    fn(); // Check immediate scroll position on mount

    const onSettingsUpdate = () => setSections(getSectionSettings());
    window.addEventListener('sections_config_updated', onSettingsUpdate);
    window.addEventListener('storage', onSettingsUpdate);

    return () => {
      window.removeEventListener('scroll', fn);
      window.removeEventListener('sections_config_updated', onSettingsUpdate);
      window.removeEventListener('storage', onSettingsUpdate);
    };
  }, []);

  const enabledSectionIds = new Set(sections.filter(s => s.enabled).map(s => s.id));
  const navLinks = ALL_NAV_LINKS.filter(link => enabledSectionIds.has(link.id as any));

  const navigate = useNavigate();

  const handleNav = useCallback((href: string) => {
    setOpen(false);
    const id = href.replace('/#', '');
    if (pathname === '/') {
      try {
        window.history.pushState(null, '', `/#${id}`);
      } catch {}
      scrollTo(id);
    }
  }, [pathname]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    if (pathname === '/') {
      try {
        window.history.pushState(null, '', '/');
      } catch {}
      const heroEl = document.getElementById('hero');
      if (heroEl) {
        heroEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    } else {
      navigate('/');
    }
  };

  const displayName = (profileName || 'alex').trim().split(' ')[0].toLowerCase();

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/[0.08] shadow-lg shadow-black/30'
        : 'bg-[#0a0a0a]/75 backdrop-blur-sm border-b border-white/[0.04]'
    }`}>
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between" aria-label="Main navigation">
        {/* Logo */}
        <Link to="/" onClick={handleLogoClick} className="font-display font-bold text-white text-lg tracking-tight hover:text-cyan-400 transition-colors">
          {displayName}<span className="text-cyan-400">.</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-1" role="list">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <button onClick={() => handleNav(href)}
                className="px-3 py-2 text-sm text-white/55 hover:text-white transition-colors rounded-md hover:bg-white/[0.04] font-medium">
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* Resume + mobile toggle */}
        <div className="flex items-center gap-3">
          {resumeUrl ? (
            <a href={resumeUrl} download target="_blank" rel="noopener noreferrer"
              className="hidden sm:inline-flex btn-outline text-xs py-2 px-4 gap-1.5">
              <Download className="w-3.5 h-3.5" /> Resume
            </a>
          ) : (
            <span className="hidden sm:inline-flex btn-outline text-xs py-2 px-4 gap-1.5 opacity-40 cursor-default select-none">
              <Download className="w-3.5 h-3.5" /> Resume
            </span>
          )}
          <button onClick={() => setOpen(o => !o)} className="lg:hidden p-2 text-white/60 hover:text-white transition-colors" aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden bg-[#0a0a0a]/98 backdrop-blur-sm border-b border-white/[0.06] px-6 pb-5">
            <ul className="flex flex-col gap-1 pt-3" role="list">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <button onClick={() => handleNav(href)}
                    className="w-full text-left px-3 py-2.5 text-sm text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/[0.04]">
                    {label}
                  </button>
                </li>
              ))}
              {resumeUrl && (
                <li className="mt-2">
                  <a href={resumeUrl} download target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-cyan-400">
                    <Download className="w-4 h-4" /> Download Resume
                  </a>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
