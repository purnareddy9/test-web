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
  const { data } = await supabase.from('profiles').select('*').limit(1).single();
  return (data as Profile) ?? fallbackProfile;
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
