import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'framer-motion';
import { CheckCircle, Circle, Loader, RefreshCw } from 'lucide-react';
import { SectionHeader, FadeUp } from '../common/Motion';

type StepStatus = 'pending' | 'running' | 'success';

const PIPELINE_STEPS = [
  { id: 'push',     label: 'Git Push',      desc: 'Developer pushes to main branch' },
  { id: 'build',    label: 'Build',         desc: 'Compile and package application' },
  { id: 'test',     label: 'Tests',         desc: 'Unit + integration + security scan' },
  { id: 'docker',   label: 'Docker Build',  desc: 'Build and tag container image' },
  { id: 'registry', label: 'Push to ECR',   desc: 'Push image to container registry' },
  { id: 'deploy',   label: 'Deploy to EKS', desc: 'ArgoCD syncs new image to cluster' },
  { id: 'verify',   label: 'Health Check',  desc: 'Verify pods are running healthy' },
  { id: 'prod',     label: 'Production',    desc: 'Traffic routed to new version' },
];

const STEP_MS = 800; // ms per step

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-400" />;
  if (status === 'running')  return <Loader className="w-4 h-4 text-cyan-400 animate-spin" />;
  return <Circle className="w-4 h-4 text-white/15" />;
}

export default function CICDPipeline() {
  const [statuses, setStatuses] = useState<StepStatus[]>(PIPELINE_STEPS.map(() => 'pending'));
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);
  const stepRef    = useRef(-1);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sectionRef = useRef<HTMLElement>(null);
  const hasPlayed  = useRef(false);

  // Fire once when section scrolls into view
  const inView = useInView(sectionRef, { once: true, margin: '-20% 0px' });

  const run = useCallback(() => {
    clearTimeout(timerRef.current);
    stepRef.current = -1;
    setStatuses(PIPELINE_STEPS.map(() => 'pending'));
    setDone(false);
    setRunning(true);
  }, []);

  // Auto-play on scroll into view
  useEffect(() => {
    if (inView && !hasPlayed.current) {
      hasPlayed.current = true;
      run();
    }
  }, [inView, run]);

  useEffect(() => {
    if (!running) return;

    function advance() {
      const next = stepRef.current + 1;
      if (next >= PIPELINE_STEPS.length) {
        setRunning(false);
        setDone(true);
        return;
      }
      stepRef.current = next;
      setStatuses(PIPELINE_STEPS.map((_, i) => {
        if (i < next)   return 'success';
        if (i === next) return 'running';
        return 'pending';
      }));
      timerRef.current = setTimeout(() => {
        setStatuses(PIPELINE_STEPS.map((_, i) => i <= next ? 'success' : 'pending'));
        advance();
      }, STEP_MS);
    }

    advance();
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const runningIdx = statuses.findIndex(s => s === 'running');

  return (
    <section ref={sectionRef} id="pipeline" className="py-24 lg:py-32 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="CI/CD" title="Deployment Pipeline"
          subtitle="How code moves from a developer's laptop to production in under 15 minutes." />

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <FadeUp>
            <div className="card p-6" style={{ minHeight: 480 }}>
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-mono text-white/30 uppercase tracking-widest">Pipeline Run</p>
                <button onClick={run} disabled={running}
                  className="flex items-center gap-1.5 text-xs text-white/35 hover:text-cyan-400 transition-colors disabled:opacity-30"
                  aria-label="Replay pipeline">
                  <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
                  {running ? 'Running…' : '↺ Replay'}
                </button>
              </div>

              <div className="relative">
                {/* Rail: left-8 = 32px = px-3(12) + half of w-10(20) = circle centre */}
                <div className="absolute left-8 top-0 bottom-0 w-px bg-white/[0.06]" />
                <div className="space-y-1">
                  {PIPELINE_STEPS.map((step, i) => {
                    const status    = statuses[i];
                    const isRunning = i === runningIdx;
                    return (
                      <div key={step.id}
                        className="flex items-center gap-4 py-2.5 px-3 rounded-lg"
                        style={{
                          background:  isRunning ? 'rgba(34,211,238,0.04)' : 'transparent',
                          opacity:     status === 'pending' ? 0.4 : 1,
                          transition:  'opacity 0.25s, background 0.25s',
                        }}>
                        <div className="w-10 h-10 flex items-center justify-center rounded-full border flex-shrink-0 z-10 bg-[#0a0a0a]"
                          style={{
                            borderColor: isRunning ? 'rgba(34,211,238,0.5)' : status === 'success' ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.07)',
                            transition:  'border-color 0.25s',
                          }}>
                          <StepIcon status={status} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium"
                            style={{ color: status === 'success' ? 'white' : isRunning ? 'rgb(103,232,249)' : 'rgba(255,255,255,0.35)', transition: 'color 0.25s' }}>
                            {step.label}
                          </p>
                          <p className="text-xs text-white/25 truncate">{step.desc}</p>
                        </div>
                        <span className="text-xs font-mono text-white/20">{i.toString().padStart(2, '0')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Always in DOM — height reserved, opacity animates */}
              <div className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-lg border"
                style={{
                  opacity:     done ? 1 : 0,
                  borderColor: done ? 'rgba(34,197,94,0.25)' : 'transparent',
                  background:  done ? 'rgba(34,197,94,0.08)' : 'transparent',
                  transition:  'opacity 0.4s, border-color 0.4s, background 0.4s',
                }}>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">Deployment successful</span>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="space-y-5">
              <h3 className="text-white font-display font-semibold text-lg">From commit to production</h3>
              <p className="text-white/45 text-[15px] leading-relaxed">
                Every push to <code className="text-cyan-400/80 text-xs bg-cyan-400/10 px-1.5 py-0.5 rounded">main</code> triggers
                a fully automated pipeline. No manual steps, no deployment scripts, no human intervention required.
              </p>
              <div className="space-y-3">
                {[
                  { step: 'Build & Test', detail: 'Docker multi-stage build + unit/integration tests + Trivy security scan' },
                  { step: 'Registry',     detail: 'Image pushed to ECR with immutable tags and SBOM attestation' },
                  { step: 'GitOps',       detail: 'ArgoCD detects new image and syncs Kubernetes manifests automatically' },
                  { step: 'Verification', detail: 'Health checks pass, traffic gradually shifted via canary rollout' },
                ].map(({ step, detail }) => (
                  <div key={step} className="flex gap-3">
                    <span className="text-cyan-400 font-mono text-xs mt-1 select-none">→</span>
                    <div>
                      <p className="text-white/70 text-sm font-medium">{step}</p>
                      <p className="text-white/35 text-xs leading-relaxed">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
