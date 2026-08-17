import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { RefreshCw, Play, Pause } from 'lucide-react';
import { SectionHeader, FadeUp } from '../common/Motion';

// ─── Stage definitions ────────────────────────────────────────────────────────
const STAGES = [
  {
    id: 'kubectl',
    phase: 'Client',
    label: 'kubectl apply',
    detail: 'User submits deployment.yaml to the cluster',
    code: 'kubectl apply -f deployment.yaml',
    color: 'cyan',
    ms: 1800,
  },
  {
    id: 'apiserver',
    phase: 'Control Plane',
    label: 'API Server',
    detail: 'Validates & authenticates the request, creates Pod object',
    code: 'POST /apis/apps/v1/deployments',
    color: 'blue',
    ms: 2000,
  },
  {
    id: 'etcd',
    phase: 'Control Plane',
    label: 'etcd',
    detail: 'Desired state persisted — Pod status: Pending',
    code: 'key: /registry/pods/default/my-app\nstatus: Pending',
    color: 'violet',
    ms: 1800,
  },
  {
    id: 'scheduler',
    phase: 'Control Plane',
    label: 'Scheduler',
    detail: 'Watches for unscheduled Pods, evaluates node capacity',
    code: 'Filtering nodes…\nScoring nodes…',
    color: 'amber',
    ms: 2800,
  },
  {
    id: 'node',
    phase: 'Worker',
    label: 'Node Selected',
    detail: 'Node 2 wins — lowest CPU utilisation',
    code: 'Node 1  CPU 85%  ✕\nNode 2  CPU 40%  ✓\nNode 3  CPU 70%  ✕',
    color: 'green',
    ms: 2200,
  },
  {
    id: 'kubelet',
    phase: 'Worker',
    label: 'Kubelet',
    detail: 'Kubelet on Node 2 picks up the Pod spec',
    code: 'podSpec received\nnode: node-2',
    color: 'cyan',
    ms: 1800,
  },
  {
    id: 'runtime',
    phase: 'Worker',
    label: 'Container Runtime',
    detail: 'containerd / CRI-O receives the container spec',
    code: 'containerd: create sandbox\nPod sandbox started',
    color: 'blue',
    ms: 1800,
  },
  {
    id: 'pull',
    phase: 'Worker',
    label: 'Image Pull',
    detail: 'Image pulled from registry to the node',
    code: 'registry.example.com/my-app:v1\nPulling… 47 MB\nPulled ✓',
    color: 'violet',
    ms: 2600,
  },
  {
    id: 'create',
    phase: 'Worker',
    label: 'Container Created',
    detail: 'Container filesystem and namespaces initialised',
    code: 'container: my-app\nstate: Created',
    color: 'amber',
    ms: 1600,
  },
  {
    id: 'start',
    phase: 'Worker',
    label: 'Container Started',
    detail: 'Entrypoint executed, process running inside cgroup',
    code: 'container: my-app\nstate: Running\npid: 1',
    color: 'green',
    ms: 1600,
  },
  {
    id: 'running',
    phase: 'Pod',
    label: 'Pod Running ✓',
    detail: 'All containers healthy — Pod is Ready',
    code: 'Pod     ● Running\nContainer ● Running\nNode    ● Ready',
    color: 'green',
    ms: 0,
  },
] as const;

type StageId = typeof STAGES[number]['id'];
type Color = typeof STAGES[number]['color'];

// ─── Colour maps ──────────────────────────────────────────────────────────────
const BORDER: Record<Color, string> = {
  cyan:   'border-cyan-400/60',
  blue:   'border-blue-400/60',
  violet: 'border-violet-400/60',
  amber:  'border-amber-400/60',
  green:  'border-green-400/60',
};
const BG: Record<Color, string> = {
  cyan:   'bg-cyan-400/10',
  blue:   'bg-blue-400/10',
  violet: 'bg-violet-400/10',
  amber:  'bg-amber-400/10',
  green:  'bg-green-400/10',
};
const TEXT: Record<Color, string> = {
  cyan:   'text-cyan-400',
  blue:   'text-blue-400',
  violet: 'text-violet-400',
  amber:  'text-amber-400',
  green:  'text-green-400',
};
const DOT_BG: Record<Color, string> = {
  cyan:   'bg-cyan-400',
  blue:   'bg-blue-400',
  violet: 'bg-violet-400',
  amber:  'bg-amber-400',
  green:  'bg-green-400',
};

