import { useEffect, useState } from 'react';
import { FileText, Upload, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Resume } from '../../types';

const cfg = () => !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function AdminResume() {
  const [resume, setResume]     = useState<Resume | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr]           = useState('');
  const [ok, setOk]             = useState('');

  useEffect(() => { load(); }, []);
  async function load() {
    if (!cfg()) return;
    const { data } = await supabase.from('resume').select('*').eq('active', true).limit(1).single();
    setResume(data as Resume ?? null);
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !cfg()) { setErr('Supabase not configured.'); return; }
    if (file.type !== 'application/pdf') { setErr('Only PDF files allowed.'); return; }
    setUploading(true); setErr(''); setOk('');
    const path = `resume/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('portfolio').upload(path, file, { upsert: true });
    if (upErr) { setErr(upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(path);
    await supabase.from('resume').update({ active: false }).neq('id', '');
    await supabase.from('resume').insert([{ file_url: publicUrl, file_name: file.name, active: true }]);
    await load();
    setOk('Resume uploaded successfully!');
    setUploading(false);
  }

  async function del() {
    if (!resume || !confirm('Delete active resume?')) return;
    if (!cfg()) return;
    await supabase.from('resume').delete().eq('id', resume.id);
    setResume(null); setOk('Deleted.');
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-white mb-6">Resume</h1>
      <div className="card p-6 max-w-lg">
        {resume ? (
          <div className="mb-6 p-4 border border-white/10 rounded-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-white text-sm font-medium">{resume.file_name}</p>
                <p className="text-white/30 text-xs">Active</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={resume.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-white/30 hover:text-cyan-400"><ExternalLink className="w-4 h-4" /></a>
              <button onClick={del} className="p-1.5 text-white/30 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <p className="text-white/30 text-sm mb-6 font-mono">No active resume uploaded.</p>
        )}
        <label className={`flex flex-col items-center gap-3 p-6 border border-dashed border-white/15 rounded-lg cursor-pointer hover:border-cyan-500/30 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload className="w-6 h-6 text-white/30" />
          <span className="text-white/45 text-sm">{uploading ? 'Uploading…' : 'Click to upload PDF resume'}</span>
          <input type="file" accept=".pdf" className="hidden" onChange={upload} />
        </label>
        {err && <p className="text-red-400 text-xs mt-3 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{err}</p>}
        {ok  && <p className="text-green-400 text-xs mt-3">{ok}</p>}
        {!cfg() && <p className="text-white/25 text-xs mt-4 font-mono">Connect Supabase to enable file uploads.</p>}
      </div>
    </div>
  );
}
