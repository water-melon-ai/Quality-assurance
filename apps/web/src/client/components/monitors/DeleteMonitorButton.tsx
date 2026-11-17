import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export function DeleteMonitorButton({ id, onDeleted }: { id: string; onDeleted?: () => void }) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm('Delete this monitor and its history?')) return;
    setBusy(true);
    try {
      await fetch(`/api/monitors/${id}`, { method: 'DELETE', credentials: 'include' });
      onDeleted?.();
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={busy}
      aria-label="Delete monitor"
      className="p-2 text-frost-300 hover:text-red-400 transition-colors bg-white/5 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
