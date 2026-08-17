import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { GitFork, ExternalLink, ArrowRight } from 'lucide-react';
import { SectionHeader, StaggerList, StaggerItem } from '../common/Motion';
import type { Project } from '../../types';

const GRADIENTS = [
  'from-cyan-600/15 to-blue-600/15',
  'from-blue-600/15 to-purple-600/15',
  'from-emerald-600/15 to-cyan-600/15',
  'from-purple-600/15 to-blue-600/15',
  'from-cyan-600/15 to-emerald-600/15',
  'from-blue-600/15 to-cyan-600/15',
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref  = useRef<HTMLDivElement>(null);
  const x    = useMotionValue(0), y = useMotionValue(0);
  const sx   = useSpring(x, { stiffness: 200, damping: 25 });
  const sy   = useSpring(y, { stiffness: 200, damping: 25 });
  const rotX = useTransform(sy, [-0.5, 0.5], [5, -5]);
  const rotY = useTransform(sx, [-0.5, 0.5], [-5, 5]);
  const [hov, setHov] = useState(false);

  return (
    <motion.div ref={ref}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d', perspective: 800 }}
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - r.left) / r.width  - 0.5);
        y.set((e.clientY - r.top)  / r.height - 0.5);
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { x.set(0); y.set(0); setHov(false); }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="card-hover overflow-hidden h-full flex flex-col">

      {/* Preview banner */}
      <div className={`h-36 bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} relative overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-4/5 card overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.06]">
              <span className="w-2 h-2 rounded-full bg-red-400/50" />
              <span className="w-2 h-2 rounded-full bg-yellow-400/50" />
              <span className="w-2 h-2 rounded-full bg-green-400/50" />
              <div className="ml-2 flex-1 h-2 bg-white/[0.05] rounded" />
            </div>
            <div className="p-3 space-y-1.5">
              <div className="h-1.5 bg-white/[0.07] rounded w-full" />
              <div className="h-1.5 bg-white/[0.07] rounded w-3/4" />
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {[0,1,2].map(i => <div key={i} className="h-5 bg-cyan-500/10 rounded border border-cyan-500/10" />)}
              </div>
            </div>
          </div>
        </div>
        {/* Hover overlay with links */}
        <motion.div animate={{ opacity: hov ? 1 : 0 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3">
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-2.5 card rounded-xl text-white hover:text-cyan-400 transition-colors"
              aria-label="GitHub repo">
              <GitFork className="w-4 h-4" />
            </a>
          )}
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-2.5 card rounded-xl text-white hover:text-cyan-400 transition-colors"
              aria-label="Live demo">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-white text-[15px] mb-2 line-clamp-2">{project.title}</h3>
        <p className="text-white/40 text-xs leading-relaxed mb-4 flex-1 line-clamp-3">{project.short_description}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.technologies.slice(0, 4).map(t => <span key={t} className="tech-badge">{t}</span>)}
          {project.technologies.length > 4 && <span className="tech-badge">+{project.technologies.length - 4}</span>}
        </div>
        {project.results && (
          <p className="text-green-400/70 text-xs mb-3 border-t border-white/[0.05] pt-3">
            {project.results}
          </p>
        )}
        <Link to={`/projects/${project.slug}`}
          className="flex items-center gap-1 text-xs text-white/30 hover:text-cyan-400 transition-colors mt-auto">
          Case study <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function Projects({ projects }: { projects: Project[] }) {
  return (
    <section id="projects" className="py-24 lg:py-32 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Work" title="Featured Projects"
          subtitle="Infrastructure and platform projects that show how I think about reliability, automation, and scale." />
        <StaggerList className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" delay={0.07}>
          {projects.map((p, i) => (
            <StaggerItem key={p.id} className="h-full">
              <ProjectCard project={p} index={i} />
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  );
}
