import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home          from './pages/Home';
import ProjectDetails from './pages/ProjectDetails';
import Login         from './pages/Login';
import AdminLayout   from './pages/admin/AdminLayout';
import Dashboard     from './pages/admin/Dashboard';
import Profile       from './pages/admin/Profile';
import Projects      from './pages/admin/Projects';
import Skills        from './pages/admin/Skills';
import Experience    from './pages/admin/Experience';
import Certifications from './pages/admin/Certifications';
import Messages      from './pages/admin/Messages';
import Resume        from './pages/admin/Resume';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"                  element={<Home />} />
        <Route path="/projects/:slug"    element={<ProjectDetails />} />
        <Route path="/login"             element={<Login />} />
        {/* Admin (protected via AdminLayout) */}
        <Route path="/admin"             element={<AdminLayout />}>
          <Route index                   element={<Dashboard />} />
          <Route path="profile"          element={<Profile />} />
          <Route path="projects"         element={<Projects />} />
          <Route path="skills"           element={<Skills />} />
          <Route path="experience"       element={<Experience />} />
          <Route path="certifications"   element={<Certifications />} />
          <Route path="messages"         element={<Messages />} />
          <Route path="resume"           element={<Resume />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
