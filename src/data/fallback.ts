import type {
  Profile, Project, Skill, Experience, Education,
  Certification, Testimonial,
} from '../types';

export const fallbackProfile: Profile = {
  id: '1',
  name: 'Poorna',
  headline: 'Senior DevOps & Cloud Engineer',
  bio: "I'm a senior DevOps engineer with 5+ years of experience designing and operating production infrastructure. I specialise in Kubernetes platforms, CI/CD automation, and cloud infrastructure with Terraform.\n\nI believe infrastructure should be reliable by design, automated by default, and observable at every layer. I work closely with product teams to reduce friction in the delivery process — so they can ship fast without sacrificing stability.",
  location: 'Seattle, WA',
  email: 'alex@alexchen.dev',
  github_url: 'https://github.com/alexchen',
  linkedin_url: 'https://linkedin.com/in/alexchen',
  availability: 'Open to new opportunities',
  years_experience: 5,
  projects_count: 30,
  deployments_count: 200,
  uptime_target: '99.9%',
  certifications_count: 5,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const fallbackProjects: Project[] = [
  {
    id: '1', title: 'Production Kubernetes Platform', slug: 'kubernetes-platform',
    short_description: 'Multi-region EKS cluster serving 50+ microservices with GitOps, auto-scaling, and zero-downtime deployments.',
    long_description: 'Designed and built a production-grade multi-region Kubernetes platform on AWS EKS managed with Terraform and ArgoCD. Handles 200k+ requests/day with automated failover.',
    technologies: ['Kubernetes', 'EKS', 'ArgoCD', 'Helm', 'Terraform', 'Prometheus'],
    github_url: 'https://github.com/alexchen/k8s-platform',
    featured: true, display_order: 1,
    problem: 'Engineering teams deployed manually to EC2 with 2-hour release cycles and frequent rollback failures.',
    solution: 'Built a GitOps-driven Kubernetes platform with Helm charts, ArgoCD sync, and automated canary deployments.',
    results: 'Release cycle reduced from 2h to 12 minutes. Zero production incidents from deployments in 8 months.',
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2', title: 'AWS Infrastructure with Terraform', slug: 'terraform-aws-infra',
    short_description: 'Reusable Terraform module library managing 200+ AWS resources across 4 environments with automated compliance.',
    technologies: ['Terraform', 'AWS', 'Atlantis', 'Python', 'OPA', 'GitHub Actions'],
    github_url: 'https://github.com/alexchen/terraform-aws',
    featured: true, display_order: 2,
    results: 'Provisioning time reduced from days to 15 minutes. 100% environment parity.',
    created_at: '2023-09-01T00:00:00Z', updated_at: '2023-09-01T00:00:00Z',
  },
  {
    id: '3', title: 'GitHub Actions CI/CD Platform', slug: 'cicd-platform',
    short_description: 'Enterprise CI/CD platform with reusable workflows, security scanning, and deployment gates across 30+ repos.',
    technologies: ['GitHub Actions', 'Docker', 'Trivy', 'SonarQube', 'ArgoCD'],
    github_url: 'https://github.com/alexchen/cicd-platform',
    featured: true, display_order: 3,
    results: 'Average CI time reduced by 45%. Security vulnerabilities detected pre-merge increased 5×.',
    created_at: '2023-05-01T00:00:00Z', updated_at: '2023-05-01T00:00:00Z',
  },
  {
    id: '4', title: 'Full-Stack Observability', slug: 'observability-platform',
    short_description: 'Production observability with Prometheus, Grafana, Loki, and custom SLO dashboards for 15+ services.',
    technologies: ['Prometheus', 'Grafana', 'Loki', 'OpenTelemetry', 'PagerDuty'],
    github_url: 'https://github.com/alexchen/observability',
    featured: true, display_order: 4,
    results: 'MTTD reduced from 18 minutes to 90 seconds.',
    created_at: '2022-11-01T00:00:00Z', updated_at: '2022-11-01T00:00:00Z',
  },
  {
    id: '5', title: 'Dockerized Microservices Migration', slug: 'microservices-docker',
    short_description: 'Containerisation of 12 legacy services with multi-stage Dockerfiles, optimised layers, and security scanning.',
    technologies: ['Docker', 'Python', 'Node.js', 'Trivy', 'GitHub Actions', 'ECR'],
    github_url: 'https://github.com/alexchen/docker-migration',
    featured: true, display_order: 5,
    results: 'Image sizes reduced 60%. Build times down 40%. Zero critical CVEs in production.',
    created_at: '2022-06-01T00:00:00Z', updated_at: '2022-06-01T00:00:00Z',
  },
  {
    id: '6', title: 'GitOps Deployment Platform', slug: 'gitops-platform',
    short_description: 'GitOps platform with ArgoCD, automated secret rotation, and progressive delivery for 20+ applications.',
    technologies: ['ArgoCD', 'Kubernetes', 'External Secrets', 'Vault', 'Kustomize'],
    github_url: 'https://github.com/alexchen/gitops-platform',
    featured: true, display_order: 6,
    results: 'Deployment failures down 85%. Rollback time from 20 minutes to 90 seconds.',
    created_at: '2024-03-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z',
  },
];

export const fallbackSkills: Skill[] = [
  { id: 's1',  name: 'AWS',            category: 'cloud',      proficiency: 95, level: 'expert',       years_experience: 5, display_order: 1,  created_at: '' },
  { id: 's2',  name: 'Azure',          category: 'cloud',      proficiency: 75, level: 'advanced',     years_experience: 3, display_order: 2,  created_at: '' },
  { id: 's3',  name: 'GCP',            category: 'cloud',      proficiency: 68, level: 'intermediate', years_experience: 2, display_order: 3,  created_at: '' },
  { id: 's4',  name: 'Docker',         category: 'containers', proficiency: 95, level: 'expert',       years_experience: 5, display_order: 1,  created_at: '' },
  { id: 's5',  name: 'Kubernetes',     category: 'containers', proficiency: 92, level: 'expert',       years_experience: 4, display_order: 2,  created_at: '' },
  { id: 's6',  name: 'Helm',           category: 'containers', proficiency: 85, level: 'advanced',     years_experience: 4, display_order: 3,  created_at: '' },
  { id: 's7',  name: 'GitHub Actions', category: 'cicd',       proficiency: 92, level: 'expert',       years_experience: 4, display_order: 1,  created_at: '' },
  { id: 's8',  name: 'GitLab CI',      category: 'cicd',       proficiency: 82, level: 'advanced',     years_experience: 3, display_order: 2,  created_at: '' },
  { id: 's9',  name: 'Jenkins',        category: 'cicd',       proficiency: 78, level: 'advanced',     years_experience: 4, display_order: 3,  created_at: '' },
  { id: 's10', name: 'ArgoCD',         category: 'cicd',       proficiency: 88, level: 'advanced',     years_experience: 3, display_order: 4,  created_at: '' },
  { id: 's11', name: 'Terraform',      category: 'iac',        proficiency: 93, level: 'expert',       years_experience: 4, display_order: 1,  created_at: '' },
  { id: 's12', name: 'Ansible',        category: 'iac',        proficiency: 82, level: 'advanced',     years_experience: 4, display_order: 2,  created_at: '' },
  { id: 's13', name: 'Prometheus',     category: 'monitoring', proficiency: 88, level: 'advanced',     years_experience: 4, display_order: 1,  created_at: '' },
  { id: 's14', name: 'Grafana',        category: 'monitoring', proficiency: 85, level: 'advanced',     years_experience: 4, display_order: 2,  created_at: '' },
  { id: 's15', name: 'Loki',           category: 'monitoring', proficiency: 78, level: 'advanced',     years_experience: 3, display_order: 3,  created_at: '' },
  { id: 's16', name: 'Bash',           category: 'scripting',  proficiency: 92, level: 'expert',       years_experience: 5, display_order: 1,  created_at: '' },
  { id: 's17', name: 'Python',         category: 'scripting',  proficiency: 82, level: 'advanced',     years_experience: 4, display_order: 2,  created_at: '' },
  { id: 's18', name: 'Go',             category: 'scripting',  proficiency: 65, level: 'intermediate', years_experience: 2, display_order: 3,  created_at: '' },
  { id: 's19', name: 'Git',            category: 'vcs',        proficiency: 95, level: 'expert',       years_experience: 6, display_order: 1,  created_at: '' },
];

export const fallbackExperience: Experience[] = [
  {
    id: 'e1', company: 'Stripe', role: 'Senior Platform Engineer',
    location: 'Seattle, WA (Remote)', start_date: '2022-04-01', current: true,
    description: 'Lead platform engineer owning Kubernetes infrastructure and CI/CD tooling used by 200+ engineers.',
    achievements: [
      'Designed and built internal Kubernetes IDP serving 200+ engineers across 50+ microservices',
      'Reduced deployment lead time from 90 minutes to 8 minutes with GitOps and canary deployments',
      'Built self-service Terraform workflows reducing infra requests from 3 days to 15 minutes',
      'Implemented SLO framework — MTTD reduced from 18 min to 90 seconds',
      'Led cloud cost optimisation saving $340k/year through right-sizing and spot instances',
    ],
    technologies: ['Kubernetes', 'EKS', 'Terraform', 'ArgoCD', 'Prometheus', 'AWS', 'Go'],
    display_order: 1, created_at: '',
  },
  {
    id: 'e2', company: 'Cloudflare', role: 'DevOps Engineer',
    location: 'San Francisco, CA', start_date: '2020-02-01', end_date: '2022-03-31', current: false,
    description: 'Core DevOps engineer building CI/CD pipelines and IaC for global edge infrastructure.',
    achievements: [
      'Built GitHub Actions CI platform for 30+ repositories with unified security scanning',
      'Migrated 40 services from Jenkins to GitHub Actions, reducing CI costs by 55%',
      'Automated AWS infrastructure with Terraform for 5 environments and 3 regions',
      'Implemented container security scanning — blocked 200+ critical CVEs pre-production',
    ],
    technologies: ['GitHub Actions', 'Docker', 'Terraform', 'AWS', 'Python', 'Prometheus'],
    display_order: 2, created_at: '',
  },
  {
    id: 'e3', company: 'Twilio', role: 'Junior DevOps / SRE',
    location: 'San Francisco, CA', start_date: '2018-07-01', end_date: '2020-01-31', current: false,
    description: 'First DevOps hire on the SRE team. Built monitoring, alerting, and containerisation foundation.',
    achievements: [
      'Set up Prometheus + Grafana observability stack for 10 production services',
      'Containerised 8 legacy Node.js services with optimised Docker builds',
      'Built automated backup and disaster recovery testing for RDS databases',
      'Created incident response runbooks reducing MTTR by 40%',
    ],
    technologies: ['Docker', 'Ansible', 'AWS', 'Prometheus', 'Grafana', 'Bash'],
    display_order: 3, created_at: '',
  },
];

export const fallbackEducation: Education[] = [
  {
    id: 'd1', institution: 'University of Washington', degree: 'B.S. Computer Science',
    field: 'Distributed Systems', start_date: '2014-09-01', end_date: '2018-06-30',
    current: false, description: 'Focused on distributed systems, OS, and software engineering. GPA 3.7.',
    display_order: 1, created_at: '',
  },
];

export const fallbackCertifications: Certification[] = [
  { id: 'c1', name: 'AWS Solutions Architect – Professional', issuer: 'Amazon Web Services', issue_date: '2023-03-01', expiry_date: '2026-03-01', credential_url: 'https://aws.amazon.com/certification', display_order: 1, created_at: '' },
  { id: 'c2', name: 'Certified Kubernetes Administrator (CKA)', issuer: 'CNCF / Linux Foundation', issue_date: '2022-11-01', expiry_date: '2025-11-01', credential_url: 'https://training.linuxfoundation.org', display_order: 2, created_at: '' },
  { id: 'c3', name: 'HashiCorp Terraform Associate', issuer: 'HashiCorp', issue_date: '2022-06-01', expiry_date: '2024-06-01', credential_url: 'https://developer.hashicorp.com/certifications', display_order: 3, created_at: '' },
  { id: 'c4', name: 'AWS DevOps Engineer – Professional', issuer: 'Amazon Web Services', issue_date: '2023-08-01', expiry_date: '2026-08-01', credential_url: 'https://aws.amazon.com/certification', display_order: 4, created_at: '' },
  { id: 'c5', name: 'Certified Kubernetes Security Specialist (CKS)', issuer: 'CNCF / Linux Foundation', issue_date: '2024-01-01', expiry_date: '2026-01-01', credential_url: 'https://training.linuxfoundation.org', display_order: 5, created_at: '' },
];

export const fallbackTestimonials: Testimonial[] = [
  { id: 't1', name: 'Sarah Kim', role: 'VP Engineering', company: 'Stripe', content: "Alex transformed our deployment process. What used to take 90 minutes now takes 8 minutes with full automation. The Kubernetes platform they built is the foundation of how we ship software.", rating: 5, featured: true, display_order: 1, created_at: '' },
  { id: 't2', name: 'Marcus Thompson', role: 'CTO', company: 'DataFlow AI', content: "Exceptional infrastructure work. Alex designed our entire AWS architecture, set up CI/CD pipelines, and implemented monitoring from scratch. The system has run at 99.9% for 14 months.", rating: 5, featured: true, display_order: 2, created_at: '' },
  { id: 't3', name: 'Priya Nair', role: 'Engineering Manager', company: 'Cloudflare', content: "Alex has a rare combination of deep technical knowledge and pragmatic engineering judgment. Our CI infrastructure is dramatically better because of their work.", rating: 5, featured: true, display_order: 3, created_at: '' },
];
