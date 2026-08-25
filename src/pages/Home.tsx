import { useEffect, useState } from 'react';
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

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [exp, setExp] = useState<ExpType[] | null>(null);
  const [certs, setCerts] = useState<Certification[] | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [sections, setSections] = useState<DashboardSectionConfig[]>(getSectionSettings);

  const [loading, setLoading] = useState(true);

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

        setProfile(profileData);
        setProjects(projectsData);
        setSkills(skillsData);
        setExp(experienceData);
        setCerts(certificationsData);
        setResume(resumeData);
        if (sectionsData) setSections(sectionsData);
      } catch (error) {
        console.error('Portfolio data loading failed:', error);

        if (!mounted) return;

        // Use meaningful fallback portfolio data if Supabase fails.
        setProfile(fallbackProfile);
        setProjects(fallbackProjects);
        setSkills(fallbackSkills);
        setExp(fallbackExperience);
        setCerts(fallbackCertifications);
        setResume(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
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

  /*
   * Do not render fallback data while Supabase is still loading.
   * This prevents fallback values and their animations from appearing
   * before the real database values arrive.
   */
  if (
    loading ||
    !profile ||
    !projects ||
    !skills ||
    !exp ||
    !certs
  ) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-white/40 text-sm font-mono">
            Loading portfolio...
          </p>
        </div>
      </div>
    );
  }

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
