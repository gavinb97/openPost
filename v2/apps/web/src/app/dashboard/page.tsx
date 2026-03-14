'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { metricsApi, agentApi } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { formatRelative, platformIcon, statusColor } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ov, tl, lb] = await Promise.all([
          metricsApi.overview(),
          metricsApi.timeline(7),
          metricsApi.leaderboard(),
        ]);
        setOverview(ov);
        setTimeline(tl.timeline || []);
        setLeaderboard(lb.leaderboard || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const totalAccounts = overview?.accounts ? Object.values(overview.accounts).reduce((a: number, b: any) => a + Number(b), 0) : 0;
  const total24h = overview?.actions_24h?.reduce((a: number, b: any) => a + b.count, 0) || 0;

  const stats = [
    { label: 'Active Agents', value: overview?.agents?.active || 0, icon: '⬡', gradient: 'from-emerald-500/20 to-emerald-600/5', textColor: 'text-emerald-400', glowColor: 'shadow-emerald-500/10' },
    { label: 'Connected Accounts', value: totalAccounts, icon: '◎', gradient: 'from-blue-500/20 to-blue-600/5', textColor: 'text-blue-400', glowColor: 'shadow-blue-500/10' },
    { label: 'Actions (24h)', value: total24h, icon: '⚡', gradient: 'from-primary/20 to-neon-pink/5', textColor: 'text-primary', glowColor: 'shadow-primary/10' },
    { label: 'Pending Reviews', value: overview?.pending_reviews || 0, icon: '◇', gradient: 'from-amber-500/20 to-amber-600/5', textColor: 'text-amber-400', glowColor: 'shadow-amber-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your AI agents at a glance</p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button variant="glow">+ New Agent</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`stat-card relative rounded-2xl border border-white/[0.06] bg-gradient-to-b ${stat.gradient} backdrop-blur-sm p-6 shadow-lg ${stat.glowColor} hover:border-white/[0.1] transition-all duration-300`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</p>
                <p className={`text-4xl font-display font-bold mt-2 ${stat.textColor} stat-number`}>{stat.value}</p>
              </div>
              <span className={`text-2xl ${stat.textColor} opacity-40`}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Activity + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Activity — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No activity yet. Create your first agent to get started!</p>
            ) : (
              <div className="flex items-end gap-2 h-52">
                {timeline.map((day: any, i: number) => {
                  const max = Math.max(...timeline.map((d: any) => Number(d.count) || 1));
                  const height = Math.max(((Number(day.count) || 0) / max) * 100, 4);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                        {day.count}
                      </span>
                      <div className="w-full relative rounded-t-md overflow-hidden" style={{ height: `${height}%` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-neon-pink/60 group-hover:from-primary group-hover:to-neon-pink transition-colors animate-bar-grow origin-bottom" />
                        <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No agents yet</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((agent: any, i: number) => (
                  <Link
                    key={agent.id}
                    href={`/dashboard/agents/${agent.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all duration-200 group"
                  >
                    <span className={`text-sm font-display font-bold w-6 text-center ${
                      i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{agent.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {agent.total_actions} actions
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{platformIcon(agent.platform)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