// Group stages into visual zones for the architecture diagram
const ZONES = [
  { label: 'Client',        ids: ['kubectl'] as StageId[]                       },
  { label: 'Control Plane', ids: ['apiserver', 'etcd', 'scheduler'] as StageId[] },
  { label: 'Kubernetes Cluster / Worker Node 2', ids: ['node', 'kubelet', 'runtime', 'pull', 'create', 'start', 'running'] as StageId[] },
];

// ─── Mini node scoring card ───────────────────────────────────────────────────
function NodeScoring({ active }: { active: boolean }) {
  const nodes = [
    { name: 'Node 1', cpu: 85, ok: false },
    { name: 'Node 2', cpu: 40, ok: true  },
    { name: 'Node 3', cpu: 70, ok: false },
  ];
  return (
    <div className="space-y-1.5 mt-2">
      {nodes.map((n, i) => (
        <motion.div key={n.name}
          initial={{ opacity: 0, x: -8 }}
          animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
          transition={{ delay: i * 0.18, duration: 0.3 }}
          className={`flex items-center gap-2 text-xs font-mono px-2 py-1 rounded ${
            n.ok ? 'bg-green-400/10 border border-green-400/30' : 'bg-white/[0.03] border border-white/[0.06]'
          }`}>
          <span className="w-14 text-white/50">{n.name}</span>
          <div className="flex-1 h-1 rounded-full bg-white/[0.08] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${n.cpu}%`, background: n.cpu > 75 ? '#f87171' : n.cpu > 55 ? '#fbbf24' : '#34d399' }} />
          </div>
          <span className="w-8 text-right" style={{ color: n.cpu > 75 ? '#f87171' : n.cpu > 55 ? '#fbbf24' : '#34d399' }}>
            {n.cpu}%
          </span>
          <span className={n.ok ? 'text-green-400' : 'text-white/20'}>{n.ok ? '✓' : '✕'}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Single stage row (left timeline) ────────────────────────────────────────
function StageRow({
  stage, index, activeIndex, isLast,
}: {
  stage: typeof STAGES[number];
  index: number;
  activeIndex: number;
  isLast: boolean;
}) {
  const done    = index < activeIndex;
  const current = index === activeIndex;
  const pending = index > activeIndex;
  const c       = stage.color;

  return (
    <div className="flex gap-3">
      {/* Dot + connector line */}
      <div className="flex flex-col items-center flex-none" style={{ width: 20 }}>
        <motion.div
          animate={current ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={{ repeat: current ? Infinity : 0, duration: 1.2 }}
          className={`w-3 h-3 rounded-full flex-none mt-0.5 border-2 transition-colors duration-300 ${
            done    ? `${DOT_BG[c]} border-transparent`
            : current ? `bg-transparent ${BORDER[c]} shadow-[0_0_8px_currentColor]`
            : 'bg-transparent border-white/15'
          }`}
          style={current ? { color: c === 'cyan' ? 'rgb(34,211,238)' : c === 'blue' ? 'rgb(96,165,250)' : c === 'violet' ? 'rgb(167,139,250)' : c === 'amber' ? 'rgb(251,191,36)' : 'rgb(74,222,128)' } : {}}
        />
        {!isLast && (
          <div className="flex-1 w-px mt-1"
            style={{ background: done ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.06)', minHeight: 20 }} />
        )}
      </div>

      {/* Content */}
      <div className={`pb-4 min-w-0 transition-opacity duration-300 ${pending ? 'opacity-30' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-mono uppercase tracking-widest ${pending ? 'text-white/20' : TEXT[c]}`}>
            {stage.phase}
          </span>
        </div>
        <p className={`text-sm font-medium leading-tight ${done ? 'text-white/70' : current ? 'text-white' : 'text-white/25'}`}>
          {stage.label}
        </p>

        {/* Expanded detail when current */}
        <AnimatePresence>
          {current && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <p className="text-xs text-white/40 mt-1 leading-relaxed">{stage.detail}</p>
              <pre className={`text-[10px] font-mono mt-2 px-2 py-1.5 rounded border ${BG[c]} ${BORDER[c]} ${TEXT[c]} leading-relaxed whitespace-pre-wrap`}>
                {stage.code}
              </pre>
              {stage.id === 'scheduler' && <NodeScoring active={current} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Architecture flow diagram (right panel) ─────────────────────────────────
function ArchDiagram({ activeIndex }: { activeIndex: number }) {
  const activeId = (activeIndex >= 0 && activeIndex < STAGES.length)
    ? STAGES[activeIndex].id
    : activeIndex >= STAGES.length ? 'running' : null;

  return (
    <div className="space-y-2">
      {ZONES.map((zone) => {
        const zoneActive = activeId !== null && zone.ids.includes(activeId as StageId);
        return (
          <div key={zone.label}
            className={`rounded-xl border p-3 transition-all duration-300 ${
              zoneActive ? 'border-cyan-400/25 bg-cyan-400/[0.04]' : 'border-white/[0.06] bg-transparent'
            }`}>
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-2">{zone.label}</p>
            <div className="flex flex-wrap gap-2">
              {zone.ids.map((id) => {
                const s     = STAGES.find(st => st.id === id)!;
                const idx   = STAGES.findIndex(st => st.id === id);
                const done    = activeIndex >= 0 && idx < activeIndex;
                const current = activeId !== null && id === activeId;
                const c     = s.color;
                return (
                  <motion.div key={id}
                    animate={current ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                    transition={{ repeat: current ? Infinity : 0, duration: 1.5 }}
                    className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all duration-300 ${
                      current ? `${BORDER[c]} ${BG[c]} ${TEXT[c]}`
                      : done   ? 'border-white/10 bg-white/[0.03] text-white/40'
                      : 'border-white/[0.05] bg-transparent text-white/15'
                    }`}>
                    <div className="flex items-center gap-1.5">
                      {current && <span className={`w-1.5 h-1.5 rounded-full ${DOT_BG[c]} animate-pulse`} />}
                      {done    && <span className="w-1.5 h-1.5 rounded-full bg-green-400/60" />}
                      {!current && !done && <span className="w-1.5 h-1.5 rounded-full bg-white/10" />}
                      {s.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Final state card */}
      <AnimatePresence>
        {activeIndex >= STAGES.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-green-400/30 bg-green-400/[0.05] p-4 mt-2"
          >
            <p className="text-[9px] font-mono uppercase tracking-widest text-green-400/60 mb-3">Final State</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Pod',       status: 'Running' },
                { label: 'Container', status: 'Running' },
                { label: 'Node',      status: 'Ready'   },
              ].map(({ label, status }) => (
                <div key={label} className="text-center">
                  <span className="block w-2 h-2 rounded-full bg-green-400 mx-auto mb-1 animate-pulse" />
                  <p className="text-[9px] font-mono text-white/40">{label}</p>
                  <p className="text-[10px] font-mono text-green-400">{status}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PodLifecycle() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [running, setRunning]         = useState(false);
  const [paused, setPaused]           = useState(false);

  const sectionRef  = useRef<HTMLElement>(null);
  const hasPlayed   = useRef(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pausedRef   = useRef(false);

  const inView       = useInView(sectionRef, { once: true, margin: '-20% 0px' });
  const reducedMotion = useReducedMotion();

  // Keep pausedRef in sync so the advance closure reads the latest value
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const advance = useCallback((idx: number) => {
    if (pausedRef.current) return;
    if (idx >= STAGES.length) { setRunning(false); return; }
    setActiveIndex(idx);
    const ms = STAGES[idx].ms;
    if (ms > 0) {
      timerRef.current = setTimeout(() => advance(idx + 1), ms);
    }
  }, [reducedMotion]);

  const play = useCallback(() => {
    clearTimeout(timerRef.current);
    setActiveIndex(-1);
    setPaused(false);
    pausedRef.current = false;
    setRunning(true);
    // Small delay so state resets before first advance
    timerRef.current = setTimeout(() => advance(0), 100);
  }, [advance]);

  const togglePause = useCallback(() => {
    if (!running) return;
    setPaused(p => {
      const next = !p;
      pausedRef.current = next;
      // If resuming, continue from current step
      if (!next && activeIndex < STAGES.length) {
        const ms = STAGES[activeIndex].ms;
        timerRef.current = setTimeout(() => advance(activeIndex + 1), ms);
      }
      return next;
    });
  }, [running, activeIndex, advance, reducedMotion]);

  // Auto-play on scroll into view
  useEffect(() => {
    if (inView && !hasPlayed.current) {
      hasPlayed.current = true;
      timerRef.current = setTimeout(() => play(), 800);
    }
  }, [inView, play]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const isDone = activeIndex >= STAGES.length - 1;
  const currentStage = activeIndex >= 0 && activeIndex < STAGES.length ? STAGES[activeIndex] : null;

  return (
    <section ref={sectionRef} id="pod-lifecycle" className="py-24 lg:py-32 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          label="Kubernetes"
          title="Pod Lifecycle"
          subtitle="Step-by-step: from kubectl apply to a container running inside a cluster node."
        />

        <FadeUp>
          <div className="card p-6 sm:p-8">
            {/* ── Header bar ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              {/* Current stage pill */}
              <div className="flex items-center gap-2 min-h-[28px]">
                <span className="text-xs font-mono text-white/25 uppercase tracking-widest">Stage:</span>
                <AnimatePresence mode="wait">
                  {currentStage ? (
                    <motion.span key={currentStage.id}
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2 }}
                      className={`text-xs font-mono px-2 py-0.5 rounded border ${BG[currentStage.color]} ${BORDER[currentStage.color]} ${TEXT[currentStage.color]}`}>
                      {currentStage.label}
                    </motion.span>
                  ) : isDone ? (
                    <motion.span key="done"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-xs font-mono px-2 py-0.5 rounded border border-green-400/30 bg-green-400/10 text-green-400">
                      Complete ✓
                    </motion.span>
                  ) : (
                    <span className="text-xs font-mono text-white/20">Ready</span>
                  )}
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {running && !isDone && (
                  <button onClick={togglePause}
                    className="flex items-center gap-1.5 text-xs text-white/35 hover:text-cyan-400 transition-colors"
                    aria-label={paused ? 'Resume' : 'Pause'}>
                    {paused
                      ? <Play className="w-3.5 h-3.5" />
                      : <Pause className="w-3.5 h-3.5" />}
                    {paused ? 'Resume' : 'Pause'}
                  </button>
                )}
                <button onClick={play} disabled={running && !paused && !isDone}
                  className="flex items-center gap-1.5 text-xs text-white/35 hover:text-cyan-400 transition-colors disabled:opacity-30"
                  aria-label="Replay">
                  <RefreshCw className={`w-3.5 h-3.5 ${running && !paused && !isDone ? 'animate-spin' : ''}`} />
                  {isDone ? '↺ Replay' : running && !paused ? 'Running…' : '▶ Play'}
                </button>
              </div>
            </div>

            {/* ── Two-column layout ── */}
            <div className="grid lg:grid-cols-2 gap-8">

              {/* Left: step-by-step timeline */}
              <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
                {STAGES.map((stage, i) => (
                  <StageRow
                    key={stage.id}
                    stage={stage}
                    index={i}
                    activeIndex={activeIndex}
                    isLast={i === STAGES.length - 1}
                  />
                ))}
              </div>

              {/* Right: architecture diagram */}
              <div>
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-3">Architecture</p>
                <ArchDiagram activeIndex={activeIndex} />
              </div>
            </div>

            {/* ── Progress bar ── */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div className="h-full bg-cyan-500 rounded-full"
                  animate={{ width: activeIndex < 0 ? '0%' : `${((activeIndex + 1) / STAGES.length) * 100}%` }}
                  transition={{ duration: 0.5 }} />
              </div>
              <span className="text-xs font-mono text-white/25 w-8 text-right">
                {activeIndex < 0 ? '0' : Math.round(((activeIndex + 1) / STAGES.length) * 100)}%
              </span>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
