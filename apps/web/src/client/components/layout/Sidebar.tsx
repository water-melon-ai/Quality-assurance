import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { LayoutDashboard, Activity, FileText, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Monitors', href: '/dashboard/monitors', icon: Activity },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar({ testsToday }: { testsToday: number }) {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-20 bottom-0 w-64 border-r border-white/5 bg-background/30 backdrop-blur-md hidden md:block">
      <div className="p-6 h-full flex flex-col gap-2">
        <div className="text-xs font-mono text-frost-300 uppercase tracking-widest mb-4 opacity-60">
          Menu
        </div>

        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-primary/30'
                  : 'text-frost-200 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-frost-300')} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}

        <div className="mt-auto">
          <div className="glass-card p-4 rounded-xl">
            <div className="text-xs font-mono text-frost-300 mb-1">Scans today</div>
            <div className="text-sm text-white">{testsToday} · unlimited &amp; free</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
