import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

// ── FadeUp ────────────────────────────────────────────────
// immediate=true  → animate on mount (above-the-fold, no scroll trigger)
// immediate=false → animate when scrolled into view (default)
export function FadeUp({
  children, delay = 0, className = '', immediate = false,
}: { children: React.ReactNode; delay?: number; className?: string; immediate?: boolean }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  if (immediate) {
    return (
      <motion.div className={className}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: 'easeOut' }}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

// ── Stagger container + item ──────────────────────────────
export function StaggerList({
  children, className = '', delay = 0.05,
}: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: delay } as never }, hidden: {} }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
      }}>
      {children}
    </motion.div>
  );
}

// ── Section header ─────────────────────────────────────────
export function SectionHeader({
  label, title, subtitle, className = '',
}: { label: string; title: string; subtitle?: string; className?: string }) {
  return (
    <FadeUp className={`mb-14 ${className}`}>
      <p className="section-label mb-3">{label}</p>
      <h2 className="section-title mb-4">{title}</h2>
      {subtitle && <p className="text-white/45 text-lg max-w-2xl">{subtitle}</p>}
    </FadeUp>
  );
}

// ── Animated counter ──────────────────────────────────────
export function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current || !ref.current) return;
    started.current = true;
    let c = 0;
    const step = value / 55;
    const t = setInterval(() => {
      c = Math.min(c + step, value);
      if (ref.current) ref.current.textContent = Math.round(c) + suffix;
      if (c >= value) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, [inView, value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

// ── Progress bar ──────────────────────────────────────────
export function ProgressBar({ value }: { value: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="w-full h-1 rounded-full bg-white/[0.08] overflow-hidden">
      <motion.div className="h-full rounded-full bg-cyan-500"
        initial={{ width: 0 }}
        animate={inView ? { width: `${value}%` } : {}}
        transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }} />
    </div>
  );
}
