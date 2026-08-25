import { supabase, supabaseConfigured } from './supabase';
import { getNotificationSettings, sendRealEmailNotification } from './settings';
import {
  fallbackProfile, fallbackProjects, fallbackSkills, fallbackExperience,
  fallbackEducation, fallbackCertifications, fallbackTestimonials,
} from '../data/fallback';
import type { Profile, Project, Skill, Experience, Education, Certification, Testimonial, Message, Resume } from '../types';

const cfg = () => supabaseConfigured;

// ── Profile ──────────────────────────────────────────────
export async function getProfile(): Promise<Profile> {
  if (!cfg()) return fallbackProfile;

  const [
    { data: profileData },
    { data: projectsData },
    { data: experienceData },
    { data: certificationsData },
  ] = await Promise.all([
    supabase.from('profiles').select('*').limit(1).single(),
    supabase.from('projects').select('id'),
    supabase.from('experience').select('start_date, end_date, current'),
    supabase.from('certifications').select('id'),
  ]);

  if (!profileData) return fallbackProfile;

  // Calculate total experience from experience records.
  // Overlapping employment periods are counted only once.
  const periods = (experienceData ?? [])
    .map(item => {
      const start = new Date(item.start_date);
      const end = item.current || !item.end_date
        ? new Date()
        : new Date(item.end_date);

      return {
        start: start.getTime(),
        end: end.getTime(),
      };
    })
    .filter(period => !isNaN(period.start) && period.end > period.start)
    .sort((a, b) => a.start - b.start);

  let totalStart = 0;
  let totalEnd = 0;

  for (const period of periods) {
    if (totalStart === 0) {
      totalStart = period.start;
      totalEnd = period.end;
      continue;
    }

    if (period.start <= totalEnd) {
      totalEnd = Math.max(totalEnd, period.end);
    } else {
      totalStart += period.start;
      totalEnd += period.end;
    }
  }

  let totalMilliseconds = 0;

  if (periods.length > 0) {
    let currentStart = periods[0].start;
    let currentEnd = periods[0].end;

    for (let i = 1; i < periods.length; i++) {
      const period = periods[i];

      if (period.start <= currentEnd) {
        currentEnd = Math.max(currentEnd, period.end);
      } else {
        totalMilliseconds += currentEnd - currentStart;
        currentStart = period.start;
        currentEnd = period.end;
      }
    }

    totalMilliseconds += currentEnd - currentStart;
  }

  const yearsExperience = Math.floor(
    totalMilliseconds / (1000 * 60 * 60 * 24 * 365.25)
  );

  return {
    ...(profileData as Profile),

    // Automatically calculated from database
    years_experience: yearsExperience,
    projects_count: projectsData?.length ?? 0,
    certifications_count: certificationsData?.length ?? 0,

    // Still manually controlled from profiles table
    deployments_count: profileData.deployments_count,
    uptime_target: profileData.uptime_target,
  };
}

// ── Projects ─────────────────────────────────────────────
export async function getProjects(): Promise<Project[]> {
  if (!cfg()) return fallbackProjects;
  const { data } = await supabase.from('projects').select('*').order('display_order');
  return (data as Project[]) ?? fallbackProjects;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (!cfg()) return fallbackProjects.find(p => p.slug === slug) ?? null;
  const { data } = await supabase.from('projects').select('*').eq('slug', slug).single();
  return (data as Project) ?? null;
}

// ── Skills ───────────────────────────────────────────────
export async function getSkills(): Promise<Skill[]> {
  if (!cfg()) return fallbackSkills;
  const { data } = await supabase.from('skills').select('*').order('display_order');
  return (data as Skill[]) ?? fallbackSkills;
}

// ── Experience ───────────────────────────────────────────
export async function getExperience(): Promise<Experience[]> {
  if (!cfg()) return fallbackExperience;
  const { data } = await supabase.from('experience').select('*').order('display_order');
  return (data as Experience[]) ?? fallbackExperience;
}

// ── Education ─────────────────────────────────────────────
export async function getEducation(): Promise<Education[]> {
  if (!cfg()) return fallbackEducation;
  const { data } = await supabase.from('education').select('*').order('display_order');
  return (data as Education[]) ?? fallbackEducation;
}

// ── Certifications ────────────────────────────────────────
export async function getCertifications(): Promise<Certification[]> {
  if (!cfg()) return fallbackCertifications;
  const { data } = await supabase.from('certifications').select('*').order('display_order');
  return (data as Certification[]) ?? fallbackCertifications;
}

// ── Testimonials ──────────────────────────────────────────
export async function getTestimonials(): Promise<Testimonial[]> {
  if (!cfg()) return fallbackTestimonials;
  const { data } = await supabase.from('testimonials').select('*').eq('featured', true).order('display_order');
  return (data as Testimonial[]) ?? fallbackTestimonials;
}

// ── Messages ──────────────────────────────────────────────
export async function getMessages(): Promise<Message[]> {
  if (!cfg()) {
    const raw = localStorage.getItem('local_demo_messages');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return [];
  }
  const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
  return (data as Message[]) ?? [];
}

export async function getUnreadMessageCount(): Promise<number> {
  if (!cfg()) {
    const msgs = await getMessages();
    return msgs.filter(m => m.status === 'new').length;
  }
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new');
  return error ? 0 : (count ?? 0);
}

