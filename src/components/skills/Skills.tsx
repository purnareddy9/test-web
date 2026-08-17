import { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionHeader, FadeUp, StaggerList, StaggerItem, ProgressBar } from '../common/Motion';
import type { Skill } from '../../types';

const CATEGORIES: { key: Skill['category']; label: string }[] = [
  { key: 'cloud',      label: 'Cloud' },
  { key: 'containers', label: 'Containers' },
  { key: 'cicd',       label: 'CI/CD' },
  { key: 'iac',        label: 'IaC' },
  { key: 'monitoring', label: 'Monitoring' },
  { key: 'scripting',  label: 'Scripting' },
  { key: 'vcs',        label: 'Version Control' },
];

const LEVEL_STYLE: Record<string, string> = {
  expert:       'text-cyan-400 bg-cyan-400/10 border-cyan-400/25',
  advanced:     'text-blue-400 bg-blue-400/10 border-blue-400/25',
  intermediate: 'text-purple-400 bg-purple-400/10 border-purple-400/25',
  familiar:     'text-white/35 bg-white/5 border-white/15',
};

// Tool relationship graph
const TOOL_GRAPH: { id: string; label: string; x: number; y: number; connections: string[] }[] = [
  { id: 'github',  label: 'GitHub',         x: 50, y: 5,  connections: ['actions'] },
  { id: 'actions', label: 'GitHub Actions', x: 50, y: 22, connections: ['docker', 'tests'] },
  { id: 'tests',   label: 'Tests',          x: 80, y: 35, connections: ['docker'] },
  { id: 'docker',  label: 'Docker',         x: 50, y: 40, connections: ['ecr'] },
  { id: 'ecr',     label: 'ECR',            x: 50, y: 57, connections: ['eks'] },
  { id: 'eks',     label: 'Kubernetes',     x: 50, y: 73, connections: ['prometheus', 'grafana'] },
  { id: 'prometheus', label: 'Prometheus',  x: 20, y: 88, connections: ['grafana'] },
  { id: 'grafana', label: 'Grafana',        x: 80, y: 88, connections: [] },
];

function ToolGraph() {
  const [hovered, setHovered] = useState<string | null>(null);
  const getNode = (id: string) => TOOL_GRAPH.find(n => n.id === id)!;

  const isHighlighted = (id: string) => {
    if (!hovered) return false;
    if (id === hovered) return true;
    const h = getNode(hovered);
    return h.connections.includes(id) || TOOL_GRAPH.some(n => n.id === hovered && n.connections.includes(id));
  };

  return (
    <div className="relative w-full" style={{ height: 340 }} aria-label="DevOps tool relationship diagram" role="img">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {TOOL_GRAPH.map(node =>
          node.connections.map(cid => {
            const target = getNode(cid);
            const active = hovered && (hovered === node.id || hovered === cid);
            return (
              <line key={`${node.id}-${cid}`}
                x1={node.x} y1={node.y} x2={target.x} y2={target.y}
                stroke={active ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.07)'}
                strokeWidth="0.4"
                style={{ transition: 'stroke 0.2s' }} />
            );
          })
        )}
      </svg>
      {TOOL_GRAPH.map(node => (
        <motion.div key={node.id}
          style={{ position: 'absolute', left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%,-50%)' }}
          whileHover={{ scale: 1.05 }}
          onHoverStart={() => setHovered(node.id)}
          onHoverEnd={() => setHovered(null)}>
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono cursor-default transition-all duration-200 whitespace-nowrap
            ${isHighlighted(node.id)
              ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300'
              : hovered
              ? 'border-white/5 bg-[#111] text-white/25'
              : 'border-white/10 bg-[#161616] text-white/60'}`}>
            {node.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Skills({ skills }: { skills: Skill[] }) {
  const [active, setActive] = useState<Skill['category']>('cloud');
  const filtered = skills.filter(s => s.category === active).sort((a, b) => a.display_order - b.display_order);
  const available = CATEGORIES.filter(c => skills.some(s => s.category === c.key));

  return (
    <section id="skills" className="py-24 lg:py-32" aria-labelledby="skills-heading">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Skills" title="Engineering Toolkit"
          subtitle="Technologies and platforms I use to build, automate, and operate production infrastructure." />

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Category tabs + skill bars */}
          <div>
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 mb-7" role="tablist" aria-label="Skill categories">
              {available.map(cat => (
                <button key={cat.key} role="tab" aria-selected={active === cat.key}
                  onClick={() => setActive(cat.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
                    ${active === cat.key ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-white/40 hover:text-white/70 border border-transparent'}`}>
                  {cat.label}
                </button>
              ))}
            </div>

            <StaggerList key={active} className="space-y-3">
              {filtered.map(skill => (
                <StaggerItem key={skill.id}>
                  <div className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{skill.name}</span>
                        {skill.years_experience && (
                          <span className="text-white/25 text-xs font-mono">{skill.years_experience}y</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-mono border capitalize ${LEVEL_STYLE[skill.level]}`}>
                          {skill.level}
                        </span>
                        <span className="text-white/35 text-xs font-mono">{skill.proficiency}%</span>
                      </div>
                    </div>
                    <ProgressBar value={skill.proficiency} />
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>

          {/* Tool graph */}
          <FadeUp delay={0.1}>
            <div className="card p-5">
              <p className="text-xs font-mono text-white/30 mb-4 uppercase tracking-widest">Tool Relationships</p>
              <ToolGraph />
              <p className="text-xs text-white/20 text-center mt-3 font-mono">Hover over a tool to see connections</p>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
