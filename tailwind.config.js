/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { primary: '#0a0a0a', secondary: '#111111', card: '#161616' },
        accent: { cyan: '#22d3ee', blue: '#3b82f6', green: '#10b981' },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      animation: {
        'cursor-blink': 'blink 1s step-end infinite',
        'pulse-slow':   'pulse 3s ease-in-out infinite',
        'spin-slow':    'spin 8s linear infinite',
        'flow':         'flow 2s linear infinite',
      },
      keyframes: {
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        flow:  { '0%': { strokeDashoffset: '200' }, '100%': { strokeDashoffset: '0' } },
      },
      boxShadow: {
        'glow-cyan':  '0 0 16px rgba(34,211,238,0.25)',
        'glow-green': '0 0 16px rgba(16,185,129,0.25)',
      },
    },
  },
  plugins: [],
};
