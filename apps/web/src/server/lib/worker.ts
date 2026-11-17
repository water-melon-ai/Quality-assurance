export async function workerFetch(
  path: string,
  init: { method?: string; body?: unknown; userId?: string | null; ip?: string | null } = {}
): Promise<{ status: number; data: any }> {
  const base = process.env['WORKER_API_URL'] || 'http://localhost:4000';
  const key = process.env['INTERNAL_API_KEY'];
  if (!key) {
    return { status: 500, data: { success: false, error: 'Server is not configured: INTERNAL_API_KEY missing.' } };
  }

  try {
    const res = await fetch(`${base}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'content-type': 'application/json',
        'x-internal-key': key,
        ...(init.userId ? { 'x-user-id': init.userId } : {}),
        ...(init.ip ? { 'x-client-ip': init.ip } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : null,
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => ({ success: false, error: 'Bad response from scan engine.' }));
    return { status: res.status, data };
  } catch (err) {
    return {
      status: 503,
      data: { success: false, error: 'The scan engine is unreachable. Please try again in a moment.' },
    };
  }
}
