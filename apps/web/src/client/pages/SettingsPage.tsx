import { GlassCard } from '../components/ui/GlassCard';
import { useAuthUser } from '../lib/auth';

export function SettingsPage() {
  const { user } = useAuthUser();

  return (
    <div className="max-w-4xl">
      <h1 className="font-syne text-3xl font-bold text-white mb-2">Settings</h1>
      <p className="text-frost-300 mb-8">{user?.email}</p>
      <GlassCard className="p-8">
        <h2 className="text-xl font-bold text-white mb-1">Everything is free</h2>
        <p className="text-frost-300 text-sm">
          Unlimited scans, multi-page crawling, AI reports, PDF exports and automated monitors — no plans, no billing.
        </p>
      </GlassCard>
    </div>
  );
}
