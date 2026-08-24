import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getExperience } from '../../lib/api';
import type { Experience } from '../../types';
import { getDateRange } from '../../lib/utils';
import DatePicker from '../../components/ui/DatePicker';

const cfg = () => !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
const EMPTY: Partial<Experience> = { company:'', role:'', location:'', start_date:'', end_date:'', current:false, description:'', achievements:[], technologies:[], display_order:0 };

export default function AdminExperience() {
  const [items, setItems] = useState<Experience[]>([]);
  const [modal, setModal] = useState<'add'|'edit'|null>(null);
  const [ed, setEd]       = useState<Partial<Experience>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState('');
  const [achStr, setAchStr] = useState('');
  const [techStr, setTechStr] = useState('');

  useEffect(() => { load(); }, []);
  async function load() { setItems(await getExperience()); }
  function openAdd() { setEd(EMPTY); setAchStr(''); setTechStr(''); setErr(''); setModal('add'); }
  function openEdit(e: Experience) { setEd(e); setAchStr(e.achievements.join('\n')); setTechStr(e.technologies.join(', ')); setErr(''); setModal('edit'); }
  function close() { setModal(null); setErr(''); }

  async function save() {
    if (!ed.company?.trim() || !ed.role?.trim()) { setErr('Company and role required.'); return; }
    setSaving(true); setErr('');
    const payload = {
      ...ed,
      end_date: ed.current ? null : ed.end_date || null,
      achievements: achStr.split('\n').map(a => a.trim()).filter(Boolean),
      technologies: techStr.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      if (!cfg()) {
        setItems(prev => modal === 'add'
          ? [{ ...payload, id: Date.now().toString(), created_at: '' } as unknown as Experience, ...prev]
          : prev.map(x => x.id === ed.id ? payload as unknown as Experience : x));
        close(); return;
      }
      if (modal === 'add') { const { error } = await supabase.from('experience').insert([payload]); if (error) throw error; }
      else { const { error } = await supabase.from('experience').update(payload).eq('id', ed.id!); if (error) throw error; }
      await load(); close();
    } catch(e: unknown) { setErr(e instanceof Error ? e.message : 'Save failed'); } finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete experience?')) return;
    if (!cfg()) { setItems(x => x.filter(e => e.id !== id)); return; }
    await supabase.from('experience').delete().eq('id', id); await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-white">Experience</h1>
        <button onClick={openAdd} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5" />Add</button>
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white text-sm">{item.role}</h3>
                  {item.current && <span className="text-green-400 text-xs font-mono border border-green-500/25 px-1.5 py-0.5 rounded">Current</span>}
                </div>
                <p className="text-cyan-400 text-xs font-semibold">{item.company}</p>
                <p className="text-white/30 text-xs mt-0.5">{getDateRange(item.start_date, item.end_date, item.current)}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(item)} className="p-1.5 text-white/25 hover:text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => del(item.id)}   className="p-1.5 text-white/25 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <ul className="mt-2 space-y-1">
              {item.achievements.slice(0, 2).map((a, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-white/35">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400/50 mt-0.5 flex-shrink-0" />{a}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="card w-full max-w-lg my-8 p-6">
              <h2 className="font-display font-bold text-white text-lg mb-5">{modal === 'add' ? 'Add' : 'Edit'} Experience</h2>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Company<span className="text-red-400"> *</span></label>
                  <input
                    value={ed.company ?? ''}
                    onChange={e => setEd(v => ({ ...v, company: e.target.value }))}
                    placeholder="e.g. Acme Corp"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Role<span className="text-red-400"> *</span></label>
                  <input
                    value={ed.role ?? ''}
                    onChange={e => setEd(v => ({ ...v, role: e.target.value }))}
                    placeholder="e.g. Senior DevOps Engineer"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Location</label>
                  <input
                    value={ed.location ?? ''}
                    onChange={e => setEd(v => ({ ...v, location: e.target.value }))}
                    placeholder="e.g. San Francisco, CA (or Remote)"
                    className="form-input"
                  />
                </div>

                {/* Modern Date Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DatePicker
                    label="Start Date"
                    value={ed.start_date ?? ''}
                    onChange={val => setEd(v => ({ ...v, start_date: val }))}
                    placeholder="Pick start date"
                  />

                  <DatePicker
                    label="End Date"
                    value={ed.end_date ?? ''}
                    disabled={!!ed.current}
                    onChange={val => setEd(v => ({ ...v, end_date: val }))}
                    placeholder={ed.current ? 'Present' : 'Pick end date'}
                    helperText={ed.current ? 'Disabled because current position is checked' : undefined}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="cur"
                    checked={!!ed.current}
                    onChange={e => {
                      const isCur = e.target.checked;
                      setEd(v => ({ ...v, current: isCur, end_date: isCur ? '' : v.end_date }));
                    }}
                    className="accent-cyan-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="cur" className="text-sm text-white/70 cursor-pointer select-none">
                    Currently working in this position
                  </label>
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Description</label>
                  <textarea rows={2} value={ed.description ?? ''} onChange={e => setEd(v => ({ ...v, description: e.target.value }))} className="form-input resize-none" />
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Achievements (one per line)</label>
                  <textarea rows={4} value={achStr} onChange={e => setAchStr(e.target.value)} className="form-input resize-none" />
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Technologies (comma-separated)</label>
                  <input value={techStr} onChange={e => setTechStr(e.target.value)} placeholder="Kubernetes, Terraform, AWS, Docker" className="form-input" />
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
