/** Monitor alert delivery: Slack webhook + Resend email. Failures are logged, never thrown. */
import { Resend } from 'resend';

export async function sendSlackAlert(webhookUrl: string, text: string) {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error('[alerts] Slack responded', res.status);
  } catch (err) {
    console.error('[alerts] Slack failed:', err);
  }
}

export async function sendEmailAlert(to: string, subject: string, text: string) {
  const key = process.env['RESEND_API_KEY'];
  if (!key) return;
  try {
    const { error } = await new Resend(key).emails.send({
      from: process.env['RESEND_FROM'] || 'FrostFlow <onboarding@resend.dev>',
      to,
      subject,
      text,
    });
    if (error) console.error('[alerts] Resend error:', error);
  } catch (err) {
    console.error('[alerts] Email failed:', err);
  }
}
