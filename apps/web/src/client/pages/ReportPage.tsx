import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ScoreRing } from '../components/ui/ScoreRing';
import { GlassCard } from '../components/ui/GlassCard';
import { SeverityBadge, Pill } from '../components/ui/SeverityBadge';
import {
  ExternalLink,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layout,
  Smartphone,
  Shield,
  Zap,
  Link as LinkIcon,
  Search,
} from 'lucide-react';
import type { GeminiReport, Issue } from '@frostflow/types';

interface ResultData {
  id: string;
  score: number;
  grade: string;
  scoreBreakdown: Record<string, number>;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  passedChecks: number;
  geminiReport: GeminiReport | null;
  issues: Issue[];
  job: { url: string; createdAt: string; tier: string };
  report?: { pdfUrl: string | null } | null;
}

export function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/results/${encodeURIComponent(id)}`, { cache: 'no-store' });
        const json = (await res.json()) as { success: boolean; data?: ResultData; error?: string };

        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.error || 'Report not found');
        }
      } catch {
        setError('Failed to fetch report');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <XCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="font-syne text-2xl font-bold text-white mb-2">Report Unavailable</h1>
          <p className="text-frost-300">{error}</p>
        </main>
      </div>
    );
  }

  const { job, score, grade, geminiReport, issues, criticalCount, highCount, mediumCount } = data;

  const categories = [
    { id: 'all', label: 'All Issues', icon: Layout },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'accessibility', label: 'Accessibility', icon: Layout },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
    { id: 'links', label: 'Links', icon: LinkIcon },
  ];

  const filteredIssues = activeTab === 'all' ? issues : issues.filter((i) => i.category === activeTab);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-32 pb-20">
        {/* Header section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="font-syne text-3xl font-bold text-white mb-2 flex items-center gap-3">
              QA Audit Report
              {grade === 'A' || grade === 'B' ? <SeverityBadge severity="safe" showDot /> : null}
              {grade === 'C' ? <SeverityBadge severity="medium" /> : null}
              {grade === 'D' || grade === 'F' ? <SeverityBadge severity="critical" /> : null}
            </h1>
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:text-primary-light flex items-center gap-1"
            >
              {job.url} <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-frost-300 text-sm mt-2">
              Analyzed on {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>

          {data.report?.pdfUrl && (
            <a
              href={data.report.pdfUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-ghost flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download PDF
            </a>
          )}
        </div>

        {/* Top Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Score Card */}
          <GlassCard className="col-span-1 p-8 flex flex-col items-center justify-center text-center">
            <ScoreRing score={score} size={160} />
            <div className="mt-6 flex gap-4 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-white font-bold text-xl">{criticalCount}</span>
                <span className="text-frost-300 text-xs">Critical</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-white font-bold text-xl">{highCount}</span>
                <span className="text-frost-300 text-xs">High</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-white font-bold text-xl">{mediumCount}</span>
                <span className="text-frost-300 text-xs">Medium</span>
              </div>
            </div>
          </GlassCard>

          {/* AI Executive Summary */}
          <GlassCard variant="elevated" innerGlow className="col-span-1 lg:col-span-2 p-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-syne font-bold text-xl text-white">Executive Summary</h3>
            </div>

            {geminiReport ? (
              <div className="space-y-6">
                <p className="text-frost-200 leading-relaxed text-lg">{geminiReport.executiveSummary}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <h4 className="flex items-center gap-2 text-green-400 font-medium mb-2">
                      <CheckCircle2 className="w-4 h-4" /> What's Working Well
                    </h4>
                    <p className="text-frost-300 text-sm">{geminiReport.whatIsWorkingWell}</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <h4 className="flex items-center gap-2 text-primary font-medium mb-2">
                      <AlertTriangle className="w-4 h-4" /> Fix This Week
                    </h4>
                    <p className="text-frost-300 text-sm whitespace-pre-wrap">{geminiReport.fixThisWeek}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-frost-300">AI analysis is currently unavailable for this report.</p>
            )}
          </GlassCard>
        </div>

        {/* Detailed Issues Section */}
        <div>
          <h3 className="font-syne font-bold text-2xl text-white mb-6">Technical Details</h3>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;
              const count = cat.id === 'all' ? issues.length : issues.filter((i) => i.category === cat.id).length;

              if (cat.id !== 'all' && count === 0) return null;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                    isActive
                      ? 'bg-primary/20 text-white border border-primary/50'
                      : 'bg-white/5 text-frost-300 border border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                  <span className="ml-1 bg-black/30 px-2 py-0.5 rounded-full text-xs">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Issues List */}
          <div className="space-y-4">
            {filteredIssues.length === 0 ? (
              <GlassCard className="p-12 flex flex-col items-center text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mb-4" />
                <h4 className="text-white text-lg font-medium mb-2">No issues found</h4>
                <p className="text-frost-300">This category passed all our automated checks.</p>
              </GlassCard>
            ) : (
              filteredIssues.map((issue, idx) => (
                <GlassCard key={issue.id ?? idx} className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <SeverityBadge severity={issue.severity} showDot />
                        <Pill variant="ice" className="text-xs">{issue.category}</Pill>
                      </div>
                      <h4 className="text-white text-lg font-medium">{issue.title}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <h5 className="text-xs uppercase tracking-widest text-frost-300 mb-2 font-mono">Business Impact</h5>
                      <p className="text-frost-200 text-sm leading-relaxed">{issue.businessImpact}</p>
                    </div>
                    <div>
                      <h5 className="text-xs uppercase tracking-widest text-primary mb-2 font-mono">How to Fix</h5>
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{issue.fix}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <h5 className="text-xs uppercase tracking-widest text-frost-300 mb-2 font-mono">Technical Details</h5>
                    <code className="text-xs text-[#FF8C42] bg-black/40 px-3 py-2 rounded block break-all font-mono">
                      {issue.technicalDetail}
                      {issue.location && <span className="block mt-1 text-frost-300">Location: {issue.location}</span>}
                    </code>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
