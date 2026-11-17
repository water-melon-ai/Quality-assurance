/** Scheduled monitor runs: scan → compare with last score → record history → alert on drops. */
import * as database from '@frostflow/database';
import { enqueueMonitorJob } from '@frostflow/queue';
import type { MonitorJobPayload } from '@frostflow/types';
import { runScan } from './orchestrator';
import { sendEmailAlert, sendSlackAlert } from './alerts';

const SCHEDULES = ['every_6h', 'every_12h', 'every_24h'] as const;

export async function runMonitor(payload: MonitorJobPayload) {
  const monitor = await database.monitors.getMonitorById(payload.monitorId);
  if (!monitor || !monitor.active) return;

  const job = await database.jobs.createJob({ url: monitor.url, tier: 'agency', userId: monitor.userId });
  const outcome = await runScan({
    jobId: job.id, url: monitor.url, tier: 'agency', userId: monitor.userId, maxPages: payload.maxPages,
  });

  const drop = monitor.lastScore !== null ? monitor.lastScore - outcome.score : 0;
  const shouldAlert = monitor.lastScore !== null && drop >= monitor.alertOnScoreDrop;

  if (shouldAlert) {
    const msg = `FrostFlow alert: ${monitor.url} dropped from ${monitor.lastScore} to ${outcome.score} (grade ${outcome.grade}).`;
    if (monitor.slackWebhook) await sendSlackAlert(monitor.slackWebhook, msg);
    if (monitor.alertEmail) await sendEmailAlert(monitor.alertEmail, `Score drop on ${monitor.url}`, msg);
  }

  await database.monitors.addMonitorHistory({ monitorId: monitor.id, score: outcome.score, grade: outcome.grade, alertSent: shouldAlert });
  await database.monitors.updateMonitorAfterRun(monitor.id, outcome.score, outcome.grade);
}

/** Called when a monitor run failed for good, so it isn't re-queued every tick. */
export async function markMonitorRunFailed(monitorId: string) {
  await database.monitors.touchMonitorRun(monitorId).catch(() => undefined);
}

/** Enqueue every monitor that is due. Safe to call repeatedly (job ids de-duplicate). */
export async function scheduleDueMonitors() {
  for (const schedule of SCHEDULES) {
    const due = await database.monitors.getDueMonitors(schedule);
    for (const m of due) {
      await enqueueMonitorJob({ monitorId: m.id, url: m.url, userId: m.userId, maxPages: 10 }).catch((err) =>
        console.error('[scheduler] enqueue failed', m.id, err)
      );
    }
  }
}
