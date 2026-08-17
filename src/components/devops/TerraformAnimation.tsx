import { useState, useCallback, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { SectionHeader, FadeUp } from '../common/Motion';

const TERRAFORM_LINES = [
  { type: 'cmd',  text: 'terraform init' },
  { type: 'out',  text: 'Initializing the backend...' },
  { type: 'out',  text: '✓ AWS provider installed' },
  { type: 'gap' },
  { type: 'cmd',  text: 'terraform plan' },
  { type: 'out',  text: '+ aws_vpc.main' },
  { type: 'out',  text: '+ aws_subnet.public[0]' },
  { type: 'out',  text: '+ aws_subnet.private[0]' },
  { type: 'out',  text: '+ aws_eks_cluster.main' },
  { type: 'out',  text: 'Plan: 4 to add, 0 to change' },
  { type: 'gap' },
  { type: 'cmd',  text: 'terraform apply -auto-approve' },
  { type: 'prog', text: 'aws_vpc.main' },
  { type: 'prog', text: 'aws_subnet.public[0]' },
  { type: 'prog', text: 'aws_subnet.private[0]' },
  { type: 'prog', text: 'aws_eks_cluster.main' },
  { type: 'done', text: 'Apply complete! 4 added.' },
  { type: 'prompt' },
];

const INFRA_TREE = [
  { depth: 0, label: 'AWS', icon: '☁' },
  { depth: 1, label: 'VPC', icon: '🔷' },
  { depth: 2, label: 'Public Subnet', icon: '🌐' },
  { depth: 2, label: 'Private Subnet', icon: '🔒' },
  { depth: 1, label: 'EKS Cluster', icon: '☸' },
  { depth: 2, label: 'Node Group A', icon: '🖥' },
  { depth: 2, label: 'Node Group B', icon: '🖥' },
  { depth: 1, label: 'Load Balancer', icon: '⚖' },
];

export default function TerraformAnimation() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showTree, setShowTree]         = useState(false);
  const [visibleTree, setVisibleTree]   = useState(0);
  const [running, setRunning]           = useState(false);
  const termBodyRef = useRef<HTMLDivElement>(null);
  const sectionRef  = useRef<HTMLElement>(null);
  const hasPlayed   = useRef(false);

  // Fire once when section scrolls into view
  const inView = useInView(sectionRef, { once: true, margin: '-20% 0px' });

  const run = useCallback(() => {
    setVisibleLines(0); setShowTree(false); setVisibleTree(0); setRunning(true);
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
    if (visibleLines >= TERRAFORM_LINES.length) {
      // Set both in the same render — no timeout, no cleanup race
      setShowTree(true);
      setRunning(false);
      return;
    }
    const line = TERRAFORM_LINES[visibleLines];
    const delay = line.type === 'cmd' ? 550 : line.type === 'gap' ? 100 : 180;
    const t = setTimeout(() => setVisibleLines(v => v + 1), delay);
    return () => clearTimeout(t);
  }, [visibleLines, running]);

  useEffect(() => {
    if (!showTree) return;
    if (visibleTree >= INFRA_TREE.length) return;
    const t = setTimeout(() => setVisibleTree(v => v + 1), 150);
    return () => clearTimeout(t);
  }, [showTree, visibleTree]);

  // Scroll only the terminal body div — never the page
  useEffect(() => {
    const el = termBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleLines]);

  return (
    <section ref={sectionRef} id="terraform" className="py-24 lg:py-32 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Infrastructure as Code" title="Terraform in Action"
          subtitle="Watch infrastructure provision itself from code — reproducible, versioned, and auditable." />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Terminal */}
          <FadeUp>
            <div className="terminal">
              <div className="terminal-header">
                <span className="terminal-dot bg-red-500/70" />
                <span className="terminal-dot bg-yellow-500/70" />
                <span className="terminal-dot bg-green-500/70" />
                <span className="ml-3 text-white/20 text-xs flex-1">terraform</span>
                <button onClick={run} disabled={running}
                  className="ml-auto text-white/25 hover:text-cyan-400 transition-colors disabled:opacity-30"
                  aria-label="Replay">
                  <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {/* Fixed height — scrolls internally, never moves the page */}
              <div ref={termBodyRef}
                className="p-4 text-xs leading-relaxed overflow-y-auto space-y-0.5"
                style={{ height: 288 }}>
                {visibleLines === 0 && !running && (
                  <p className="text-white/20 font-mono">Click ↻ to run…</p>
                )}
                {TERRAFORM_LINES.slice(0, visibleLines).map((line, i) => (
                  <div key={i} style={{ opacity: 1 }}>
                    {line.type === 'cmd' && (
                      <div className="flex gap-2 mt-1">
                        <span className="text-cyan-400">$</span>
                        <span className="text-white/80">{line.text}</span>
                      </div>
                    )}
                    {line.type === 'out' && (
                      <p className={`pl-4 ${line.text?.startsWith('✓') ? 'text-green-400' : 'text-white/40'}`}>{line.text}</p>
                    )}
                    {line.type === 'prog' && (
                      <div className="pl-4 flex items-center gap-2 text-white/50">
                        <span>{line.text}</span>
                        <span className="text-green-400 text-xs">........... ✓</span>
                      </div>
                    )}
                    {line.type === 'done' && (
                      <p className="pl-4 text-green-400 font-medium mt-1">{line.text}</p>
                    )}
                    {line.type === 'prompt' && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-cyan-400">$</span>
                        <span className="inline-block w-2 h-3 bg-cyan-400/80 animate-cursor-blink" />
                      </div>
                    )}
                    {line.type === 'gap' && <div className="h-1.5" />}
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Infrastructure tree — fixed height so it never shifts layout */}
          <FadeUp delay={0.1}>
            <div className="card p-6" style={{ minHeight: 340 }}>
              <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-5">Provisioned Infrastructure</p>
              {!showTree && (
                <div className="flex items-center justify-center h-40 text-white/20 text-sm font-mono">
                  {running ? 'Applying…' : 'Waiting for apply…'}
                </div>
              )}
              {showTree && (
                <div className="space-y-1.5">
                  {INFRA_TREE.slice(0, visibleTree).map((node, i) => (
                    <div key={i}
                      className="flex items-center gap-2 text-sm"
                      style={{ paddingLeft: `${node.depth * 20}px` }}>
                      {node.depth > 0 && (
                        <span className="text-white/15 font-mono text-xs select-none">
                          {node.depth === 1 ? '├──' : '│   ├──'}
                        </span>
                      )}
                      <span className="text-base">{node.icon}</span>
                      <span className={node.depth === 0 ? 'text-cyan-400 font-semibold' : node.depth === 1 ? 'text-white/70' : 'text-white/45'}>
                        {node.label}
                      </span>
                      {i < visibleTree - 1 && (
                        <span className="ml-auto text-green-400 text-xs">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
