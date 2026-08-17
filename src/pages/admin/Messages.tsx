import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Clock, CheckCircle, Archive, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getMessages } from '../../lib/api';
import type { Message } from '../../types';

const cfg = () => !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

const STATUS_STYLE: Record<Message['status'], string> = {
  new:      'text-cyan-400  border-cyan-400/25  bg-cyan-400/[0.08]',
  read:     'text-white/40  border-white/10     bg-white/[0.04]',
  replied:  'text-green-400 border-green-400/25 bg-green-400/[0.08]',
  archived: 'text-white/20  border-white/5      bg-transparent',
};

export default function AdminMessages() {
  const [items, setItems]   = useState<Message[]>([]);
  const [active, setActive] = useState<Message | null>(null);

  useEffect(() => { load(); }, []);
  async function load() { setItems(await getMessages()); }

  async function setStatus(id: string, status: Message['status']) {
    if (!cfg()) { setItems(prev => prev.map(m => m.id === id ? { ...m, status } : m)); return; }
    await supabase.from('messages').update({ status }).eq('id', id); await load();
  }

  async function del(id: string) {
    if (!confirm('Delete message?')) return;
    setActive(null);
    if (!cfg()) { setItems(x => x.filter(m => m.id !== id)); return; }
    await supabase.from('messages').delete().eq('id', id); await load();
  }

  const unread = items.filter(m => m.status === 'new').length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-display font-bold text-white">Messages</h1>
        {unread > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-400/15 text-cyan-400 border border-cyan-400/25">{unread} new</span>}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        {/* List */}
        <div className="space-y-2">
          {items.length === 0 && <p className="text-white/25 text-sm font-mono">No messages yet.</p>}
          {items.map(msg => (
            <button key={msg.id} onClick={() => { setActive(msg); if (msg.status === 'new' && cfg()) setStatus(msg.id, 'read'); }}
              className={`w-full text-left card p-4 hover:border-white/15 transition-all ${active?.id === msg.id ? 'border-cyan-500/30' : ''}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-medium text-white text-sm truncate">{msg.name}</p>
                <span className={`px-1.5 py-0.5 rounded text-xs font-mono border capitalize ${STATUS_STYLE[msg.status]}`}>{msg.status}</span>
              </div>
              <p className="text-white/40 text-xs truncate">{msg.subject}</p>
              <p className="text-white/20 text-xs mt-0.5">{new Date(msg.created_at).toLocaleDateString()}</p>
            </button>
          ))}
        </div>

        {/* Detail */}
        {active && (
          <motion.div key={active.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-white">{active.name}</h3>
                <a href={`mailto:${active.email}`} className="text-cyan-400 text-xs hover:underline">{active.email}</a>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setStatus(active.id, 'replied')} className="p-1.5 text-white/25 hover:text-green-400 transition-colors" title="Mark replied"><CheckCircle className="w-3.5 h-3.5" /></button>
                <button onClick={() => setStatus(active.id, 'archived')} className="p-1.5 text-white/25 hover:text-white/60 transition-colors" title="Archive"><Archive className="w-3.5 h-3.5" /></button>
                <button onClick={() => del(active.id)} className="p-1.5 text-white/25 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <p className="text-white/50 text-sm font-medium mb-3">{active.subject}</p>
            <p className="text-white/45 text-sm leading-relaxed">{active.message}</p>
            <div className="flex gap-3 mt-5 pt-4 border-t border-white/[0.05]">
              <a href={`mailto:${active.email}?subject=Re: ${active.subject}`}
                className="btn-primary text-xs"><Mail className="w-3.5 h-3.5" />Reply</a>
              <span className="flex items-center gap-1 text-xs text-white/25">
                <Clock className="w-3 h-3" />{new Date(active.created_at).toLocaleString()}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
