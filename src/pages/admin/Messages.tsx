import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Clock, CheckCircle, Archive, Trash2, CheckCheck } from 'lucide-react';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { getMessages, markAllMessagesRead } from '../../lib/api';
import type { Message } from '../../types';

const STATUS_STYLE: Record<Message['status'], string> = {
  new:      'text-cyan-400  border-cyan-400/25  bg-cyan-400/[0.08]',
  read:     'text-white/40  border-white/10     bg-white/[0.04]',
  replied:  'text-green-400 border-green-400/25 bg-green-400/[0.08]',
  archived: 'text-white/20  border-white/5      bg-transparent',
};

export default function AdminMessages() {
  const [items, setItems] = useState<Message[]>([]);
  const [active, setActive] = useState<Message | null>(null);
  const activeIdRef = useRef<string | null>(null);

  // Keep activeIdRef in sync without causing re-renders
  activeIdRef.current = active?.id ?? null;

  const load = useCallback(async () => {
    try {
      const msgs = await getMessages();
      setItems(msgs);

      if (activeIdRef.current) {
        const found = msgs.find(m => m.id === activeIdRef.current);
        if (found) {
          setActive(prev => {
            if (!prev) return found;
            if (prev.id === found.id && prev.status === found.status) return prev;
            return found;
          });
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  useEffect(() => {
    load();

    const onMessagesUpdate = () => {
      load();
    };

    window.addEventListener('messages_updated', onMessagesUpdate);
    window.addEventListener('storage', onMessagesUpdate);

    let channel: any = null;
    if (supabaseConfigured) {
      channel = supabase
        .channel('admin_messages_page_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          () => {
            load();
          }
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener('messages_updated', onMessagesUpdate);
      window.removeEventListener('storage', onMessagesUpdate);
      if (channel) supabase.removeChannel(channel);
    };
  }, [load]);

  async function setStatus(id: string, status: Message['status']) {
    // Optimistic local state update
    setItems(prev => prev.map(m => (m.id === id ? { ...m, status } : m)));
    setActive(prev => (prev?.id === id ? { ...prev, status } : prev));

    if (!supabaseConfigured) {
      const raw = localStorage.getItem('local_demo_messages');
      if (raw) {
        try {
          const parsed: Message[] = JSON.parse(raw);
          const updated = parsed.map(m => (m.id === id ? { ...m, status } : m));
          localStorage.setItem('local_demo_messages', JSON.stringify(updated));
        } catch {}
      }
      window.dispatchEvent(new CustomEvent('messages_updated'));
      return;
    }

    try {
      await supabase.from('messages').update({ status }).eq('id', id);
      window.dispatchEvent(new CustomEvent('messages_updated'));
    } catch (err) {
      console.error('Failed to update message status:', err);
    }
  }

  async function handleMarkAllRead() {
    // Optimistic update
    setItems(prev => prev.map(m => (m.status === 'new' ? { ...m, status: 'read' as const } : m)));
    setActive(prev => (prev?.status === 'new' ? { ...prev, status: 'read' as const } : prev));

    try {
      await markAllMessagesRead();
    } catch (err) {
      console.error('Failed to mark all read:', err);
      load();
    }
  }

  async function del(id: string) {
    if (!confirm('Delete message?')) return;
    if (active?.id === id) setActive(null);

    // Optimistic update
    setItems(prev => prev.filter(m => m.id !== id));

    if (!supabaseConfigured) {
      const raw = localStorage.getItem('local_demo_messages');
      if (raw) {
        try {
          const parsed: Message[] = JSON.parse(raw);
          const updated = parsed.filter(m => m.id !== id);
          localStorage.setItem('local_demo_messages', JSON.stringify(updated));
        } catch {}
      }
      window.dispatchEvent(new CustomEvent('messages_updated'));
      return;
    }

    try {
      await supabase.from('messages').delete().eq('id', id);
      window.dispatchEvent(new CustomEvent('messages_updated'));
    } catch (err) {
      console.error('Failed to delete message:', err);
      load();
    }
  }

  const handleSelectMessage = (msg: Message) => {
    const isNew = msg.status === 'new';
    setActive(isNew ? { ...msg, status: 'read' } : msg);
    if (isNew) {
      setStatus(msg.id, 'read');
    }
  };

  const unread = items.filter(m => m.status === 'new').length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold text-white">Messages</h1>
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-400/15 text-cyan-400 border border-cyan-400/25">
              {unread} new
            </span>
          )}
        </div>

        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="self-start sm:self-auto btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 hover:text-cyan-400 hover:border-cyan-400/40 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Messages List */}
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-white/30 text-sm font-mono">No messages yet.</p>
            </div>
          )}
          {items.map(msg => {
            const isUnread = msg.status === 'new';
            const isSelected = active?.id === msg.id;
            return (
              <button
                key={msg.id}
                type="button"
                onClick={() => handleSelectMessage(msg)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-cyan-500/50 bg-[#151a24] shadow-md shadow-cyan-500/5'
                    : isUnread
                    ? 'border-cyan-500/30 bg-[#111622] hover:border-cyan-400/40'
                    : 'card hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                    )}
                    <p className={`text-sm truncate ${isUnread ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>
                      {msg.name}
                    </p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-mono border capitalize ${STATUS_STYLE[msg.status]}`}>
                    {msg.status}
                  </span>
                </div>
                <p className={`text-xs truncate ${isUnread ? 'text-cyan-200/80 font-medium' : 'text-white/40'}`}>
                  {msg.subject}
                </p>
                <p className="text-white/20 text-[11px] mt-1 font-mono">
                  {new Date(msg.created_at).toLocaleDateString()}
                </p>
              </button>
            );
          })}
        </div>

        {/* Message Detail */}
        {active ? (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-5 sm:p-6 min-w-0 overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-base truncate">{active.name}</h3>
                <a
                  href={`mailto:${active.email}`}
                  className="text-cyan-400 text-xs font-mono hover:underline block mt-0.5 break-all truncate"
                >
                  {active.email}
                </a>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setStatus(active.id, 'replied')}
                  className="p-1.5 text-white/30 hover:text-green-400 transition-colors cursor-pointer"
                  title="Mark replied"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(active.id, 'archived')}
                  className="p-1.5 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
                  title="Archive"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => del(active.id)}
                  className="p-1.5 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mb-4 pb-3 border-b border-white/[0.06] min-w-0">
              <p className="text-white/30 text-xs font-mono uppercase mb-1">Subject</p>
              <p className="text-white font-medium text-sm break-words">{active.subject}</p>
            </div>

            <div className="mb-6 min-w-0">
              <p className="text-white/30 text-xs font-mono uppercase mb-1">Message</p>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap break-words font-sans">{active.message}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.05]">
              <a
                href={`mailto:${active.email}?subject=Re: ${encodeURIComponent(active.subject)}`}
                className="btn-primary text-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                Reply via Email
              </a>
              <span className="flex items-center gap-1.5 text-xs text-white/35 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {new Date(active.created_at).toLocaleString()}
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="hidden lg:flex card p-8 items-center justify-center text-center">
            <p className="text-white/25 text-sm font-mono">Select a message from the list to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
