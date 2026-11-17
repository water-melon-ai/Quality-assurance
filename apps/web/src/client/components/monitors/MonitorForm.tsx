import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassInput } from '../ui/GlassInput';
import { normalizeUrl } from '../../lib/utils';

const label = 'block text-xs uppercase tracking-widest text-frost-300 font-mono mb-2';

export function MonitorForm({ onCreated }: { onCreated?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          url: normalizeUrl(String(fd.get('url') ?? '').trim()),
          schedule: fd.get('schedule'),
          alertEmail: String(fd.get('alertEmail') ?? '').trim() || null,
          slackWebhook: String(fd.get('slackWebhook') ?? '').trim() || null,
        }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (!data.success) throw new Error(data.error || 'Could not create the monitor.');
      form.reset();
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the monitor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="p-6 mb-10">
      <h3 className="font-syne font-bold text-lg text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-primary" /> Create monitor
      </h3>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-4">
          <label htmlFor="m-url" className={label}>Target URL</label>
          <GlassInput id="m-url" name="url" type="text" inputMode="url" placeholder="example.com" required />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="m-schedule" className={label}>Frequency</label>
          <select id="m-schedule" name="schedule" defaultValue="every_24h" className="glass-input w-full appearance-none bg-background text-white">
            <option value="every_24h">Every 24 hours</option>
            <option value="every_12h">Every 12 hours</option>
            <option value="every_6h">Every 6 hours</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <label htmlFor="m-email" className={label}>Alert email (optional)</label>
          <GlassInput id="m-email" name="alertEmail" type="email" placeholder="you@agency.com" />
        </div>
        <div className="md:col-span-3">
          <label htmlFor="m-slack" className={label}>Slack webhook (optional)</label>
          <GlassInput id="m-slack" name="slackWebhook" type="url" placeholder="https://hooks.slack.com/…" />
        </div>
        <div className="md:col-span-12">
          <GlassButton type="submit" isLoading={loading}>Add monitor</GlassButton>
          {error && <p role="alert" className="text-sm text-critical mt-3">{error}</p>}
        </div>
      </form>
    </GlassCard>
  );
}
