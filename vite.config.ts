import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteTitle = env.VITE_SITE_TITLE || 'DevOps & Cloud Engineer Portfolio';
  const siteDesc = env.VITE_SITE_DESCRIPTION || 'Cloud infrastructure, Kubernetes, CI/CD automation, and platform engineering.';

  return {
    plugins: [
      react(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html
            .replace(/%VITE_SITE_TITLE%/g, siteTitle)
            .replace(/%VITE_SITE_DESCRIPTION%/g, siteDesc);
        },
      },
    ],
    server: {
      host: '0.0.0.0',
      allowedHosts: ['test-web-absi.onrender.com'],
    },
  };
});
