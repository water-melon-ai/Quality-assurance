import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { formatDate } from '../lib/utils';

interface ReportItem {
  id: string;
  score: number;
  grade: string;
  createdAt: string;
  job: { url: string };
  reports: Array<{ pdfUrl: string | null }>;
}

export function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/reports', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setReports(data.data);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="font-syne text-3xl font-bold text-white mb-2">Reports</h1>
      <p className="text-frost-300 mb-8">Every completed audit, newest first.</p>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reports.length === 0 ? (
        <GlassCard className="p-10 text-center text-frost-300">No reports yet.</GlassCard>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <GlassCard key={r.id} className="p-5 flex items-center justify-between gap-4">
              <Link to={`/report/${r.id}`} className="min-w-0 flex-1">
                <div className="text-white font-medium truncate">{r.job.url}</div>
                <div className="text-frost-300 text-sm">
                  {formatDate(r.createdAt)} • Score {r.score} ({r.grade})
                </div>
              </Link>
              {r.reports[0]?.pdfUrl && (
                <a
                  href={r.reports[0].pdfUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn-ghost flex items-center gap-2 shrink-0"
                >
                  <Download className="w-4 h-4" /> PDF
                </a>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}
