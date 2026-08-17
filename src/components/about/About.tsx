import { MapPin, Briefcase } from 'lucide-react';
import { SectionHeader, FadeUp, StaggerList, StaggerItem, Counter } from '../common/Motion';
import type { Profile } from '../../types';

export default function About({ profile }: { profile: Profile }) {
  const paras = profile.bio.split('\n').filter(Boolean);
  const stats = [
    { value: profile.years_experience,   suffix: '+', label: 'Years Experience' },
    { value: profile.projects_count,     suffix: '+', label: 'Projects Completed' },
    { value: profile.deployments_count,  suffix: '+', label: 'Deployments' },
    { value: 99.9,                        suffix: '%', label: 'Uptime Target' },
  ];

  return (
    <section id="about" className="py-24 lg:py-32" aria-labelledby="about-heading">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="About" title="About Me" />

        <div className="grid lg:grid-cols-2 gap-14 items-start mb-16">
          {/* Bio */}
          <FadeUp>
            <div className="space-y-4">
              {paras.map((p, i) => (
                <p key={i} className="text-white/55 leading-relaxed text-[15px]">{p}</p>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-7">
              <span className="flex items-center gap-2 text-sm text-white/40">
                <MapPin className="w-4 h-4 text-cyan-400/70" /> {profile.location}
              </span>
              <span className="flex items-center gap-2 text-sm text-white/40">
                <Briefcase className="w-4 h-4 text-cyan-400/70" /> {profile.availability}
              </span>
            </div>
          </FadeUp>

          {/* Philosophy */}
          <FadeUp delay={0.1}>
            <div className="card p-6 space-y-4">
              <h3 className="text-white font-display font-semibold text-sm tracking-wide uppercase text-cyan-400/80">Engineering Philosophy</h3>
              <ul className="space-y-3">
                {[
                  'Infrastructure as code — everything version controlled',
                  'Automate the toil — humans focus on high-value work',
                  'Observe everything — you can\'t improve what you can\'t measure',
                  'Shift security left — build it into the pipeline, not after',
                  'Fail fast, recover faster — design for resilience',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/50 text-sm">
                    <span className="text-cyan-400 font-mono text-xs mt-0.5 select-none">{'>'}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
        </div>

        {/* Stats */}
        <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <StaggerItem key={s.label}>
              <div className="card-hover p-6 text-center">
                <p className="text-3xl font-display font-bold text-cyan-400 mb-1">
                  <Counter value={Number(s.value)} suffix={s.suffix} />
                </p>
                <p className="text-white/40 text-xs font-medium">{s.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  );
}
