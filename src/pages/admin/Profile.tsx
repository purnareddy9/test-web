import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getProfile } from '../../lib/api';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { Profile } from '../../types';

const cfg = () => !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type ProfileFieldProps = {
  k: keyof Profile;
  l: string;
  type?: string;
  form: Partial<Profile>;
  change: (k: keyof Profile, v: string | number) => void;
};

function ProfileField({
  k,
  l,
  type = 'text',
  form,
  change,
}: ProfileFieldProps) {
  const value = (form as Record<string, unknown>)[k];

  return (
    <label className="block">
      {l}
      <input
        type={type}
        value={value == null ? '' : String(value)}
        onChange={e =>
          change(
            k,
            type === 'number' ? Number(e.target.value) : e.target.value
          )
        }
        className="form-input"
      />
    </label>
  );
}

export default function AdminProfile() {
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    getProfile().then(setForm);
  }, []);

  function change(k: keyof Profile, v: string | number) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      if (!cfg()) {
        setMsg({ type: 'ok', text: 'Saved locally (no Supabase).' });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update(form)
        .eq('id', form.id!);

      if (error) throw error;

      setMsg({ type: 'ok', text: 'Profile updated.' });
    } catch (e: unknown) {
      setMsg({
        type: 'err',
        text: e instanceof Error ? e.message : 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display font-semibold text-white text-xl mb-6">
        Profile
      </h1>

      <form onSubmit={save} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <ProfileField
            k="name"
            l="Name"
            form={form}
            change={change}
          />

          <ProfileField
            k="headline"
            l="Headline"
            form={form}
            change={change}
          />

          <ProfileField
            k="email"
            l="Email"
            type="email"
            form={form}
            change={change}
          />

          <ProfileField
            k="phone"
            l="Phone"
            form={form}
            change={change}
          />

          <ProfileField
            k="location"
            l="Location"
            form={form}
            change={change}
          />

          <ProfileField
            k="availability"
            l="Availability"
            form={form}
            change={change}
          />

          <ProfileField
            k="github_url"
            l="GitHub URL"
            form={form}
            change={change}
          />

          <ProfileField
            k="linkedin_url"
            l="LinkedIn URL"
            form={form}
            change={change}
          />

          <ProfileField
            k="website"
            l="Website"
            form={form}
            change={change}
          />

          <ProfileField
            k="years_experience"
            l="Years Experience"
            type="number"
            form={form}
            change={change}
          />

          <ProfileField
            k="projects_count"
            l="Projects Count"
            type="number"
            form={form}
            change={change}
          />

          <ProfileField
            k="deployments_count"
            l="Deployments Count"
            type="number"
            form={form}
            change={change}
          />

          <ProfileField
            k="certifications_count"
            l="Certifications Count"
            type="number"
            form={form}
            change={change}
          />

          <ProfileField
            k="uptime_target"
            l="Uptime Target"
            form={form}
            change={change}
          />
        </div>

        <div>
          <label className="block">
            Bio (use \n for new paragraph)

            <textarea
              rows={4}
              value={form.bio ?? ''}
              onChange={e => change('bio', e.target.value)}
              className="form-input resize-none"
            />
          </label>
        </div>

        {msg && (
          <p
            className={`flex items-center gap-1.5 text-xs ${
              msg.type === 'ok' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {msg.type === 'ok' ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {msg.text}
          </p>
        )}

        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
