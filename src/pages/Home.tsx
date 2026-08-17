import { useEffect, useState } from 'react';
import Navbar        from '../components/nav/Navbar';
import Footer        from '../components/layout/Footer';
import Hero          from '../components/hero/Hero';
import About         from '../components/about/About';
import Skills        from '../components/skills/Skills';
import DevOpsLifecycle    from '../components/devops/DevOpsLifecycle';
import WorkflowAnimation  from '../components/devops/WorkflowAnimation';
import CICDPipeline       from '../components/devops/CICDPipeline';
import TerraformAnimation from '../components/devops/TerraformAnimation';
import KubernetesViz      from '../components/devops/KubernetesViz';
import PodLifecycle       from '../components/devops/PodLifecycle';
import MonitoringDashboard from '../components/devops/MonitoringDashboard';
import Experience    from '../components/experience/Experience';
import Projects      from '../components/projects/Projects';
import Certifications from '../components/certifications/Certifications';
import Contact       from '../components/contact/Contact';
import {
  getProfile, getProjects, getSkills, getExperience,
  getCertifications, getActiveResume,
} from '../lib/api';
import type { Profile, Project, Skill, Experience as ExpType, Certification, Resume } from '../types';
import { fallbackProfile, fallbackProjects, fallbackSkills, fallbackExperience, fallbackCertifications } from '../data/fallback';

export default function Home() {
  const [profile, setProfile]   = useState<Profile>(fallbackProfile);
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);
  const [skills, setSkills]     = useState<Skill[]>(fallbackSkills);
  const [exp, setExp]           = useState<ExpType[]>(fallbackExperience);
  const [certs, setCerts]       = useState<Certification[]>(fallbackCertifications);
  const [resume, setResume]     = useState<Resume | null>(null);

  useEffect(() => {
    getProfile().then(setProfile);
    getProjects().then(setProjects);
    getSkills().then(setSkills);
    getExperience().then(setExp);
    getCertifications().then(setCerts);
    getActiveResume().then(setResume);
  }, []);

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
