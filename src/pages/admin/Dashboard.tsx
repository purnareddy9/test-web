import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Wrench, Briefcase, Award, MessageSquare, FileText } from 'lucide-react';
import { getProjects, getSkills, getExperience, getCertifications, getMessages } from '../../lib/api';

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ projects: 0, skills: 0, experience: 0, certs: 0, messages: 0 });

  useEffect(() => {
    Promise.all([getProjects(), getSkills(), getExperience(), getCertifications(), getMessages()])
      .then(([p, s, e, c, m]) => setCounts({ projects: p.length, skills: s.length, experience: e.length, certs: c.length, messages: m.length }));
  }, []);

  const tiles = [
    { icon: FolderKanban, label: 'Projects',       count: counts.projects,   href: '/admin/projects' },
    { icon: Wrench,       label: 'Skills',          count: counts.skills,     href: '/admin/skills' },
    { icon: Briefcase,    label: 'Experience',      count: counts.experience, href: '/admin/experience' },
    { icon: Award,        label: 'Certifications',  count: counts.certs,      href: '/admin/certifications' },
    { icon: MessageSquare,label: 'Messages',        count: counts.messages,   href: '/admin/messages' },
    { icon: FileText,     label: 'Resume',          count: 0,                 href: '/admin/resume' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-white mb-2">Dashboard</h1>
      <p className="text-white/35 text-sm mb-8">Manage your portfolio content.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {tiles.map(({ icon: Icon, label, count, href }) => (
          <Link key={href} to={href} className="card-hover p-5 flex flex-col gap-3">
            <Icon className="w-5 h-5 text-cyan-400/70" />
            <div>
              <p className="text-xl font-display font-bold text-white">{count}</p>
              <p className="text-white/40 text-xs">{label}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-8 card p-5">
        <p className="text-white/30 text-xs font-mono mb-3">QUICK LINKS</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/" target="_blank" className="btn-outline text-xs py-1.5 px-3">View Portfolio ↗</Link>
          <Link to="/admin/profile" className="btn-outline text-xs py-1.5 px-3">Edit Profile</Link>
        </div>
      </div>
    </div>
  );
}
