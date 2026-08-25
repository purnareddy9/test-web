import { supabase, supabaseConfigured } from './supabase';

export type SectionId =
  | 'hero'
  | 'about'
  | 'skills'
  | 'devops_lifecycle'
  | 'workflow'
  | 'cicd'
  | 'terraform'
  | 'kubernetes'
  | 'pod_lifecycle'
  | 'monitoring'
  | 'experience'
  | 'projects'
  | 'certifications'
  | 'contact';

export interface DashboardSectionConfig {
  id: SectionId;
  name: string;
  category: 'Core' | 'Interactive Visualization' | 'Showcase' | 'Engagement';
  description: string;
  enabled: boolean;
  order: number;
  navLabel?: string;
}

export const DEFAULT_SECTIONS: DashboardSectionConfig[] = [
  {
    id: 'hero',
    name: 'Hero Banner',
    category: 'Core',
    description: 'Header introduction with animated roles typewriter, profile status, and quick CTA actions.',
    enabled: true,
    order: 0,
  },
  {
    id: 'about',
    name: 'About Me',
    category: 'Core',
    description: 'Personal narrative, infrastructure philosophy, availability info, and key career metrics.',
    enabled: true,
    order: 1,
    navLabel: 'About',
  },
  {
    id: 'skills',
    name: 'Technical Skills',
    category: 'Showcase',
    description: 'Interactive categorized skill matrix across Cloud, Containers, CI/CD, IaC, and Monitoring.',
    enabled: true,
    order: 2,
    navLabel: 'Skills',
  },
  {
    id: 'devops_lifecycle',
    name: 'DevOps Lifecycle',
    category: 'Interactive Visualization',
    description: 'Interactive circular DevOps workflow cycle highlighting tools and modern platform practices.',
    enabled: true,
    order: 3,
  },
  {
    id: 'workflow',
    name: 'Workflow Animation',
    category: 'Interactive Visualization',
    description: 'Real-time animated packet simulation from Git commit trigger to Kubernetes pod release.',
    enabled: true,
    order: 4,
    navLabel: 'DevOps Workflow',
  },
  {
    id: 'cicd',
    name: 'CI/CD Pipeline Simulation',
    category: 'Interactive Visualization',
    description: 'Live multi-stage build, automated test, security scan, and artifact deployment visualizer.',
    enabled: true,
    order: 5,
  },
  {
    id: 'terraform',
    name: 'Terraform / IaC Engine',
    category: 'Interactive Visualization',
    description: 'Dynamic infrastructure-as-code graph visualizer with plan/apply execution state tracking.',
    enabled: true,
    order: 6,
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes Architecture',
    category: 'Interactive Visualization',
    description: 'Interactive control plane, worker node topology, and automated pod self-healing simulation.',
    enabled: true,
    order: 7,
  },
  {
    id: 'pod_lifecycle',
    name: 'Pod Lifecycle Engine',
    category: 'Interactive Visualization',
    description: 'Deep dive into Kubernetes pod phases, container probes, and termination flow.',
    enabled: true,
    order: 8,
  },
  {
    id: 'monitoring',
    name: 'Observability & Monitoring',
    category: 'Interactive Visualization',
    description: 'Prometheus & Grafana dashboard visualizer with live metrics simulation and alert incident states.',
    enabled: true,
    order: 9,
  },
  {
    id: 'experience',
    name: 'Work Experience',
    category: 'Showcase',
    description: 'Career timeline, company roles, key infrastructure achievements, and tech stack tags.',
    enabled: true,
    order: 10,
    navLabel: 'Experience',
  },
  {
    id: 'projects',
    name: 'Featured Projects',
    category: 'Showcase',
    description: 'Production infrastructure case studies, architecture diagrams, and repository links.',
    enabled: true,
    order: 11,
    navLabel: 'Projects',
  },
  {
    id: 'certifications',
    name: 'Certifications & Credentials',
    category: 'Showcase',
    description: 'Industry cloud and DevOps credentials with verified issuer links and badges.',
    enabled: true,
    order: 12,
    navLabel: 'Certifications',
  },
  {
    id: 'contact',
    name: 'Contact & Inquiry',
    category: 'Engagement',
    description: 'Direct messaging channel, verified email/location info, and social connection endpoints.',
    enabled: true,
    order: 13,
    navLabel: 'Contact',
  },
];

const STORAGE_KEY = 'portfolio_sections_config';
const TIMEOUT_KEY = 'admin_session_timeout';

export const TIMEOUT_OPTIONS = [
  { label: '5 Minutes', value: 5 },
  { label: '10 Minutes', value: 10 },
  { label: '15 Minutes', value: 15 },
  { label: '30 Minutes (Recommended)', value: 30 },
  { label: '1 Hour', value: 60 },
  { label: '2 Hours', value: 120 },
  { label: '4 Hours', value: 240 },
  { label: '8 Hours', value: 480 },
];

