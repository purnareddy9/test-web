import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GitFork, Link2, Mail, ExternalLink, Download, RefreshCw } from 'lucide-react';
import { FadeUp } from '../common/Motion';
import type { Profile, Resume } from '../../types';

const DEFAULT_ROLES = ['DevOps Engineer', 'Cloud Engineer', 'Platform Engineer', 'Site Reliability Engineer'];

function useTyping(strings: string[], speed = 70, pause = 2000) {
  const [text, setText] = useState('');
  const [si, setSi] = useState(0);
  const [ci, setCi] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const cur = strings[si];
    let timer: ReturnType<typeof setTimeout>;
    if (!deleting && ci < cur.length) {
      timer = setTimeout(() => setCi(c => c + 1), speed);
    } else if (!deleting && ci === cur.length) {
      timer = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && ci > 0) {
      timer = setTimeout(() => setCi(c => c - 1), speed / 2);
    } else {
      setDeleting(false);
      setSi(i => (i + 1) % strings.length);
    }
    setText(cur.slice(0, ci));
    return () => clearTimeout(timer);
  }, [ci, deleting, si, strings, speed, pause]);

  return text;
}

// ── Terminal animation ────────────────────────────────────
const TERMINAL_LINES = [
  { type: 'cmd',    text: 'git push origin main' },
  { type: 'output', text: '✓ Changes pushed successfully' },
  { type: 'gap' },
  { type: 'cmd',    text: 'terraform plan' },
  { type: 'output', text: 'Plan: 8 to add, 2 to change, 0 to destroy' },
  { type: 'gap' },
  { type: 'cmd',    text: 'terraform apply -auto-approve' },
  { type: 'output', text: 'aws_vpc.main ............... ✓' },
  { type: 'output', text: 'aws_eks_cluster.main ....... ✓' },
  { type: 'output', text: 'Apply complete! 8 added.' },
  { type: 'gap' },
  { type: 'cmd',    text: 'kubectl get pods -n production' },
  { type: 'output', text: 'NAME             READY   STATUS' },
  { type: 'output', text: 'api-server-x9k   3/3     Running' },
  { type: 'output', text: 'frontend-m2p     2/2     Running' },
  { type: 'output', text: 'worker-q7r       2/2     Running' },
  { type: 'gap' },
  { type: 'prompt' },
];

