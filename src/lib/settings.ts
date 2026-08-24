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

export function getSectionSettings(): DashboardSectionConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SECTIONS;
    const parsed: DashboardSectionConfig[] = JSON.parse(raw);

    // Merge with DEFAULT_SECTIONS to handle any newly added sections gracefully
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

export function saveSectionSettings(sections: DashboardSectionConfig[]): void {
  try {
    const indexed = sections.map((s, idx) => ({ ...s, order: idx }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(indexed));
    // Dispatch a custom storage event so other tabs/components update reactively
    window.dispatchEvent(new CustomEvent('sections_config_updated', { detail: indexed }));
  } catch (err) {
    console.error('Failed to save section settings:', err);
  }
}

export function resetSectionSettings(): DashboardSectionConfig[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('sections_config_updated', { detail: DEFAULT_SECTIONS }));
  } catch (err) {
    console.error('Failed to reset section settings:', err);
  }
  return DEFAULT_SECTIONS;
}

export const TIMEOUT_OPTIONS = [
  { label: '5 Minutes', value: 5 },
  { label: '10 Minutes', value: 10 },
  { label: '15 Minutes', value: 15 },
  { label: '30 Minutes', value: 30 },
  { label: '1 Hour', value: 60 },
];

export function getSessionTimeoutMinutes(): number {
  try {
    const raw = localStorage.getItem(TIMEOUT_KEY);
    return raw ? parseInt(raw, 10) : 30; // default 30 minutes
  } catch {
    return 30;
  }
}

export function saveSessionTimeoutMinutes(minutes: number): void {
  try {
    localStorage.setItem(TIMEOUT_KEY, minutes.toString());
    window.dispatchEvent(new CustomEvent('session_timeout_updated', { detail: minutes }));
  } catch (err) {
    console.error('Failed to save session timeout:', err);
  }
}
