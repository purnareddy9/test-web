import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { SectionHeader, FadeUp } from '../common/Motion';

const FLOW_STEPS = [
  { id: 'dev',      label: 'Developer',    icon: '👤' },
  { id: 'git',      label: 'Git Push',     icon: '⬆' },
  { id: 'ci',       label: 'CI Triggered', icon: '⚡' },
  { id: 'build',    label: 'Build',        icon: '🏗' },
  { id: 'test',     label: 'Test',         icon: '✅' },
  { id: 'docker',   label: 'Docker Image', icon: '🐳' },
  { id: 'registry', label: 'Registry',     icon: '📦' },
  { id: 'cd',       label: 'CD / ArgoCD',  icon: '♻' },
  { id: 'k8s',      label: 'Kubernetes',   icon: '☸' },
  { id: 'prod',     label: 'Production',   icon: '🟢' },
  { id: 'monitor',  label: 'Monitoring',   icon: '📊' },
];

const PACKET_DURATION = 700; // ms per step

export default function WorkflowAnimation() {
  const [activeStep, setActiveStep] = useState(-1);
  const [running, setRunning]       = useState(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sectionRef  = useRef<HTMLElement>(null);
  const hasPlayed   = useRef(false);

  // inView fires once when section scrolls 20% into viewport
  const inView = useInView(sectionRef, { once: true, margin: '-20% 0px' });

  const start = useCallback(() => {
    clearTimeout(timerRef.current);
    setActiveStep(-1);
    setRunning(true);
  }, []);

  // Auto-play on first scroll into view
  useEffect(() => {
    if (inView && !hasPlayed.current) {
      hasPlayed.current = true;
      start();
    }
  }, [inView, start]);

  useEffect(() => {
    if (!running) return;
    if (activeStep >= FLOW_STEPS.length - 1) { setRunning(false); return; }
    timerRef.current = setTimeout(() => setActiveStep(s => s + 1), PACKET_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [activeStep, running]);

  const pct = activeStep < 0 ? 0 : Math.round(((activeStep + 1) / FLOW_STEPS.length) * 100);

  return (
    <section ref={sectionRef} id="workflow" className="py-24 lg:py-32 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Workflow" title="Code to Production"
          subtitle="The end-to-end journey of a deployment from a developer's commit to running in production." />

        <FadeUp>
          {/* Fixed height card — no layout shift during animation */}
          <div className="card p-6 sm:p-8" style={{ minHeight: 320 }}>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-mono text-white/30 uppercase tracking-widest">
                {running ? 'Deploying…' : activeStep >= 0 ? 'Complete ✓' : 'Ready'}
              </span>
              <button onClick={start} disabled={running}
                className="flex items-center gap-2 text-xs text-white/35 hover:text-cyan-400 transition-colors disabled:opacity-30"
                aria-label="Replay workflow">
                <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
                {running ? 'Running…' : '↺ Replay'}
              </button>
            </div>

            {/* Desktop: O — O — O layout via CSS grid
                21 columns: circle(44px) gap(1fr) circle(44px) gap(1fr) … circle(44px)
                Row 1 = circles + connector segments | Row 2 = labels */}
            <div className="hidden sm:block">
              <div
                className="grid items-center"
                style={{
                  gridTemplateColumns: Array.from({ length: FLOW_STEPS.length }, (_, i) =>
                    i < FLOW_STEPS.length - 1 ? '44px 1fr' : '44px'
                  ).join(' '),
                  rowGap: 6,
                }}
              >
                {FLOW_STEPS.flatMap((step, i) => {
                  const done    = i <= activeStep;
                  const current = i === activeStep;
                  const segDone = i > 0 && i <= activeStep;
                  const col     = i * 2 + 1; // circles at odd cols: 1,3,5…21

                  const els = [];

                  // Connector segment (even column, before this circle — skip for first node)
                  if (i > 0) {
                    els.push(
                      <div
                        key={`seg-${step.id}`}
                        className="h-px self-center transition-colors duration-500"
                        style={{
                          gridColumn: col - 1,
                          gridRow: 1,
                          margin: '0 4px',
                          backgroundColor: segDone
                            ? 'rgba(34,211,238,0.5)'
                            : 'rgba(255,255,255,0.06)',
                        }}
                      />
                    );
                  }

                  // Circle (odd column, row 1)
                  els.push(
                    <div
                      key={`circle-${step.id}`}
                      className="flex items-center justify-center"
                      style={{ gridColumn: col, gridRow: 1 }}
                    >
                      <div
                        className="w-11 h-11 rounded-full border flex items-center justify-center text-lg"
                        style={{
                          borderColor:     current ? 'rgb(34,211,238)' : done ? 'rgba(34,211,238,0.35)' : 'rgba(255,255,255,0.08)',
                          backgroundColor: current ? 'rgba(34,211,238,0.10)' : done ? 'rgba(34,211,238,0.06)' : 'rgb(10,10,10)',
                          transform:       current ? 'scale(1.1)' : 'scale(1)',
                          transition:      'border-color 0.3s, background-color 0.3s, transform 0.2s',
                        }}
                      >
                        {step.icon}
                      </div>
                    </div>
                  );

                  // Label (odd column, row 2 — directly below its circle)
                  els.push(
                    <div
                      key={`label-${step.id}`}
                      className="flex items-start justify-center"
                      style={{ gridColumn: col, gridRow: 2 }}
                    >
                      <p
                        className="text-[9px] font-mono text-center leading-tight transition-colors duration-300"
                        style={{ color: done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.18)' }}
                      >
                        {step.label}
                      </p>
                    </div>
                  );

                  return els;
                })}
              </div>
            </div>

            {/* Mobile: vertical */}
            <div className="sm:hidden">
              {FLOW_STEPS.map((step, i) => {
                const done    = i <= activeStep;
                const current = i === activeStep;
                return (
                  <div key={step.id} className="flex items-center gap-4" style={{ height: 48 }}>
                    <div className="flex flex-col items-center w-10 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm
                        transition-colors duration-300
                        ${current ? 'border-cyan-400 bg-cyan-400/15' : done ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-white/10 bg-[#0a0a0a]'}`}>
                        {step.icon}
                      </div>
                    </div>
                    <p className={`text-sm font-mono transition-colors duration-300 ${done ? 'text-white/70' : 'text-white/20'}`}>
                      {step.label}
                    </p>
                    {current && <span className="ml-auto text-cyan-400 text-xs font-mono animate-pulse">←</span>}
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-cyan-500 transition-all duration-700"
                  style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-mono text-white/30 w-8 text-right">{pct}%</span>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