export async function markAllMessagesRead(): Promise<void> {
  if (!cfg()) {
    const current = await getMessages();
    const updated = current.map(m => (m.status === 'new' ? { ...m, status: 'read' as const } : m));
    localStorage.setItem('local_demo_messages', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('messages_updated', { detail: { unreadCount: 0 } }));
    return;
  }
  await supabase.from('messages').update({ status: 'read' }).eq('status', 'new');
  window.dispatchEvent(new CustomEvent('messages_updated', { detail: { unreadCount: 0 } }));
}

const BLOCKED_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net', 'test.com', 'sample.com',
  'invalid.com', 'fake.com', 'domain.com', 'tempmail.com', 'mailinator.com',
  '10minutemail.com', 'guerrillamail.com', 'throwawaymail.com', 'trashmail.com',
  'yopmail.com', 'sharklasers.com', 'dispostable.com', 'getairmail.com',
  'maildrop.cc', 'mailcatch.com', 'nada.ltd',
]);

const BLOCKED_LOCAL_PARTS = new Set([
  'test', 'fake', 'asdf', 'qwerty', '123456', 'admin', 'noreply', 'no-reply', 'null', 'undefined',
]);

export function validateContactPayload(form: { name?: string; email?: string; subject?: string; message?: string }): string | null {
  const name = form.name?.trim() || '';
  const email = form.email?.trim().toLowerCase() || '';
  const subject = form.subject?.trim() || '';
  const message = form.message?.trim() || '';

  if (name.length < 2) return 'Please provide your full name.';
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return 'Invalid email address.';

  const [localPart, domain] = email.split('@');
  if (!domain || BLOCKED_DOMAINS.has(domain) || domain.endsWith('.test') || domain.endsWith('.example') || domain.endsWith('.invalid')) {
    return 'Disposable or placeholder email domains are not permitted.';
  }
  if (BLOCKED_LOCAL_PARTS.has(localPart)) {
    return 'Please provide a legitimate personal or business email.';
  }

  if (subject.length < 3) return 'Subject must be at least 3 characters.';
  if (message.length < 20) return 'Message must be at least 20 characters.';

  return null;
}

export async function submitContact(form: { name: string; email: string; subject: string; message: string }): Promise<{ success: boolean; error?: string }> {
  // 1. Backend payload validation (Prevents DevTools inspect / bypass)
  const validationError = validateContactPayload(form);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const cleanForm = {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    subject: form.subject.trim(),
    message: form.message.trim(),
  };

  const newMsg: Message = {
    id: 'msg_' + Math.random().toString(36).substring(2, 9),
    ...cleanForm,
    status: 'new',
    created_at: new Date().toISOString(),
  };

  if (!cfg()) {
    await new Promise(r => setTimeout(r, 600));
    const current = await getMessages();
    const updated = [newMsg, ...current];
    localStorage.setItem('local_demo_messages', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('messages_updated', { detail: { newMsg, unreadCount: updated.filter(m => m.status === 'new').length } }));
  } else {
    const { error } = await supabase.from('messages').insert([{ ...cleanForm, status: 'new' }]);
    if (error) return { success: false, error: error.message };
    window.dispatchEvent(new CustomEvent('messages_updated', { detail: { newMsg, unreadCount: 1 } }));
  }

  // Email Notification Trigger (Runs reliably for both modes)
  try {
    const notifSettings = getNotificationSettings();
    if (notifSettings.emailNotificationsEnabled && notifSettings.adminNotificationEmail) {
      await sendRealEmailNotification({
        recipient: notifSettings.adminNotificationEmail,
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      });
    }
  } catch (err) {
    console.warn('Could not trigger notification email:', err);
  }

  return { success: true };
}

// ── Resume ────────────────────────────────────────────────
export async function getActiveResume(): Promise<Resume | null> {
  if (!cfg()) return null;
  const { data } = await supabase.from('resume').select('*').eq('active', true).limit(1).single();
  return (data as Resume) ?? null;
}

// ── Profile Views Analytics ───────────────────────────────
const VIEWS_STORAGE_KEY = 'portfolio_profile_views_count';

export async function getProfileViewsCount(): Promise<number> {
  if (!cfg()) {
    const raw = localStorage.getItem(VIEWS_STORAGE_KEY);
    return raw ? parseInt(raw, 10) : 142;
  }
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('views_count')
      .eq('id', 'default')
      .maybeSingle();
    if (data && typeof data.views_count === 'number') {
      return data.views_count;
    }
  } catch (e) {
    console.warn('Could not fetch views_count from site_settings:', e);
  }
  const raw = localStorage.getItem(VIEWS_STORAGE_KEY);
  return raw ? parseInt(raw, 10) : 142;
}

export async function incrementProfileViews(): Promise<number> {
  let currentViews = 142;
  const raw = localStorage.getItem(VIEWS_STORAGE_KEY);
  if (raw) {
    currentViews = parseInt(raw, 10);
  }
  const updatedViews = currentViews + 1;
  localStorage.setItem(VIEWS_STORAGE_KEY, updatedViews.toString());

  if (cfg()) {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('views_count')
        .eq('id', 'default')
        .maybeSingle();

      const dbViews = (data?.views_count || currentViews) + 1;
      await supabase.from('site_settings').upsert({
        id: 'default',
        views_count: dbViews,
        updated_at: new Date().toISOString(),
      });
      return dbViews;
    } catch (e) {
      console.warn('Could not increment views_count in site_settings:', e);
    }
  }

  return updatedViews;
}
