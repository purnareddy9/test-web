import { Calendar, ExternalLink, Award } from 'lucide-react';
import { SectionHeader, StaggerList, StaggerItem } from '../common/Motion';
import type { Certification } from '../../types';
import { formatDate } from '../../lib/utils';

const ISSUER_COLOR: Record<string, string> = {
  'Amazon Web Services':    'text-amber-400  border-amber-400/25  bg-amber-400/[0.08]',
  'CNCF / Linux Foundation':'text-blue-400   border-blue-400/25   bg-blue-400/[0.08]',
  'HashiCorp':               'text-purple-400 border-purple-400/25 bg-purple-400/[0.08]',
};
const issuerColor = (i: string) => ISSUER_COLOR[i] ?? 'text-cyan-400 border-cyan-400/25 bg-cyan-400/[0.08]';

function isExpired(d?: string) { return d ? new Date(d) < new Date() : false; }

export default function Certifications({ certifications }: { certifications: Certification[] }) {
  return (
    <section id="certifications" className="py-16 lg:py-20 border-t border-white/[0.05] scroll-mt-16">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Credentials" title="Certifications"
          subtitle="Industry certifications validating expertise in cloud and DevOps technologies." />

        <StaggerList className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.map(cert => {
            const expired = isExpired(cert.expiry_date);
            return (
              <StaggerItem key={cert.id}>
                <div className="card-hover p-5 h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Award className="w-4 h-4 text-cyan-400/70" />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${issuerColor(cert.issuer)}`}>
                      {cert.issuer.split(' ')[0]}
                    </span>
                  </div>
                  <h3 className="text-white font-medium text-sm leading-snug mb-2 flex-1">{cert.name}</h3>
                  <p className="text-white/30 text-xs mb-3">{cert.issuer}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                    <div className="flex items-center gap-1 text-white/25 text-xs">
                      <Calendar className="w-3 h-3" />
                      {formatDate(cert.issue_date)}
                      {cert.expiry_date && (
                        <span className={expired ? 'text-red-400/60' : 'text-white/25'}>
                          {' '}→ {formatDate(cert.expiry_date)}
                          {expired && ' (expired)'}
                        </span>
                      )}
                    </div>
                    {cert.credential_url && (
                      <a href={cert.credential_url} target="_blank" rel="noopener noreferrer"
                        className="text-white/25 hover:text-cyan-400 transition-colors"
                        aria-label={`Verify ${cert.name}`}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </div>
    </section>
  );
}
