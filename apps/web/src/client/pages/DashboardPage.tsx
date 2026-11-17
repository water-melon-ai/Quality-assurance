import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, ExternalLink } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { formatDate, getGrade } from '../lib/utils';

interface DashboardStats {
  recent: Array<{
    id: string;
    url: string;
    status: string;
    createdAt: string;
    result: {
      id: string;
      score: number;
      grade: string;
      criticalCount: number;
      highCount: number;
      loadTimeMs: number | null;
    } | null;
  }>;
  total: number;
  avgScore: number | null;
  activeMonitors: number;
  testsToday: number;
}

const gradeStyle = (g: string) =>
  g === 'A' || g === 'B'
    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
    : g === 'C'
      ? 'bg-[#F0C040]/20 text-[#F0C040] border border-[#F0C040]/30'
      : 'bg-red-500/20 text-red-400 border border-red-500/30';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { recent = [], total = 0, avgScore = null, activeMonitors = 0 } = stats || {};

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="font-syne text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-frost-300">Here's how your sites are doing.</p>
        </div>
        <Link to="/">
          <GlassButton leftIcon={<Plus className="w-4 h-4" />}>New scan</GlassButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <GlassCard className="p-6">
          <div className="text-sm font-mono text-frost-300 uppercase tracking-widest mb-2">Total scans</div>
          <div className="text-4xl font-syne font-bold text-white">{total}</div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="text-sm font-mono text-frost-300 uppercase tracking-widest mb-2">Average score</div>
          <div className="text-4xl font-syne font-bold text-[#F0C040]">
            {avgScore === null ? '—' : `${avgScore} (${getGrade(avgScore)})`}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="text-sm font-mono text-frost-300 uppercase tracking-widest mb-2">Active monitors</div>
          <div className="text-4xl font-syne font-bold text-primary">{activeMonitors}</div>
        </GlassCard>
      </div>

      <h2 className="font-syne text-xl font-bold text-white mb-6">Recent scans</h2>

      {recent.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-frost-300 mb-4">No scans yet — run your first one.</p>
          <Link to="/">
            <GlassButton>Scan a website</GlassButton>
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {recent.map((job) => (
            <GlassCard key={job.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-6 min-w-0">
                <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-syne font-bold text-xl ${job.result ? gradeStyle(job.result.grade) : 'bg-white/5 text-frost-300 border border-white/10'}`}>
                  {job.result ? job.result.score : '…'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-medium text-lg flex items-center gap-2 truncate">
                    <span className="truncate">{job.url}</span>
                    <a href={job.url} target="_blank" rel="noreferrer noopener" className="text-frost-300 hover:text-white shrink-0" aria-label="Open site">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </h3>
                  <p className="text-frost-300 text-sm capitalize">
                    {formatDate(job.createdAt)} • {job.result ? `Grade ${job.result.grade}` : job.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <Link to={job.result ? `/report/${job.result.id}` : `/scan/${job.id}`} className="w-full sm:w-auto">
                <GlassButton variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full">
                  {job.result ? 'View report' : job.status === 'failed' ? 'Details' : 'View progress'}
                </GlassButton>
              </Link>
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}
