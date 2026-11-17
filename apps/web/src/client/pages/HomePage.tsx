import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp as slideUp } from '../lib/animations';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Search, Gauge, ShieldCheck, Accessibility, Link2, Smartphone, FileText } from 'lucide-react';

const features = [
  { icon: Gauge, title: 'Performance', body: 'Load time, Core Web Vitals and page weight, translated into business impact.' },
  { icon: ShieldCheck, title: 'Security', body: 'SSL, security headers, mixed content and accidentally exposed config files.' },
  { icon: Accessibility, title: 'Accessibility', body: 'Missing alt text, unlabeled forms and broken heading structure.' },
  { icon: Link2, title: 'Broken links', body: 'Finds dead and unreachable links before your visitors do.' },
  { icon: Smartphone, title: 'Mobile', body: 'Viewport, horizontal scroll, tap targets and tiny text on a phone-sized screen.' },
  { icon: FileText, title: 'Client-ready reports', body: 'Plain-English AI summaries and white-label PDFs included free.' },
] as const;

export function HomePage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as { success: boolean; data?: { jobId: string }; error?: string };

      if (data.success && data.data?.jobId) {
        navigate(`/scan/${data.data.jobId}`);
        return;
      }
      setError(data.error || 'Failed to start the scan.');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full max-w-4xl flex flex-col items-center text-center"
        >
          {/* Tagline */}
          <motion.div variants={slideUp} className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-primary pulse-dot" />
            No QA team? No problem.
          </motion.div>

          <motion.h1
            variants={slideUp}
            className="font-syne text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6 leading-tight"
          >
            Your client site is probably broken. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B8DEF] to-[#00E5FF]">
              Find out before they do.
            </span>
          </motion.h1>

          <motion.p variants={slideUp} className="text-lg text-frost-200 max-w-2xl mb-12">
            Run a complete Playwright-driven audit of your site's performance, accessibility, SEO, and security in 60 seconds. Plain-English reports designed to win client trust.
          </motion.p>

          <motion.form
            variants={slideUp}
            onSubmit={handleScan}
            className="w-full max-w-2xl relative flex flex-col sm:flex-row gap-4 sm:gap-2"
          >
            <GlassInput
              variant="hero"
              type="text"
              inputMode="url"
              autoComplete="url"
              aria-label="Website URL"
              placeholder="Enter website URL (e.g. example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              required
            />
            <GlassButton
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="sm:absolute sm:right-2 sm:top-2 sm:bottom-2 sm:w-auto w-full text-lg px-8"
            >
              Analyze Site
            </GlassButton>
          </motion.form>

          {error && (
            <p role="alert" className="text-sm text-critical mt-4">{error}</p>
          )}

          <motion.p variants={slideUp} className="text-xs text-frost-300 mt-4 opacity-60">
            100% free with unlimited scans, AI reports, PDFs and monitors — no credit card, ever.
          </motion.p>
        </motion.div>
      </main>

      <section id="features" className="px-6 pb-24 max-w-6xl mx-auto w-full scroll-mt-24">
        <h2 className="font-syne text-3xl md:text-4xl font-bold text-white text-center mb-12">Everything a QA team would check</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass-card p-6">
              <Icon className="w-6 h-6 text-primary mb-4" />
              <h3 className="font-syne text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-frost-300">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