export function getSectionSettings(): DashboardSectionConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SECTIONS;
    const parsed: DashboardSectionConfig[] = JSON.parse(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SECTIONS;

    const map = new Map(parsed.map(s => [s.id, s]));
    const merged = DEFAULT_SECTIONS.map((def) => {
      const existing = map.get(def.id);
      return existing
        ? { ...def, ...existing, name: def.name, description: def.description, category: def.category }
        : def;
    });

    return merged.sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_SECTIONS;
  }
}

export async function fetchRemoteSettings(): Promise<DashboardSectionConfig[]> {
  try {
    if (supabaseConfigured) {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        if (Array.isArray(data.sections) && data.sections.length > 0) {
          const map = new Map(data.sections.map((s: any) => [s.id, s]));
          const merged = DEFAULT_SECTIONS.map((def) => {
            const existing = map.get(def.id);
            return existing
              ? { ...def, ...existing, name: def.name, description: def.description, category: def.category }
              : def;
          });
          const sorted = merged.sort((a, b) => a.order - b.order);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
          if (typeof data.session_timeout === 'number') {
            localStorage.setItem(TIMEOUT_KEY, data.session_timeout.toString());
          }
          if (data.email_notifications_enabled !== undefined || data.admin_notification_email) {
            const notifSettings: NotificationSettings = {
              emailNotificationsEnabled: data.email_notifications_enabled !== false,
              adminNotificationEmail: data.admin_notification_email || '',
            };
            localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifSettings));
            window.dispatchEvent(new CustomEvent('notification_settings_updated', { detail: notifSettings }));
          }
          window.dispatchEvent(new CustomEvent('sections_config_updated', { detail: sorted }));
          return sorted;
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch remote site settings, falling back to local:', err);
  }
  return getSectionSettings();
}

