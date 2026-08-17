import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { SectionHeader, FadeUp } from '../common/Motion';

type MetricKey = 'cpu' | 'memory' | 'requests' | 'latency';

interface MetricState {
  cpu: number; memory: number; requests: number; latency: number;
}

function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const METRIC_META: { key: MetricKey; label: string; unit: string; warn: number; crit: number }[] = [
  { key: 'cpu',      label: 'CPU Usage',       unit: '%',   warn: 75, crit: 90 },
  { key: 'memory',   label: 'Memory',          unit: '%',   warn: 70, crit: 85 },
  { key: 'requests', label: 'Requests',        unit: '/s',  warn: 12000, crit: 18000 },
  { key: 'latency',  label: 'P95 Latency',     unit: 'ms',  warn: 200, crit: 500 },
];

function MetricBar({ value, warn, crit }: { value: number; warn: number; crit: number }) {
  const pct = Math.min((value / (crit * 1.2)) * 100, 100);
  const color = value >= crit ? 'bg-red-500' : value >= warn ? 'bg-amber-500' : 'bg-cyan-500';
  return (
    <div className="w-full h-1 rounded-full bg-white/[0.08] overflow-hidden">
      <motion.div className={`h-full rounded-full ${color}`}
        animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
    </div>
  );
}

// Mini spark chart
function Spark({ history }: { history: number[] }) {
  if (history.length < 2) return null;
  const max = Math.max(...history, 1);
  const w = 120, h = 32;
  const pts = history.map((v, i) => `${(i / (history.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke="rgba(34,211,238,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<MetricState>({ cpu: 52, memory: 43, requests: 6200, latency: 98 });
  const [history, setHistory] = useState<Record<MetricKey, number[]>>({
    cpu: [40, 45, 52, 48, 55, 52], memory: [38, 41, 43, 40, 44, 43],
    requests: [5000, 5800, 6200, 5900, 6500, 6200], latency: [85, 94, 98, 91, 105, 98],
  });
  const [alert, setAlert] = useState<string | null>(null);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sectionRef    = useRef<HTMLElement>(null);

  // Only run the live ticker when the section is visible
  const inView = useInView(sectionRef, { margin: '-20% 0px' });

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => {
      setMetrics(prev => {
        const next: MetricState = {
          cpu:      clamp(prev.cpu      + randBetween(-8, 8),  5,  95),
          memory:   clamp(prev.memory   + randBetween(-5, 5),  20, 85),
          requests: clamp(prev.requests + randBetween(-800, 800), 1000, 18000),
          latency:  clamp(prev.latency  + randBetween(-20, 20), 30, 450),
        };
        // Trigger alert
        if (next.cpu > 80) {
          clearTimeout(alertTimerRef.current);
          setAlert('⚠ CPU > 80% — Alert triggered → PagerDuty');
          alertTimerRef.current = setTimeout(() => setAlert(null), 3000);
        }
        setHistory(h => {
          const update = (arr: number[], v: number) => [...arr.slice(-19), v];
          return { cpu: update(h.cpu, next.cpu), memory: update(h.memory, next.memory), requests: update(h.requests, next.requests), latency: update(h.latency, next.latency) };
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(t);
  }, [inView]);

  function clamp(v: number, lo: number, hi: number) { return Math.min(Math.max(v, lo), hi); }

  const allOk = metrics.cpu < 75 && metrics.memory < 70;

  return (
    <section ref={sectionRef} id="monitoring" className="py-24 lg:py-32 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Observability" title="Monitoring Dashboard"
          subtitle="Real-time metrics as they'd appear in Grafana — updated every 2 seconds." />

        <FadeUp>
          <div className="card p-6 sm:p-8">
            {/* Status bar */}
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${allOk ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
                <span className={`text-sm font-mono ${allOk ? 'text-green-400' : 'text-amber-400'}`}>
                  {allOk ? 'All systems operational' : 'Elevated resource usage'}
                </span>
              </div>
              <p className="text-xs font-mono text-white/20">Prometheus → Grafana</p>
            </div>

            {/* Metrics grid */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {METRIC_META.map(({ key, label, unit, warn, crit }) => {
                const val = metrics[key];
                const isCrit = val >= crit;
                const isWarn = val >= warn;
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-end justify-between">
                      <p className="text-xs text-white/40">{label}</p>
                      <p className={`text-xl font-display font-bold tabular-nums transition-colors ${isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-white'}`}>
                        {key === 'requests' ? (val / 1000).toFixed(1) + 'k' : val}{unit}
                      </p>
                    </div>
                    <MetricBar value={val} warn={warn} crit={crit} />
                    <div className="flex justify-end">
                      <Spark history={history[key]} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Alert */}
            <motion.div
              animate={{ opacity: alert ? 1 : 0, y: alert ? 0 : 4 }}
              className="flex items-center gap-3 py-3 px-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-mono"
              style={{ pointerEvents: alert ? 'auto' : 'none' }}>
              {alert}
            </motion.div>

            {/* Stack */}
            <div className="mt-6 pt-5 border-t border-white/[0.05] flex flex-wrap items-center gap-3 text-xs font-mono text-white/25">
              <span>Prometheus</span>
              <span className="text-white/15">→</span>
              <span>Alertmanager</span>
              <span className="text-white/15">→</span>
              <span>Grafana</span>
              <span className="text-white/15">→</span>
              <span>PagerDuty</span>
              <span className="text-white/15">→</span>
              <span>Slack</span>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
