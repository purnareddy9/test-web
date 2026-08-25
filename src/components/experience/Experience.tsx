import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { SectionHeader } from '../common/Motion';
import type { Experience } from '../../types';
import { getDateRange } from '../../lib/utils';

function ExperienceItem({ item, index }: { item: Experience; index: number }) {
  const ref  = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      className="relative pl-8 pb-12 last:pb-0">

      {/* Timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-white/[0.07]" />

      {/* Dot */}
      <div className={`absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full border-2 flex-shrink-0
        ${item.current ? 'bg-cyan-400 border-cyan-400' : 'bg-[#0a0a0a] border-white/20'}`} />

      <div className="card-hover p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-display font-semibold text-white text-lg">{item.role}</h3>
            <p className="text-cyan-400 text-sm font-medium">{item.company}</p>
            {item.current && (
              <span className="mt-1 inline-block px-2 py-0.5 rounded text-xs font-mono text-green-400 border border-green-500/25 bg-green-400/[0.08]">
                Current
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-white/30">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {getDateRange(item.start_date, item.end_date, item.current)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {item.location}
            </span>
          </div>
        </div>

        <p className="text-white/45 text-sm leading-relaxed mb-4">{item.description}</p>

        <ul className="space-y-1.5 mb-4">
          {item.achievements.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/55">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400/70 mt-0.5 flex-shrink-0" />
              {a}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/[0.05]">
          {item.technologies.map(t => <span key={t} className="tech-badge">{t}</span>)}
        </div>
      </div>
    </motion.div>
  );
}

export default function Experience({ experience }: { experience: Experience[] }) {
  return (
    <section id="experience" className="pt-16 pb-24 lg:pt-20 lg:pb-28 border-t border-white/[0.05] scroll-mt-36">
      <div className="max-w-4xl mx-auto px-6">
        <SectionHeader label="Experience" title="Career Timeline" />
        <div className="relative">
          {experience.map((item, i) => (
            <ExperienceItem key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
