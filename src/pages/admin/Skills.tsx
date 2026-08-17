import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getSkills } from '../../lib/api';
import type { Skill } from '../../types';

const cfg = () => !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
const CATS: Skill['category'][] = ['cloud','containers','cicd','iac','monitoring','scripting','vcs'];
const LEVELS: Skill['level'][] = ['expert','advanced','intermediate','familiar'];
const EMPTY: Partial<Skill> = { name:'', category:'cloud', proficiency:80, level:'advanced', years_experience:1, display_order:0 };

export default function AdminSkills() {
  const [items, setItems] = useState<Skill[]>([]);
  const [modal, setModal] = useState<'add'|'edit'|null>(null);
  const [ed, setEd]       = useState<Partial<Skill>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState('');

  useEffect(() => { load(); }, []);
  async function load() { setItems(await getSkills()); }
  function openAdd() { setEd(EMPTY); setErr(''); setModal('add'); }
  function openEdit(s: Skill) { setEd(s); setErr(''); setModal('edit'); }
  function close() { setModal(null); setErr(''); }

  async function save() {
    if (!ed.name?.trim()) { setErr('Name required.'); return; }
    setSaving(true); setErr('');
    try {
      if (!cfg()) {
        setItems(prev => modal === 'add'
          ? [{ ...ed, id: Date.now().toString(), created_at: '' } as Skill, ...prev]
          : prev.map(x => x.id === ed.id ? ed as Skill : x));
        close(); return;
      }
      if (modal === 'add') { const { error } = await supabase.from('skills').insert([ed]); if (error) throw error; }
      else { const { error } = await supabase.from('skills').update(ed).eq('id', ed.id!); if (error) throw error; }
      await load(); close();
    } catch(e: unknown) { setErr(e instanceof Error ? e.message : 'Save failed'); } finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete skill?')) return;
    if (!cfg()) { setItems(x => x.filter(s => s.id !== id)); return; }
    await supabase.from('skills').delete().eq('id', id); await load();
  }

  const grouped = CATS.reduce((acc, c) => ({ ...acc, [c]: items.filter(s => s.category === c) }), {} as Record<string, Skill[]>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-white">Skills</h1>
        <button onClick={openAdd} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5" />Add</button>
      </div>
      {CATS.map(cat => grouped[cat]?.length > 0 && (
        <div key={cat} className="mb-7">
          <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-3">{cat}</p>
          <div className="space-y-2">
            {grouped[cat].map(skill => (
              <div key={skill.id} className="card p-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{skill.name}</span>
                    <span className="text-white/25 text-xs font-mono capitalize">{skill.level}</span>
                    {skill.years_experience && <span className="text-white/20 text-xs font-mono">{skill.years_experience}y</span>}
                  </div>
                  <div className="w-full h-1 bg-white/[0.07] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${skill.proficiency}%` }} />
                  </div>
                </div>
                <span className="text-white/30 text-xs font-mono w-8 text-right">{skill.proficiency}%</span>
                <button onClick={() => openEdit(skill)} className="p-1.5 text-white/20 hover:text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => del(skill.id)}   className="p-1.5 text-white/20 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="card w-full max-w-sm my-8 p-6">
              <h2 className="font-display font-bold text-white text-lg mb-5">{modal === 'add' ? 'Add' : 'Edit'} Skill</h2>
              <div className="space-y-3.5">
                <div><label className="block text-xs text-white/40 mb-1.5">Name *</label><input value={ed.name ?? ''} onChange={e => setEd(v => ({ ...v, name: e.target.value }))} className="form-input" /></div>
                <div><label className="block text-xs text-white/40 mb-1.5">Category</label>
                  <select value={ed.category ?? 'cloud'} onChange={e => setEd(v => ({ ...v, category: e.target.value as Skill['category'] }))} className="form-input">
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs text-white/40 mb-1.5">Level</label>
                  <select value={ed.level ?? 'advanced'} onChange={e => setEd(v => ({ ...v, level: e.target.value as Skill['level'] }))} className="form-input">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs text-white/40 mb-1.5">Proficiency: {ed.proficiency}%</label>
                  <input type="range" min={0} max={100} value={ed.proficiency ?? 80} onChange={e => setEd(v => ({ ...v, proficiency: +e.target.value }))} className="w-full accent-cyan-400" />
                </div>
                <div><label className="block text-xs text-white/40 mb-1.5">Years Experience</label><input type="number" value={ed.years_experience ?? 1} onChange={e => setEd(v => ({ ...v, years_experience: +e.target.value }))} className="form-input" /></div>
                <div><label className="block text-xs text-white/40 mb-1.5">Display Order</label><input type="number" value={ed.display_order ?? 0} onChange={e => setEd(v => ({ ...v, display_order: +e.target.value }))} className="form-input" /></div>
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
