// ── Profile ──────────────────────────────────────────────
export interface Profile {
  id: string;
  name: string;
  headline: string;
  bio: string;
  location: string;
  email: string;
  phone?: string;
  github_url?: string;
  linkedin_url?: string;
  website?: string;
  avatar_url?: string;
  availability: string;
  years_experience: number;
  projects_count: number;
  deployments_count: number;
  uptime_target: string;
  certifications_count: number;
  created_at: string;
  updated_at: string;
}

// ── Project ──────────────────────────────────────────────
export interface Project {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  long_description?: string;
  image_url?: string;
  architecture_image?: string;
  technologies: string[];
  github_url?: string;
  live_url?: string;
  featured: boolean;
  display_order: number;
  problem?: string;
  solution?: string;
  architecture?: string;
  infrastructure?: string;
  cicd?: string;
  monitoring?: string;
  security?: string;
  results?: string;
  created_at: string;
  updated_at: string;
}

// ── Skill ────────────────────────────────────────────────
export interface Skill {
  id: string;
  name: string;
  category: 'cloud' | 'containers' | 'cicd' | 'iac' | 'monitoring' | 'scripting' | 'vcs';
  proficiency: number;
  level: 'expert' | 'advanced' | 'intermediate' | 'familiar';
  years_experience?: number;
  display_order: number;
  created_at: string;
}

// ── Experience ───────────────────────────────────────────
export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description: string;
  achievements: string[];
  technologies: string[];
  display_order: number;
  created_at: string;
}

// ── Education ────────────────────────────────────────────
export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description?: string;
  display_order: number;
  created_at: string;
}

// ── Certification ────────────────────────────────────────
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  credential_id?: string;
  issue_date: string;
  expiry_date?: string;
  credential_url?: string;
  certificate_image?: string;
  display_order: number;
  created_at: string;
}

// ── Testimonial ──────────────────────────────────────────
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar_url?: string;
  content: string;
  rating: number;
  featured: boolean;
  display_order: number;
  created_at: string;
}

// ── Message ──────────────────────────────────────────────
export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
}

// ── Resume ───────────────────────────────────────────────
export interface Resume {
  id: string;
  file_url: string;
  file_name: string;
  active: boolean;
  created_at: string;
}
