import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { MonitorForm } from '../components/monitors/MonitorForm';
import { DeleteMonitorButton } from '../components/monitors/DeleteMonitorButton';
import { timeAgo } from '../lib/utils';

interface MonitorItem {
  id: string;
  url: string;
  schedule: string;
  active: boolean;
  lastRunAt: string | null;
  lastScore: number | null;
  lastGrade: string | null;
}

export function MonitorsPage() {
  const [monitors, setMonitors] = useState<MonitorItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMonitors = () => {
    fetch('/api/monitors', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setMonitors(data.data);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  return (
    <div className="max-w-5xl">
      <h1 className="font-syne text-3xl font-bold text-white mb-2">Automated monitors</h1>
      <p className="text-frost-300 mb-10">Schedule scans and get alerted before your clients notice a problem.</p>

      <MonitorForm onCreated={fetchMonitors} />

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : monitors.length === 0 ? (
        <GlassCard className="p-8 text-center text-frost-300">No monitors yet.</GlassCard>
      ) : (
        <div className="space-y-4">
          {monitors.map((m) => (
            <GlassCard key={m.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-medium truncate">{m.url}</h4>
                  <p className="text-sm text-frost-300">
                    Runs {m.schedule.replace('every_', 'every ')} •{' '}
                    {m.lastRunAt ? `last run ${timeAgo(m.lastRunAt)} (score ${m.lastScore ?? '—'})` : 'waiting for first run'}
                  </p>
                </div>
              </div>
              <DeleteMonitorButton id={m.id} onDeleted={fetchMonitors} />
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
