import { useEffect, useState, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/nav/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/hero/Hero';
import About from '../components/about/About';
import Skills from '../components/skills/Skills';
import DevOpsLifecycle from '../components/devops/DevOpsLifecycle';
import WorkflowAnimation from '../components/devops/WorkflowAnimation';
import CICDPipeline from '../components/devops/CICDPipeline';
import TerraformAnimation from '../components/devops/TerraformAnimation';
import KubernetesViz from '../components/devops/KubernetesViz';
import PodLifecycle from '../components/devops/PodLifecycle';
import MonitoringDashboard from '../components/devops/MonitoringDashboard';
import Experience from '../components/experience/Experience';
import Projects from '../components/projects/Projects';
import Certifications from '../components/certifications/Certifications';
import Contact from '../components/contact/Contact';

import {
  getProfile,
  getProjects,
  getSkills,
  getExperience,
  getCertifications,
  getActiveResume,
  incrementProfileViews,
} from '../lib/api';

import {
  getSectionSettings,
  fetchRemoteSettings,
  type DashboardSectionConfig,
  type SectionId,
} from '../lib/settings';

import type {
  Profile,
  Project,
  Skill,
  Experience as ExpType,
  Certification,
  Resume,
} from '../types';

import {
  fallbackProfile,
  fallbackProjects,
  fallbackSkills,
  fallbackExperience,
  fallbackCertifications,
} from '../data/fallback';

function getCached<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) return parsed;
    }
  } catch {}
  return fallback;
}

export default function Home() {
  const [profile, setProfile] = useState<Profile>(() => getCached('portfolio_cached_profile', fallbackProfile));
  const [projects, setProjects] = useState<Project[]>(() => getCached('portfolio_cached_projects', fallbackProjects));
  const [skills, setSkills] = useState<Skill[]>(() => getCached('portfolio_cached_skills', fallbackSkills));
  const [exp, setExp] = useState<ExpType[]>(() => getCached('portfolio_cached_exp', fallbackExperience));
  const [certs, setCerts] = useState<Certification[]>(() => getCached('portfolio_cached_certs', fallbackCertifications));
  const [resume, setResume] = useState<Resume | null>(() => getCached('portfolio_cached_resume', null));
  const [sections, setSections] = useState<DashboardSectionConfig[]>(getSectionSettings);

  const [showInitialLoader, setShowInitialLoader] = useState(() => {
    return !sessionStorage.getItem('portfolio_visited');
  });

  useEffect(() => {
    if (showInitialLoader) {
      const timer = setTimeout(() => {
        setShowInitialLoader(false);
        try { sessionStorage.setItem('portfolio_visited', 'true'); } catch {}
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [showInitialLoader]);

  useEffect(() => {
    let mounted = true;

    // Increment profile view count once per browser session
    if (!sessionStorage.getItem('portfolio_view_counted')) {
      sessionStorage.setItem('portfolio_view_counted', 'true');
      incrementProfileViews().catch(() => {});
    }

    const onSettingsUpdate = () => setSections(getSectionSettings());
    window.addEventListener('sections_config_updated', onSettingsUpdate);
    window.addEventListener('storage', onSettingsUpdate);

    async function loadData() {
      try {
        const [
          profileData,
          projectsData,
          skillsData,
          experienceData,
          certificationsData,
          resumeData,
          sectionsData,
        ] = await Promise.all([
          getProfile(),
          getProjects(),
          getSkills(),
          getExperience(),
          getCertifications(),
          getActiveResume(),
          fetchRemoteSettings(),
        ]);

        if (!mounted) return;

        if (profileData) {
          setProfile(profileData);
          try { localStorage.setItem('portfolio_cached_profile', JSON.stringify(profileData)); } catch {}
        }
        if (projectsData?.length) {
          setProjects(projectsData);
          try { localStorage.setItem('portfolio_cached_projects', JSON.stringify(projectsData)); } catch {}
        }
        if (skillsData?.length) {
          setSkills(skillsData);
          try { localStorage.setItem('portfolio_cached_skills', JSON.stringify(skillsData)); } catch {}
        }
        if (experienceData?.length) {
          setExp(experienceData);
          try { localStorage.setItem('portfolio_cached_exp', JSON.stringify(experienceData)); } catch {}
        }
        if (certificationsData?.length) {
          setCerts(certificationsData);
          try { localStorage.setItem('portfolio_cached_certs', JSON.stringify(certificationsData)); } catch {}
        }
        if (resumeData !== undefined) {
          setResume(resumeData);
          try { localStorage.setItem('portfolio_cached_resume', JSON.stringify(resumeData)); } catch {}
        }
        if (sectionsData) {
          setSections(sectionsData);
        }
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    }

    loadData();

    return () => {
      mounted = false;
      window.removeEventListener('sections_config_updated', onSettingsUpdate);
      window.removeEventListener('storage', onSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    if (profile?.name) {
      const primaryRole = profile.headline ? profile.headline.split(',')[0].trim() : 'DevOps Engineer';
      const pageTitle = `${profile.name} — ${primaryRole}`;
      document.title = pageTitle;

      // Dynamically update SEO & OpenGraph meta tags from database
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          profile.bio ? profile.bio.split('\n')[0] : `${profile.name} — ${profile.headline || 'Cloud & DevOps Engineer Portfolio'}`
        );
      }

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', pageTitle);
      }

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute(
          'content',
          profile.headline || 'Cloud infrastructure, Kubernetes, CI/CD, Terraform.'
        );
      }
    }
  }, [profile]);

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'auto' });
      } else {
        requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'auto' });
        });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const sectionComponentMap: Record<SectionId, React.ReactNode> = {
    hero: <Hero profile={profile} resume={resume} />,
    about: <About profile={profile} />,
    skills: <Skills skills={skills} />,
    devops_lifecycle: <DevOpsLifecycle />,
    workflow: <WorkflowAnimation />,
    cicd: <CICDPipeline />,
    terraform: <TerraformAnimation />,
    kubernetes: <KubernetesViz />,
    pod_lifecycle: <PodLifecycle />,
    monitoring: <MonitoringDashboard />,
    experience: <Experience experience={exp} />,
    projects: <Projects projects={projects} />,
    certifications: <Certifications certifications={certs} />,
    contact: <Contact profile={profile} />,
  };

  return (
    <>
      <AnimatePresence>
        {showInitialLoader && (
          <motion.div
            key="initial-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.55, ease: 'easeInOut' } }}
            className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="relative mb-6">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
              <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-ping opacity-25" />
            </div>
            <p className="text-white font-display font-bold text-xl tracking-tight mb-2">
              {(profile?.name || 'poorna').split(' ')[0]}<span className="text-cyan-400">.</span>
            </p>
            <p className="text-white/40 text-xs font-mono tracking-wide">
              ~/ initializing portfolio...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar resumeUrl={resume?.file_url} name={profile?.name} />

      <main>
        {sections
          .filter(s => s.enabled)
          .map(s => (
            <div key={s.id} id={s.id}>
              {sectionComponentMap[s.id]}
            </div>
          ))}
      </main>

      <Footer profile={profile} />
    </>
  );
}
