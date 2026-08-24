import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Star, StarOff, GitFork, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getProjects } from '../../lib/api';
import type { Project } from '../../types';

const cfg = () => !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
const EMPTY: Partial<Project> = { title:'', slug:'', short_description:'', technologies:[], github_url:'', live_url:'', featured:false, display_order:0 };

export default function AdminProjects() {
  const [items, setItems] = useState<Project[]>([]);
  const [modal, setModal] = useState<'add'|'edit'|null>(null);
  const [ed, setEd]       = useState<Partial<Project>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState('');
  const [techStr, setTechStr] = useState('');

  useEffect(() => { load(); }, []);
  async function load() { setItems(await getProjects()); }
  function openAdd() { setEd(EMPTY); setTechStr(''); setErr(''); setModal('add'); }
  function openEdit(p: Project) { setEd(p); setTechStr(p.technologies.join(', ')); setErr(''); setModal('edit'); }
  function close() { setModal(null); setErr(''); }

  async function save() {
    if (!ed.title?.trim()) { setErr('Title required.'); return; }
    setSaving(true); setErr('');
    const payload = { ...ed, technologies: techStr.split(',').map(t => t.trim()).filter(Boolean) };
    try {
      if (!cfg()) {
        setItems(prev => modal === 'add'
          ? [{ ...payload, id: Date.now().toString(), created_at: '', updated_at: '' } as Project, ...prev]
          : prev.map(x => x.id === ed.id ? { ...x, ...payload } as Project : x));
        close(); return;
      }
      if (modal === 'add') { const { error } = await supabase.from('projects').insert([payload]); if (error) throw error; }
      else { const { error } = await supabase.from('projects').update(payload).eq('id', ed.id!); if (error) throw error; }
      await load(); close();
    } catch(e: unknown) { setErr(e instanceof Error ? e.message : 'Save failed'); } finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete project?')) return;
    if (!cfg()) { setItems(x => x.filter(p => p.id !== id)); return; }
    await supabase.from('projects').delete().eq('id', id); await load();
  }

  async function toggleFeat(p: Project) {
    const updated = { ...p, featured: !p.featured };
    if (!cfg()) { setItems(prev => prev.map(x => x.id === p.id ? updated : x)); return; }
    await supabase.from('projects').update({ featured: !p.featured }).eq('id', p.id); await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-white">Projects</h1>
        <button onClick={openAdd} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5" />Add</button>
      </div>
      <div className="space-y-2.5">
        {items.map(p => (
          <div key={p.id} className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white text-sm truncate">{p.title}</h3>
                {p.featured && <span className="text-amber-400 text-xs font-mono">featured</span>}
              </div>
              <p className="text-white/30 text-xs truncate mt-0.5">{p.short_description}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {p.technologies.slice(0, 4).map(t => <span key={t} className="tech-badge">{t}</span>)}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => toggleFeat(p)} className="p-1.5 text-white/25 hover:text-amber-400 transition-colors">
                {p.featured ? <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> : <StarOff className="w-3.5 h-3.5" />}
              </button>
              {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="p-1.5 text-white/25 hover:text-white"><GitFork className="w-3.5 h-3.5" /></a>}
              {p.live_url   && <a href={p.live_url}   target="_blank" rel="noreferrer" className="p-1.5 text-white/25 hover:text-white"><ExternalLink className="w-3.5 h-3.5" /></a>}
              <button onClick={() => openEdit(p)} className="p-1.5 text-white/25 hover:text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => del(p.id)} className="p-1.5 text-white/25 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="card w-full max-w-lg my-8 p-6">
              <h2 className="font-display font-bold text-white text-lg mb-5">{modal === 'add' ? 'Add' : 'Edit'} Project</h2>
              <div className="space-y-3.5">
                {[
                  { k: 'title', l: 'Title', r: true },
                  { k: 'slug', l: 'Slug (URL)' },
                  { k: 'short_description', l: 'Short Description' },
                ].map(({ k, l, r }) => (
                  <div key={k}>
                    <label className="block text-xs text-white/40 mb-1.5">{l}{r && <span className="text-red-400"> *</span>}</label>
                    <input
                      value={(ed as Record<string, unknown>)[k] as string ?? ''}
                      onChange={e => setEd(v => ({ ...v, [k]: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Technologies (comma-separated)</label>
                  <input type="text" value={techStr} onChange={e => setTechStr(e.target.value)} className="form-input" placeholder="Docker, Kubernetes, Terraform" />
                </div>
                {[
                  { k: 'github_url', l: 'GitHub URL' },
                  { k: 'live_url', l: 'Live URL' },
                ].map(({ k, l }) => (
                  <div key={k}>
                    <label className="block text-xs text-white/40 mb-1.5">{l}</label>
                    <input
                      value={(ed as Record<string, unknown>)[k] as string ?? ''}
                      onChange={e => setEd(v => ({ ...v, [k]: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={ed.display_order ?? 0}
                    onChange={e => setEd(v => ({ ...v, display_order: +e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="feat" checked={!!ed.featured} onChange={e => setEd(v => ({ ...v, featured: e.target.checked }))} className="accent-cyan-500 w-4 h-4" />
                  <label htmlFor="feat" className="text-sm text-white/55">Featured</label>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Results</label>
                  <textarea rows={2} value={ed.results ?? ''} onChange={e => setEd(v => ({ ...v, results: e.target.value }))} className="form-input resize-none" />
                </div>
              </div>
              {err && <p className="text-red-400 text-xs mt-3 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{err}</p>}
              <div className="flex gap-3 mt-5">
                <button onClick={close} className="btn-outline flex-1 justify-center text-sm">Cancel</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center text-sm">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