export async function saveSectionSettings(sections: DashboardSectionConfig[]): Promise<void> {
  try {
    const indexed = sections.map((s, idx) => ({ ...s, order: idx }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(indexed));
    window.dispatchEvent(new CustomEvent('sections_config_updated', { detail: indexed }));

    if (supabaseConfigured) {
      const timeout = getSessionTimeoutMinutes();
      await supabase.from('site_settings').upsert({
        id: 'default',
        sections: indexed,
        session_timeout: timeout,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Failed to save section settings:', err);
  }
}

export async function resetSectionSettings(): Promise<DashboardSectionConfig[]> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('sections_config_updated', { detail: DEFAULT_SECTIONS }));

    if (supabaseConfigured) {
      await supabase.from('site_settings').upsert({
        id: 'default',
        sections: DEFAULT_SECTIONS,
        session_timeout: 30,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Failed to reset section settings:', err);
  }
  return DEFAULT_SECTIONS;
}

export function getSessionTimeoutMinutes(): number {
  try {
    const raw = localStorage.getItem(TIMEOUT_KEY);
    const val = raw ? parseInt(raw, 10) : 30;
    const valid = TIMEOUT_OPTIONS.some(o => o.value === val);
    return valid ? val : 30; // default to 30 if stale/invalid value
  } catch {
    return 30;
  }
}

export async function saveSessionTimeoutMinutes(minutes: number): Promise<void> {
  try {
    localStorage.setItem(TIMEOUT_KEY, minutes.toString());
    window.dispatchEvent(new CustomEvent('session_timeout_updated', { detail: minutes }));

    if (supabaseConfigured) {
      const sections = getSectionSettings();
      await supabase.from('site_settings').upsert({
        id: 'default',
        sections,
        session_timeout: minutes,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Failed to save session timeout:', err);
  }
}

export function getLocalSessionId(): string {
  let id = localStorage.getItem('admin_device_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    localStorage.setItem('admin_device_session_id', id);
  }
  return id;
}

export function setLocalSessionLoginTime(): void {
  localStorage.setItem('admin_login_timestamp', Date.now().toString());
  getLocalSessionId();
}

export async function revokeOtherSessions(): Promise<void> {
  const currentSessionId = getLocalSessionId();
  const now = new Date().toISOString();

  if (supabaseConfigured) {
    try {
      await supabase.auth.signOut({ scope: 'others' });
    } catch (e) {
      console.warn('Supabase signOut others warning:', e);
    }
    try {
      await supabase.from('site_settings').upsert({
        id: 'default',
        last_revoked_at: now,
        active_session_id: currentSessionId,
        updated_at: now,
      });
    } catch (e) {
      console.warn('Failed to record revocation timestamp in site_settings:', e);
    }
  }
}

export async function revokeAllSessions(): Promise<void> {
  const now = new Date().toISOString();
  localStorage.removeItem('local_demo_auth');
  localStorage.removeItem('admin_device_session_id');
  localStorage.removeItem('admin_login_timestamp');

  if (supabaseConfigured) {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (e) {
      console.warn('Supabase signOut global warning:', e);
    }
    try {
      await supabase.from('site_settings').upsert({
        id: 'default',
        last_revoked_at: now,
        active_session_id: null,
        updated_at: now,
      });
    } catch (e) {
      console.warn('Failed to update revocation in site_settings:', e);
    }
  }
}

// ── Notification Settings ──────────────────────────────────
export interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  adminNotificationEmail: string;
  emailApiKey?: string;
}

export const NOTIFICATION_STORAGE_KEY = 'portfolio_notification_settings';

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        emailNotificationsEnabled: parsed.emailNotificationsEnabled !== false,
        adminNotificationEmail: parsed.adminNotificationEmail || '',
        emailApiKey: parsed.emailApiKey || '',
      };
    }
  } catch {}
  return {
    emailNotificationsEnabled: true,
    adminNotificationEmail: '',
    emailApiKey: '',
  };
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('notification_settings_updated', { detail: settings }));

    if (supabaseConfigured) {
      const sections = getSectionSettings();
      const timeout = getSessionTimeoutMinutes();
      await supabase.from('site_settings').upsert({
        id: 'default',
        sections,
        session_timeout: timeout,
        email_notifications_enabled: settings.emailNotificationsEnabled,
        admin_notification_email: settings.adminNotificationEmail,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Failed to save notification settings:', err);
  }
}

export async function sendRealEmailNotification(params: {
  recipient?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isTest?: boolean;
}): Promise<{ success: boolean; message: string }> {
  const notifSettings = getNotificationSettings();
  const targetEmail = params.recipient || notifSettings.adminNotificationEmail;

  if (!targetEmail) {
    return { success: false, message: 'Please specify an Admin Notification Email first.' };
  }

  // 1. Direct Resend API (If key starts with 're_')
  if (notifSettings.emailApiKey && notifSettings.emailApiKey.trim().startsWith('re_')) {
    const key = notifSettings.emailApiKey.trim();
    try {
      const subjectLine = params.isTest
        ? `[Test Alert] DevOps Portfolio Notification System`
        : `[Portfolio Lead] ${params.subject || 'New Contact Message'}`;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          from: 'Portfolio Alert <onboarding@resend.dev>',
          to: [targetEmail],
          subject: subjectLine,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; rounded: 10px;">
              <h2 style="color: #06b6d4; margin-top: 0;">${subjectLine}</h2>
              <p><strong>Visitor Name:</strong> ${params.name}</p>
              <p><strong>Visitor Email:</strong> <a href="mailto:${params.email}">${params.email}</a></p>
              <p><strong>Subject:</strong> ${params.subject}</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0; white-space: pre-wrap;">${params.message}</p>
              </div>
              <p style="color: #64748b; font-size: 12px;">Sent via DevOps Portfolio Contact Form &bull; ${new Date().toLocaleString()}</p>
            </div>
          `,
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        return {
          success: true,
          message: `Email successfully delivered to ${targetEmail} via Resend!`,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Resend API error. Please verify your API key.',
        };
      }
    } catch (e: any) {
      console.warn('Resend dispatch error:', e);
      return { success: false, message: e.message || 'Network error connecting to Resend.' };
    }
  }

  // 2. Direct Web3Forms API (Standard UUID Access Key)
  if (notifSettings.emailApiKey && notifSettings.emailApiKey.trim().length > 5) {
    const key = notifSettings.emailApiKey.trim();
    try {
      const payload = {
        access_key: key,
        subject: params.isTest
          ? `[Test Alert] DevOps Portfolio Notification System`
          : `[Portfolio Lead] ${params.subject || 'New Contact Message'}`,
        from_name: `${params.name} (Portfolio Visitor)`,
        name: params.name,
        email: params.email,
        message: `Visitor Name: ${params.name}\nVisitor Email: ${params.email}\nSubject: ${params.subject}\n\nMessage:\n${params.message}\n\nSent: ${new Date().toLocaleString()}`,
      };

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: `Email successfully delivered to ${targetEmail} via Web3Forms!`,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Web3Forms error. Please verify your Access Key.',
        };
      }
    } catch (e: any) {
      console.warn('Web3Forms dispatch error:', e);
      return { success: false, message: e.message || 'Network error delivering email.' };
    }
  }

  // 3. Fallback to Supabase Edge Function (send-contact-email)
  if (supabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          test: params.isTest,
          recipient: targetEmail,
          name: params.name,
          email: params.email,
          subject: params.subject,
          message: params.message,
          timestamp: new Date().toISOString(),
        },
      });
      if (!error && data?.success) {
        return { success: true, message: `Email delivered to ${targetEmail} via Supabase Edge Function!` };
      }
    } catch (e) {
      console.warn('Edge function not configured:', e);
    }
  }

  return {
    success: false,
    message: 'To receive real emails in Gmail, please enter a free Web3Forms Access Key below.',
  };
}

export async function sendTestNotificationEmail(targetEmail: string): Promise<{ success: boolean; message: string }> {
  return sendRealEmailNotification({
    recipient: targetEmail,
    name: 'Admin Tester',
    email: 'admin@portfolio.internal',
    subject: 'DevOps Portfolio Test Notification',
    message: 'Hello! This is a test confirmation to verify that your portfolio contact alerts are working properly and delivering directly to your inbox.',
    isTest: true,
  });
}

