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
} from '../lib/api';

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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [
          profileData,
          projectsData,
          skillsData,
          experienceData,
          certificationsData,
          resumeData,
        ] = await Promise.all([
          getProfile(),
          getProjects(),
          getSkills(),
          getExperience(),
          getCertifications(),
          getActiveResume(),
        ]);

        if (!mounted) return;

        setProfile(profileData);
        setProjects(projectsData);
        setSkills(skillsData);
        setExp(experienceData);
        setCerts(certificationsData);
        setResume(resumeData);
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
    };
  }, []);

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

  return (
    <>
      <Navbar resumeUrl={resume?.file_url} />

      <main>
        <Hero profile={profile} resume={resume} />

        <About profile={profile} />

        <Skills skills={skills} />

        <DevOpsLifecycle />

        <WorkflowAnimation />

        <CICDPipeline />

        <TerraformAnimation />

        <KubernetesViz />

        <PodLifecycle />

        <MonitoringDashboard />

        <Experience experience={exp} />

        <Projects projects={projects} />

        <Certifications certifications={certs} />

        <Contact profile={profile} />
      </main>

      <Footer profile={profile} />
    </>
  );
}
