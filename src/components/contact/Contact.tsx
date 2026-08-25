import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Clock, GitFork, Link2, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { SectionHeader, FadeUp } from '../common/Motion';
import { submitContact } from '../../lib/api';
import type { Profile } from '../../types';

type Form   = { name: string; email: string; subject: string; message: string };
type Errors = Partial<Form>;
type Status = 'idle' | 'loading' | 'success' | 'error';

const BLOCKED_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'sample.com',
  'invalid.com',
  'fake.com',
  'domain.com',
  'tempmail.com',
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
  'sharklasers.com',
  'dispostable.com',
  'getairmail.com',
  'maildrop.cc',
  'mailcatch.com',
  'nada.ltd',
]);

const BLOCKED_LOCAL_PARTS = new Set([
  'test',
  'fake',
  'asdf',
  'qwerty',
  '123456',
  'admin',
  'noreply',
  'no-reply',
  'null',
  'undefined',
]);

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = 'Name is required.';
  else if (f.name.trim().length < 2) e.name = 'Please provide your full name.';

  const email = f.email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!email) {
    e.email = 'Email address is required.';
  } else if (!emailRegex.test(email)) {
    e.email = 'Please enter a valid email format (e.g. name@company.com or name@gmail.com).';
  } else {
    const [localPart, domain] = email.split('@');
    if (!domain || BLOCKED_DOMAINS.has(domain) || domain.endsWith('.test') || domain.endsWith('.example') || domain.endsWith('.invalid')) {
      e.email = 'Please provide a valid work, corporate, or personal email address (dummy/disposable domains are not allowed).';
    } else if (BLOCKED_LOCAL_PARTS.has(localPart)) {
      e.email = 'Please provide a legitimate contact email address.';
    }
  }

  if (!f.subject.trim()) e.subject = 'Subject is required.';
  else if (f.subject.trim().length < 3) e.subject = 'Subject must be at least 3 characters.';

  if (!f.message.trim()) e.message = 'Message is required.';
  else if (f.message.trim().length < 20) e.message = 'Message must be at least 20 characters.';

  return e;
}

export default function Contact({ profile }: { profile: Profile }) {
  const [form, setForm]         = useState<Form>({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors]     = useState<Errors>({});
  const [status, setStatus]     = useState<Status>('idle');
  const [serverErr, setServerErr] = useState('');

  function change(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name as keyof Errors]) setErrors(x => ({ ...x, [name]: undefined }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus('loading');
    const res = await submitContact(form);
    if (res.success) { setStatus('success'); setForm({ name: '', email: '', subject: '', message: '' }); }
    else { setStatus('error'); setServerErr(res.error ?? 'Something went wrong.'); }
  }

  const inputCls = (err?: string) =>
    `form-input ${err ? '!border-red-500/50 focus:!ring-red-500/30' : ''}`;

  return (
    <section id="contact" className="py-16 lg:py-20 border-t border-white/[0.05] scroll-mt-16">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader label="Contact" title="Let's Talk"
          subtitle="Have an opportunity or infrastructure challenge? I'd love to hear about it." />

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Info */}
          <FadeUp className="lg:col-span-2 space-y-4">
            {[
              { icon: Mail,   label: 'Email',        value: profile.email,        href: `mailto:${profile.email}` },
              { icon: MapPin, label: 'Location',      value: profile.location },
              { icon: Clock,  label: 'Availability',  value: profile.availability },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="card p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg border border-white/8 bg-cyan-400/[0.06] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-cyan-400/80" />
                </div>
                <div>
                  <p className="text-white/25 text-xs font-mono uppercase">{label}</p>
                  {href
                    ? <a href={href} className="text-white/70 text-sm hover:text-cyan-400 transition-colors">{value}</a>
                    : <p className="text-white/70 text-sm">{value}</p>}
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              {[{ icon: GitFork, label: 'GitHub',   href: profile.github_url },
                { icon: Link2,   label: 'LinkedIn', href: profile.linkedin_url },
              ].filter(s => s.href).map(({ icon: Icon, label, href }) => (
                <a key={label} href={href!} target="_blank" rel="noopener noreferrer"
                  className="p-2.5 card rounded-lg text-white/35 hover:text-cyan-400 hover:border-cyan-500/25 transition-all"
                  aria-label={label}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </FadeUp>

          {/* Form */}
          <FadeUp delay={0.1} className="lg:col-span-3">
            <div className="card p-6 sm:p-8">
              {status === 'success' ? (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mb-4">
                    <CheckCircle className="w-7 h-7 text-green-400" />
                  </div>
                  <h3 className="font-display font-semibold text-white text-lg mb-2">Message sent!</h3>
                  <p className="text-white/40 text-sm max-w-xs">Thanks for reaching out. I'll get back to you soon.</p>
                  <button onClick={() => setStatus('idle')} className="btn-outline mt-6 text-sm">Send another</button>
                </motion.div>
              ) : (
                <form onSubmit={submit} noValidate aria-label="Contact form">
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="c-name" className="block text-xs text-white/40 mb-1.5">Name *</label>
                      <input id="c-name" name="name" type="text" autoComplete="name" value={form.name} onChange={change}
                        className={inputCls(errors.name)} placeholder="Your name" aria-required />
                      {errors.name && <p role="alert" className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="c-email" className="block text-xs text-white/40 mb-1.5">Email *</label>
                      <input id="c-email" name="email" type="email" autoComplete="email" value={form.email} onChange={change}
                        className={inputCls(errors.email)} placeholder="you@example.com" aria-required />
                      {errors.email && <p role="alert" className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="c-subj" className="block text-xs text-white/40 mb-1.5">Subject *</label>
                    <input id="c-subj" name="subject" type="text" value={form.subject} onChange={change}
                      className={inputCls(errors.subject)} placeholder="DevOps role, cloud project, etc." aria-required />
                    {errors.subject && <p role="alert" className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.subject}</p>}
                  </div>
                  <div className="mb-6">
                    <label htmlFor="c-msg" className="block text-xs text-white/40 mb-1.5">Message *</label>
                    <textarea id="c-msg" name="message" rows={5} value={form.message} onChange={change}
                      className={`${inputCls(errors.message)} resize-none`}
                      placeholder="Tell me about your infrastructure challenge or opportunity…" aria-required />
                    {errors.message && <p role="alert" className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.message}</p>}
                  </div>
                  {status === 'error' && (
                    <p role="alert" className="text-red-400 text-sm mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />{serverErr}
                    </p>
                  )}
                  <button type="submit" disabled={status === 'loading'}
                    className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                    {status === 'loading'
                      ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />Sending…</>
                      : <><Send className="w-4 h-4" />Send Message</>}
                  </button>
                </form>
              )}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
