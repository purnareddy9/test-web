import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { SectionHeader, FadeUp } from '../common/Motion';

type PodStatus = 'pending' | 'starting' | 'running' | 'failed' | 'terminating' | 'restarting';

interface Pod { id: string; name: string; status: PodStatus; restarts: number }

const INITIAL_PODS: Pod[] = [
  { id: 'p1', name: 'api-server-x9k', status: 'pending',  restarts: 0 },
  { id: 'p2', name: 'frontend-m2p',   status: 'pending',  restarts: 0 },
  { id: 'p3', name: 'worker-q7r',     status: 'pending',  restarts: 0 },
];

const STATUS_STYLE: Record<PodStatus, string> = {
  pending:     'border-white/15   text-white/30    bg-transparent',
  starting:    'border-yellow-500/40 text-yellow-400 bg-yellow-400/10',
  running:     'border-green-500/40  text-green-400  bg-green-400/10',
  failed:      'border-red-500/40    text-red-400    bg-red-400/10',
  terminating: 'border-orange-500/40 text-orange-400 bg-orange-400/10',
  restarting:  'border-cyan-500/40   text-cyan-400   bg-cyan-400/10',
};

const STATUS_DOT: Record<PodStatus, string> = {
  pending:     'bg-white/20',
  starting:    'bg-yellow-400 animate-pulse',
  running:     'bg-green-400',
  failed:      'bg-red-400',
  terminating: 'bg-orange-400 animate-pulse',
  restarting:  'bg-cyan-400 animate-pulse',
};

function PodCard({ pod }: { pod: Pod }) {
  return (
    <motion.div layout
      className={`rounded-lg border px-4 py-3 flex items-center justify-between gap-3 transition-all duration-300 ${STATUS_STYLE[pod.status]}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[pod.status]}`} />
        <span className="text-xs font-mono truncate">{pod.name}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs font-mono opacity-70 capitalize">{pod.status}</span>
        {pod.restarts > 0 && (
          <span className="text-xs text-orange-400 font-mono">{pod.restarts}↺</span>
        )}
      </div>
    </motion.div>
  );
}

export default function KubernetesViz() {
  const [pods, setPods]               = useState<Pod[]>(INITIAL_PODS);
  const [healStep, setHealStep]       = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);
  const sectionRef  = useRef<HTMLElement>(null);
  const hasStarted  = useRef(false);
  const timersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Fire startup sequence once when section enters view
  const inView = useInView(sectionRef, { once: true, margin: '-20% 0px' });

  useEffect(() => {
    if (!inView || hasStarted.current) return;
    hasStarted.current = true;

    // Reset to initial in case user navigated away and back
    setPods(INITIAL_PODS);

    const steps: [number, PodStatus][] = [
      [400, 'starting'], [900, 'starting'], [1400, 'starting'],
    ];
    const running: [number, PodStatus][] = [
      [1100, 'running'], [1600, 'running'], [2100, 'running'],
    ];
    [...steps, ...running].forEach(([delay, status], i) => {
      const idx = i % 3;
      const t = setTimeout(() => {
        setPods(prev => prev.map((p, pi) => pi === idx ? { ...p, status } : p));
      }, delay);
      timersRef.current.push(t);
    });

    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  }, [inView]);

  // Self-healing demo
  function runHealDemo() {
    if (demoRunning) return;
    setDemoRunning(true);
    setHealStep(1);
    setTimeout(() => {
      setPods(prev => prev.map((p, i) => i === 0 ? { ...p, status: 'failed' } : p));
      setHealStep(2);
    }, 500);
    setTimeout(() => { setHealStep(3); }, 1800);
    setTimeout(() => {
      setPods(prev => prev.map((p, i) => i === 0 ? { ...p, status: 'restarting', restarts: p.restarts + 1 } : p));
      setHealStep(4);
    }, 2800);
    setTimeout(() => {
      setPods(prev => prev.map((p, i) => i === 0 ? { ...p, status: 'running' } : p));
      setHealStep(5);
      setTimeout(() => { setHealStep(0); setDemoRunning(false); }, 1500);
    }, 4000);
  }

  const HEAL_STEPS = ['', 'Pod failure detected', 'K8s health check fails', 'Scheduler creates replacement', 'New pod starting…', 'Pod running ✓ — self-healed'];

  return (
    <section ref={sectionRef} id="kubernetes" className="pt-16 pb-24 lg:pt-20 lg:pb-28 border-t border-white/[0.05] scroll-mt-36">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Containers" title="Kubernetes Cluster"
          subtitle="Live view of a Kubernetes deployment — pods, health checks, and self-healing in action." />

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Cluster diagram */}
          <FadeUp>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-mono text-white/30 uppercase tracking-widest">production namespace</p>
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Cluster healthy
                </span>
              </div>

              {/* Ingress → Services → Pods */}
              <div className="space-y-4">
                {/* Ingress */}
                <div className="text-center">
                  <div className="inline-block px-5 py-2 rounded-lg border border-white/10 bg-[#111] text-xs font-mono text-white/50">
                    ☁ Ingress / Load Balancer
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="w-px h-5 bg-white/[0.08]" />
                </div>

                {/* Service */}
                <div className="text-center">
                  <div className="inline-block px-5 py-2 rounded-lg border border-cyan-500/20 bg-cyan-400/[0.05] text-xs font-mono text-cyan-300/70">
                    ⎈ Service (ClusterIP)
                  </div>
                </div>

                {/* Arrows to pods */}
                <div className="flex justify-center gap-8">
                  {pods.map(() => <div key={Math.random()} className="w-px h-5 bg-white/[0.08]" />)}
                </div>

                {/* Pods */}
                <div className="space-y-2">
                  {pods.map(pod => <PodCard key={pod.id} pod={pod} />)}
                </div>

                {/* Arrow down */}
                <div className="flex justify-center">
                  <div className="w-px h-5 bg-white/[0.08]" />
                </div>

                {/* PVC / DB */}
                <div className="text-center">
                  <div className="inline-block px-5 py-2 rounded-lg border border-white/10 bg-[#111] text-xs font-mono text-white/40">
                    🗄 Persistent Volume / Database
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Self-healing demo */}
          <FadeUp delay={0.1}>
            <div className="card p-6">
              <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-5">Self-Healing Demo</p>
              <p className="text-white/45 text-sm leading-relaxed mb-6">
                Kubernetes continuously monitors pod health. When a pod fails, the controller automatically 
                creates a replacement — no human intervention required.
              </p>

              {/* Heal steps */}
              <div className="space-y-2 mb-6 min-h-[120px]">
                {HEAL_STEPS.slice(1).map((step, i) => (
                  <motion.div key={i}
                    animate={{ opacity: healStep > i ? 1 : 0.2 }}
                    className="flex items-center gap-3 text-sm">
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs flex-shrink-0 transition-colors ${
                      healStep > i + 1 ? 'border-green-500/40 text-green-400 bg-green-400/10' :
                      healStep === i + 1 ? 'border-cyan-500/40 text-cyan-400 bg-cyan-400/10 animate-pulse' :
                      'border-white/10 text-white/20'}`}>
                      {healStep > i + 1 ? '✓' : i + 1}
                    </span>
                    <span className={`transition-colors ${healStep > i ? 'text-white/65' : 'text-white/20'}`}>{step}</span>
                  </motion.div>
                ))}
              </div>

              <button onClick={runHealDemo} disabled={demoRunning}
                className="btn-outline w-full justify-center text-sm disabled:opacity-30">
                {demoRunning ? '⏳ Running demo…' : '▶ Simulate Pod Failure'}
              </button>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
