import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCertifications } from '../../lib/api';
import type { Certification } from '../../types';
import { formatDate } from '../../lib/utils';

const cfg = () => !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
const EMPTY: Partial<Certification> = { name:'', issuer:'', credential_id:'', issue_date:'', expiry_date:'', credential_url:'', display_order:0 };

export default function AdminCertifications() {
  const [items, setItems] = useState<Certification[]>([]);
  const [modal, setModal] = useState<'add'|'edit'|null>(null);
  const [ed, setEd]       = useState<Partial<Certification>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState('');

  useEffect(() => { load(); }, []);
  async function load() { setItems(await getCertifications()); }
  function openAdd() { setEd(EMPTY); setErr(''); setModal('add'); }
  function openEdit(c: Certification) { setEd(c); setErr(''); setModal('edit'); }
  function close() { setModal(null); setErr(''); }

  async function save() {
    if (!ed.name?.trim() || !ed.issuer?.trim()) { setErr('Name and issuer required.'); return; }
    setSaving(true); setErr('');
    try {
      if (!cfg()) {
        setItems(prev => modal === 'add' ? [{ ...ed, id: Date.now().toString(), created_at: '' } as Certification, ...prev] : prev.map(x => x.id === ed.id ? ed as Certification : x));
        close(); return;
      }
      if (modal === 'add') { const { error } = await supabase.from('certifications').insert([ed]); if (error) throw error; }
      else { const { error } = await supabase.from('certifications').update(ed).eq('id', ed.id!); if (error) throw error; }
      await load(); close();
    } catch(e: unknown) { setErr(e instanceof Error ? e.message : 'Save failed'); } finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete certification?')) return;
    if (!cfg()) { setItems(x => x.filter(c => c.id !== id)); return; }
    await supabase.from('certifications').delete().eq('id', id); await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-white">Certifications</h1>
        <button onClick={openAdd} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5" />Add</button>
      </div>
      <div className="space-y-2.5">
        {items.map(cert => (
          <div key={cert.id} className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{cert.name}</p>
              <p className="text-white/35 text-xs mt-0.5">{cert.issuer}</p>
              <p className="text-white/20 text-xs font-mono mt-0.5">{formatDate(cert.issue_date)}{cert.expiry_date && ` → ${formatDate(cert.expiry_date)}`}</p>
            </div>
            <button onClick={() => openEdit(cert)} className="p-1.5 text-white/25 hover:text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => del(cert.id)}   className="p-1.5 text-white/25 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="card w-full max-w-md my-8 p-6">
              <h2 className="font-display font-bold text-white text-lg mb-5">{modal === 'add' ? 'Add' : 'Edit'} Certification</h2>
              <div className="space-y-3.5">
                {[{k:'name',l:'Name',r:true},{k:'issuer',l:'Issuer',r:true},{k:'credential_id',l:'Credential ID'},{k:'issue_date',l:'Issue Date (YYYY-MM-DD)'},{k:'expiry_date',l:'Expiry Date'},{k:'credential_url',l:'Credential URL'}].map(({k,l,r}) => (
                  <div key={k}><label className="block text-xs text-white/40 mb-1.5">{l}{r&&<span className="text-red-400"> *</span>}</label><input value={(ed as Record<string,unknown>)[k] as string ?? ''} onChange={e => setEd(v => ({ ...v, [k]: e.target.value }))} className="form-input" /></div>
                ))}
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