function Terminal() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [running, setRunning] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);

  const run = useCallback(() => {
    setVisibleCount(0);
    setRunning(true);
  }, []);

  useEffect(() => {
    if (!running) return;
    if (visibleCount >= TERMINAL_LINES.length) { setRunning(false); return; }
    const line = TERMINAL_LINES[visibleCount];
    const delay = line.type === 'cmd' ? 600 : line.type === 'gap' ? 120 : 220;
    const t = setTimeout(() => setVisibleCount(c => c + 1), delay);
    return () => clearTimeout(t);
  }, [visibleCount, running]);

  // Scroll only the terminal body — never the page
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleCount]);

  return (
    <div className="terminal w-full max-w-lg">
      {/* Header bar */}
      <div className="terminal-header">
        <span className="terminal-dot bg-red-500/70" />
        <span className="terminal-dot bg-yellow-500/70" />
        <span className="terminal-dot bg-green-500/70" />
        <span className="ml-3 text-white/25 text-xs flex-1 text-center">~/infrastructure</span>
        {!running && (
          <button onClick={run} className="ml-auto text-white/30 hover:text-cyan-400 transition-colors" aria-label="Replay terminal">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Fixed height body — scrolls internally, never moves the page */}
      <div ref={bodyRef} className="p-4 text-xs leading-relaxed overflow-y-auto space-y-0.5" style={{ height: 320 }}>
        {TERMINAL_LINES.slice(0, visibleCount).map((line, i) => (
          <div key={i}>
            {line.type === 'cmd' && (
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 select-none">$</span>
                <span className="text-white/80">{line.text}</span>
              </div>
            )}
            {line.type === 'output' && (
              <div className={`pl-4 ${line.text?.startsWith('✓') ? 'text-green-400' : 'text-white/40'}`}>
                {line.text}
              </div>
            )}
            {line.type === 'prompt' && (
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">$</span>
                <span className="inline-block w-2 h-3.5 bg-cyan-400/80 animate-cursor-blink" />
              </div>
            )}
            {line.type === 'gap' && <div className="h-1.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Hero({ profile, resume }: { profile: Profile; resume: Resume | null }) {
  const roles = useMemo(() => {
    if (!profile?.headline) return DEFAULT_ROLES;
    const parsed = profile.headline.split(',').map(r => r.trim()).filter(Boolean);
    return parsed.length > 0 ? parsed : DEFAULT_ROLES;
  }, [profile?.headline]);

  const typed = useTyping(roles);
  const goProjects = () => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  const goAbout    = () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="relative min-h-screen flex items-center pt-16" aria-label="Introduction">
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }}
        aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <div>
            <FadeUp immediate delay={0.05}>
              <p className="text-white/35 text-sm font-mono mb-5">
                <span className="text-cyan-400">~/</span> hello, world
              </p>
            </FadeUp>

            <FadeUp immediate delay={0.12}>
              <p className="text-white/50 text-base mb-1">Hi, I'm</p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white mb-4 leading-[1.08]">
                {profile.name.split(' ')[0]}<span className="text-cyan-400">.</span>
              </h1>
            </FadeUp>

            <FadeUp immediate delay={0.2}>
              <div className="h-8 flex items-center gap-2 mb-6" aria-live="polite" aria-label={`Current role: ${typed}`}>
                <span className="text-white/30 font-mono text-sm select-none">{'>'}</span>
                <span className="text-lg font-mono text-white/75">
                  {typed}<span className="animate-cursor-blink text-cyan-400 ml-0.5">█</span>
                </span>
              </div>
            </FadeUp>

            {profile.bio && (
              <FadeUp immediate delay={0.28}>
                <p className="text-white/45 text-base leading-relaxed mb-8 max-w-md">
                  {profile.bio.split('\n').map(s => s.trim()).filter(Boolean)[0]}
                </p>
              </FadeUp>
            )}

            <FadeUp immediate delay={0.35}>
              <div className="flex flex-wrap gap-3 mb-9">
                <button onClick={goProjects} className="btn-primary">
                  <ExternalLink className="w-4 h-4" /> View Projects
                </button>
                {resume ? (
                  <a href={resume.file_url} download target="_blank" rel="noopener noreferrer" className="btn-outline">
                    <Download className="w-4 h-4" /> Download Resume
                  </a>
                ) : (
                  <button onClick={goAbout} className="btn-outline">
                    About Me
                  </button>
                )}
              </div>
            </FadeUp>

            <FadeUp immediate delay={0.42}>
              <div className="flex items-center gap-1">
                {[
                  { icon: GitFork, label: 'GitHub',   href: profile.github_url },
                  { icon: Link2,   label: 'LinkedIn', href: profile.linkedin_url },
                  { icon: Mail,    label: 'Email',    href: profile.email ? `mailto:${profile.email}` : undefined },
                ].filter(s => !!s.href).map(({ icon: Icon, label, href }) => (
                  <a key={label} href={href!}
                    target={href!.startsWith('http') ? '_blank' : undefined}
                    rel={href!.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="p-2.5 text-white/35 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
                    aria-label={label}>
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </FadeUp>
          </div>

          {/* Right — terminal */}
          <FadeUp immediate delay={0.3} className="flex justify-center lg:justify-end">
            <Terminal />
          </FadeUp>
        </div>

        {/* Scroll cue — CSS animation to avoid layout recalculation */}
        <div className="flex justify-center mt-20">
          <button onClick={goAbout}
            className="text-white/20 hover:text-white/50 transition-colors animate-bounce"
            style={{ animationDuration: '2s' }}
            aria-label="Scroll down">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
