import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { GlassCard } from '../components/ui/GlassCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { LogStream } from '../components/ui/LogStream';
import type { JobStatus, LogLine } from '@frostflow/types';

interface StatusData {
  id: string;
  url: string;
  status: JobStatus;
  progress: number;
  error: string | null;
  resultId: string | null;
}

const STAGE_LOG: Record<JobStatus, Pick<LogLine, 'level' | 'message'>> = {
  queued: { level: 'info', message: 'Scan queued — waiting for a free worker…' },
  crawling: { level: 'info', message: 'Opening the site in a real browser…' },
  checking: { level: 'info', message: 'Running performance, security, accessibility, SEO, link and mobile checks…' },
  scoring: { level: 'info', message: 'Scoring the results…' },
  generating_report: { level: 'info', message: 'Writing the plain-English report…' },
  done: { level: 'ok', message: 'Analysis complete — opening your report.' },
  failed: { level: 'error', message: 'The scan failed.' },
};

const MAX_POLL_ERRORS = 8;

export function ScanWaitingRoomPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<JobStatus>('queued');
  const [url, setUrl] = useState('');
  const [fatal, setFatal] = useState('');
  const [logs, setLogs] = useState<LogLine[]>([
    { timestamp: Date.now(), level: 'info', message: 'Connecting to the QA engine…' },
  ]);
  const lastStatus = useRef<JobStatus | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let stopped = false;
    let errors = 0;
    let timer: any;

    const log = (level: LogLine['level'], message: string) =>
      setLogs((prev) => [...prev, { timestamp: Date.now(), level, message }]);

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/status`, { cache: 'no-store' });
        if (res.status === 404) {
          setFatal("We couldn't find this scan.");
          return;
        }
        const json = (await res.json()) as { success: boolean; data?: StatusData; error?: string };
        if (!json.success || !json.data) throw new Error(json.error || 'bad response');
        errors = 0;

        const job = json.data;
        setStatus(job.status);
        setProgress(job.progress);
        setUrl(job.url);

        if (lastStatus.current !== job.status) {
          lastStatus.current = job.status;
          const stage = STAGE_LOG[job.status];
          if (stage) {
            log(stage.level, job.status === 'failed' && job.error ? `${stage.message} ${job.error}` : stage.message);
          }
        }

        if (job.status === 'done' && job.resultId) {
          setProgress(100);
          setTimeout(() => navigate(`/report/${job.resultId}`), 800);
          return;
        }
        if (job.status === 'failed') {
          setFatal(job.error || 'The scan failed. Please try again.');
          return;
        }
      } catch {
        errors += 1;
        if (errors >= MAX_POLL_ERRORS) {
          setFatal('Lost connection to the scan engine. Please reload the page.');
          return;
        }
      }
      if (!stopped) timer = setTimeout(poll, 2000);
    };

    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [jobId, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-20">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="font-syne text-3xl font-bold text-white mb-2">
              {fatal ? 'Scan failed' : 'Analyzing website'}
            </h1>
            <p className="text-frost-300 font-mono text-sm break-all">{url || 'Preparing…'}</p>
          </div>

          <GlassCard className="p-8">
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-white capitalize">
                  {fatal ? 'Failed' : status === 'done' ? 'Complete' : status.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono text-frost-300">{progress}%</span>
              </div>
              <ProgressBar progress={progress} />
            </div>

            <div className="h-64 rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a] p-4 relative">
              <LogStream logs={logs} className="h-full absolute inset-4 overflow-y-auto" />
            </div>

            {fatal && (
              <div className="mt-6 text-center">
                <p role="alert" className="text-sm text-critical mb-4">{fatal}</p>
                <Link to="/" className="btn-primary inline-block">Try another scan</Link>
              </div>
            )}
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
