import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { SectionHeader, FadeUp } from '../common/Motion';

const STAGES = [
  { id: 'plan',    label: 'PLAN',    icon: '📋', desc: 'Define requirements, tasks, and roadmap', tools: 'GitHub Issues, Jira' },
  { id: 'code',    label: 'CODE',    icon: '💻', desc: 'Write and review source code', tools: 'Git, VSCode, GitHub' },
  { id: 'build',   label: 'BUILD',   icon: '🏗️',  desc: 'Compile, package, containerise', tools: 'Docker, Maven, npm' },
  { id: 'test',    label: 'TEST',    icon: '🧪', desc: 'Unit, integration, security scans', tools: 'Jest, Trivy, SonarQube' },
  { id: 'release', label: 'RELEASE', icon: '🏷️',  desc: 'Version, tag, prepare release artifacts', tools: 'GitHub Actions, Semver' },
  { id: 'deploy',  label: 'DEPLOY',  icon: '🚀', desc: 'Push to production via GitOps', tools: 'ArgoCD, Helm, Kubernetes' },
  { id: 'operate', label: 'OPERATE', icon: '⚙️',  desc: 'Manage running infrastructure', tools: 'AWS, Kubernetes, Terraform' },
  { id: 'monitor', label: 'MONITOR', icon: '📊', desc: 'Observe metrics, logs, and traces', tools: 'Prometheus, Grafana, Loki' },
];

export default function DevOpsLifecycle() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Start auto-cycling only when the section is visible; pause when off-screen
  const inView = useInView(sectionRef, { margin: '-20% 0px' });

  useEffect(() => {
    if (paused || !inView) return;
    const t = setInterval(() => setActive(a => (a + 1) % STAGES.length), 1000);
    return () => clearInterval(t);
  }, [paused, inView]);

  const cur = STAGES[active];

  return (
    <section ref={sectionRef} id="lifecycle" className="py-24 lg:py-32 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Methodology" title="DevOps Lifecycle"
          subtitle="The continuous loop that drives reliable, fast software delivery." />

        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Circular diagram */}
          <FadeUp className="flex justify-center">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80"
              onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
              {STAGES.map((stage, i) => {
                const angle = (i / STAGES.length) * 360 - 90;
                const rad = (angle * Math.PI) / 180;
                const r = 38;
                const cx = 50 + r * Math.cos(rad);
                const cy = 50 + r * Math.sin(rad);
                const isActive = i === active;

                return (
                  <button key={stage.id}
                    style={{ position: 'absolute', left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%,-50%)' }}
                    onClick={() => { setActive(i); setPaused(true); }}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-full"
                    aria-label={stage.label} aria-pressed={isActive}>
                    <motion.div
                      animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-base border transition-all duration-300
                        ${isActive
                          ? 'bg-cyan-500/20 border-cyan-400/60 shadow-glow-cyan'
                          : 'bg-[#161616] border-white/10 hover:border-white/25'}`}>
                      {stage.icon}
                    </motion.div>
                    <p className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[9px] font-mono whitespace-nowrap transition-colors ${isActive ? 'text-cyan-400' : 'text-white/30'}`}>
                      {stage.label}
                    </p>
                  </button>
                );
              })}

              {/* Centre glow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-white/[0.06] flex items-center justify-center">
                  <motion.div key={active} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-2xl">{cur.icon}</motion.div>
                </div>
              </div>

              {/* Connecting ring */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              </svg>
            </div>
          </FadeUp>

          {/* Stage detail */}
          <FadeUp delay={0.1}>
            <motion.div key={active} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="card p-7">
              <p className="section-label mb-3">{`${active + 1} / ${STAGES.length}`}</p>
              <h3 className="text-2xl font-display font-bold text-white mb-3">{cur.label}</h3>
              <p className="text-white/50 text-[15px] leading-relaxed mb-5">{cur.desc}</p>
              <div>
                <p className="text-xs font-mono text-white/25 uppercase tracking-widest mb-2">Tools</p>
                <div className="flex flex-wrap gap-2">
                  {cur.tools.split(', ').map(t => <span key={t} className="tech-badge">{t}</span>)}
                </div>
              </div>
            </motion.div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-5">
              {STAGES.map((_, i) => (
                <button key={i} onClick={() => { setActive(i); setPaused(true); }}
                  className={`h-1 rounded-full transition-all duration-300 focus-visible:outline-none ${i === active ? 'w-5 bg-cyan-400' : 'w-1.5 bg-white/15 hover:bg-white/30'}`}
                  aria-label={`Stage ${i + 1}`} />
              ))}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
