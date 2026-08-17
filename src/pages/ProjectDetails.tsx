import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, GitFork, ExternalLink } from 'lucide-react';
import { getProjectBySlug } from '../lib/api';
import type { Project } from '../types';
import { fallbackProjects } from '../data/fallback';
import Navbar from '../components/nav/Navbar';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">{title}</h2>
      <div className="text-white/55 text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

export default function ProjectDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getProjectBySlug(slug).then(p => {
      setProject(p ?? fallbackProjects.find(x => x.slug === slug) ?? null);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <p className="text-white/40 font-mono text-sm">Project not found.</p>
      <Link to="/" className="btn-outline text-sm"><ArrowLeft className="w-4 h-4" /> Back home</Link>
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/#projects" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" /> Back to projects
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div>
                <p className="section-label mb-2">Case Study</p>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">{project.title}</h1>
              </div>
              <div className="flex gap-3">
                {project.github_url && (
                  <a href={project.github_url} target="_blank" rel="noreferrer" className="btn-outline text-sm">
                    <GitFork className="w-4 h-4" /> GitHub
                  </a>
                )}
                {project.live_url && (
                  <a href={project.live_url} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                    <ExternalLink className="w-4 h-4" /> Live Demo
                  </a>
                )}
              </div>
            </div>

            {/* Technologies */}
            <div className="flex flex-wrap gap-2 mb-10">
              {project.technologies.map(t => <span key={t} className="tech-badge">{t}</span>)}
            </div>

            <div className="card p-6 sm:p-8 space-y-2 mb-8">
              <p className="text-white/65 text-base leading-relaxed">{project.long_description ?? project.short_description}</p>
            </div>

            {project.problem   && <Section title="Problem">{project.problem}</Section>}
            {project.solution  && <Section title="Solution">{project.solution}</Section>}
            {project.architecture && <Section title="Architecture">{project.architecture}</Section>}
            {project.infrastructure && <Section title="Infrastructure">{project.infrastructure}</Section>}
            {project.cicd      && <Section title="CI/CD">{project.cicd}</Section>}
            {project.monitoring && <Section title="Monitoring">{project.monitoring}</Section>}
            {project.security  && <Section title="Security">{project.security}</Section>}

            {project.results && (
              <div className="card p-5 border-l-2 border-green-500/40">
                <p className="text-xs font-mono text-green-400 uppercase tracking-widest mb-2">Results</p>
                <p className="text-white/65 text-[15px] leading-relaxed">{project.results}</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </>
  );
}
