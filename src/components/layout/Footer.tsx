import { GitFork, Link2, Mail } from 'lucide-react';
import type { Profile } from '../../types';

export default function Footer({ profile }: { profile: Profile }) {
  return (
    <footer className="border-t border-white/[0.06] py-10 px-6 mt-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-white/30 text-sm font-mono">
          © {new Date().getFullYear()} {profile.name} — {profile.headline}
        </p>
        <div className="flex items-center gap-3">
          {profile.github_url && (
            <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
              className="p-2 text-white/30 hover:text-white transition-colors" aria-label="GitHub">
              <GitFork className="w-4 h-4" />
            </a>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="p-2 text-white/30 hover:text-white transition-colors" aria-label="LinkedIn">
              <Link2 className="w-4 h-4" />
            </a>
          )}
          {profile.email && (
            <a href={`mailto:${profile.email}`}
              className="p-2 text-white/30 hover:text-white transition-colors" aria-label="Email">
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
