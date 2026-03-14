'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { PageLoader } from '@/components/ui/spinner';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '◈', section: null },
  // Growth
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: '⚡', section: 'Growth' },
  { href: '/dashboard/calendar', label: 'Calendar', icon: '◷', section: null },
  { href: '/dashboard/create', label: 'Studio', icon: '✨', section: null },
  // Automation
  { href: '/dashboard/agents', label: 'Agents', icon: '⬡', section: 'Automation' },
  { href: '/dashboard/jobs', label: 'Jobs', icon: '⟳', section: null },
  { href: '/dashboard/review', label: 'Review', icon: '◇', section: null },
  // Assets
  { href: '/dashboard/accounts', label: 'Accounts', icon: '◎', section: 'Assets' },
  { href: '/dashboard/media', label: 'Media', icon: '▣', section: null },
  // Analytics
  { href: '/dashboard/metrics', label: 'Metrics', icon: '△', section: 'Analytics' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⟡', section: null },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) return <PageLoader />;
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />

      {/* Sidebar */}
      <aside className="relative z-10 w-[260px] flex flex-col border-r border-white/[0.06] bg-background/80 backdrop-blur-xl">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary via-neon-pink to-neon-cyan flex items-center justify-center text-white font-display font-bold text-sm shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
                OP
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary via-neon-pink to-neon-cyan opacity-0 group-hover:opacity-40 blur-lg transition-opacity" />
            </div>
            <div>
              <span className="text-lg font-display font-bold gradient-text-subtle">
                OnlyPosts
              </span>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">AI Suite</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const showSection = item.section && (i === 0 || navItems[i - 1].section !== item.section);
            return (
              <div key={item.href}>
                {showSection && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-3 pt-4 pb-1">
                    {item.section}
                  </p>
                )}
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 mb-0.5',
                    isActive
                      ? 'nav-active-indicator bg-white/[0.06] text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
                  )}
                >
                  <span className={cn(
                    'text-base w-5 text-center transition-all',
                    isActive ? 'text-primary text-glow' : '',
                  )}>
                    {item.icon}
                  </span>
                  <span className="tracking-wide">{item.label}</span>
                  {isActive && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/50" />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/30 to-neon-pink/30 border border-white/[0.08] flex items-center justify-center text-sm font-display font-semibold text-primary">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 text-left text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-white/[0.04]"
          >
            <span className="text-xs">→</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
