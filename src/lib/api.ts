import { supabase, supabaseConfigured } from './supabase';
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
  if (!cfg()) return [];
  const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
  return (data as Message[]) ?? [];
}

export async function submitContact(form: { name: string; email: string; subject: string; message: string }): Promise<{ success: boolean; error?: string }> {
  if (!cfg()) {
    await new Promise(r => setTimeout(r, 800));
    return { success: true };
  }
  const { error } = await supabase.from('messages').insert([{ ...form, status: 'new' }]);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Resume ────────────────────────────────────────────────
export async function getActiveResume(): Promise<Resume | null> {
  if (!cfg()) return null;
  const { data } = await supabase.from('resume').select('*').eq('active', true).limit(1).single();
  return (data as Resume) ?? null;
}
