import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getProfile } from '../../lib/api';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { Profile } from '../../types';

const cfg = () => !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function AdminProfile() {
  const [form, setForm]   = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]     = useState<{ type: 'ok'|'err'; text: string } | null>(null);

  useEffect(() => { getProfile().then(setForm); }, []);

  function change(k: keyof Profile, v: string | number) { setForm(f => ({ ...f, [k]: v })); }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      if (!cfg()) { setMsg({ type: 'ok', text: 'Saved locally (no Supabase).' }); setSaving(false); return; }
      const { error } = await supabase.from('profiles').update(form).eq('id', form.id!);
      if (error) throw error;
      setMsg({ type: 'ok', text: 'Profile updated.' });
    } catch(e: unknown) { setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Save failed' }); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-white mb-6">Profile</h1>
      <form onSubmit={save} className="card p-6 max-w-2xl space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { k: 'name', l: 'Full Name', ph: 'e.g. Poorna' },
            { k: 'headline', l: 'Headline / Animated Roles (comma-separated)', ph: 'e.g. DevOps Engineer, Cloud Engineer, Platform Engineer' },
            { k: 'email', l: 'Email', type: 'email', ph: 'e.g. contact@example.com' },
            { k: 'location', l: 'Location', ph: 'e.g. San Francisco, CA' },
            { k: 'github_url', l: 'GitHub URL', ph: 'https://github.com/...' },
            { k: 'linkedin_url', l: 'LinkedIn URL', ph: 'https://linkedin.com/in/...' },
            { k: 'years_experience', l: 'Years Experience', type: 'number' },
            { k: 'projects_count', l: 'Projects Count', type: 'number' },
            { k: 'deployments_count', l: 'Deployments Count', type: 'number' },
            { k: 'certifications_count', l: 'Certifications Count', type: 'number' },
          ].map(({ k, l, type = 'text', ph }) => (
            <div key={k}>
              <label className="block text-xs text-white/40 mb-1.5">{l}</label>
              <input
                type={type}
                placeholder={ph}
                value={(form as Record<string, unknown>)[k] as string ?? ''}
                onChange={e => change(k as keyof Profile, type === 'number' ? +e.target.value : e.target.value)}
                className="form-input"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Bio (use \n for new paragraph)</label>
          <textarea rows={4} value={form.bio ?? ''} onChange={e => change('bio', e.target.value)} className="form-input resize-none" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Availability</label>
          <input
            type="text"
            value={form.availability ?? ''}
            onChange={e => change('availability', e.target.value)}
            className="form-input"
          />
        </div>
        {msg && (
          <p className={`flex items-center gap-1.5 text-xs ${msg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
            {msg.type === 'ok' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {msg.text}
          </p>
        )}
        <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
