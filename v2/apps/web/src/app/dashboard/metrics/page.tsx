'use client';

import { useEffect, useState } from 'react';
import { metricsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { platformIcon, platformColor } from '@/lib/utils';

export default function MetricsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [ov, tl, lb] = await Promise.all([
        metricsApi.overview(),
        metricsApi.timeline(Number(days)),
        metricsApi.leaderboard(),
      ]);
      setOverview(ov);
      setTimeline(tl.timeline || []);
      setLeaderboard(lb.leaderboard || []);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [days]);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const maxCount = Math.max(...timeline.map((d: any) => Number(d.count) || 0), 1);

  const statCards = [
    {
      label: 'Active Agents',
      value: overview?.agents?.active || 0,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      accent: 'text-emerald-400',
      glow: 'shadow-emerald-500/10',
    },
    {
      label: 'Actions (24h)',
      value: overview?.actions_24h?.reduce((a: number, b: any) => a + b.count, 0) || 0,
      gradient: 'from-neon-cyan/20 to-neon-cyan/5',
      accent: 'text-cyan-400',
      glow: 'shadow-cyan-500/10',
    },
    {
      label: 'Total Actions',
      value: overview?.actions_all?.reduce((a: number, b: any) => a + b.count, 0) || 0,
      gradient: 'from-primary/20 to-primary/5',
      accent: 'text-primary',
      glow: 'shadow-primary/10',
    },
    {
      label: 'Pending Reviews',
      value: overview?.pending_reviews || 0,
      gradient: 'from-amber-500/20 to-amber-500/5',
      accent: 'text-amber-400',
      glow: 'shadow-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Metrics</h1>
          <p className="text-muted-foreground mt-1">Analytics and performance overview</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-36 bg-white/[0.03] border-white/[0.08]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-xl border-white/[0.08]">
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`stat-card rounded-2xl border border-white/[0.06] bg-gradient-to-br ${card.gradient} p-6 text-center shadow-lg ${card.glow}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <p className={`text-3xl font-display font-bold ${card.accent} stat-number`}>
              {card.value}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6">
        <h2 className="text-lg font-display font-semibold mb-6">Activity Timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No data for this period</p>
        ) : (
          <div className="flex items-end gap-1 h-64 overflow-x-auto">
            {timeline.map((day: any, i: number) => {
              const count = Number(day.count) || 0;
              const height = Math.max((count / maxCount) * 100, 2);
              return (
                <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group">
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {count}
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-primary/80 to-neon-pink/60 hover:from-primary hover:to-neon-pink rounded-t transition-all duration-300 animate-bar-grow"
                    style={{ height: `${height}%`, animationDelay: `${i * 0.02}s` }}
                    title={`${day.date}: ${count} actions`}
                  />
                  {(i % Math.ceil(timeline.length / 10) === 0 || i === timeline.length - 1) && (
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap font-mono">
                      {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6">
        <h2 className="text-lg font-display font-semibold mb-6">Agent Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No agent activity yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left">
                  <th className="pb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">#</th>
                  <th className="pb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Agent</th>
                  <th className="pb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Platform</th>
                  <th className="pb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider text-right">Posts</th>
                  <th className="pb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider text-right">Replies</th>
                  <th className="pb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider text-right">DMs</th>
                  <th className="pb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((agent: any, i: number) => (
                  <tr
                    key={agent.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3">
                      <span className={`font-display font-bold ${
                        i === 0 ? 'text-amber-400' :
                        i === 1 ? 'text-gray-300' :
                        i === 2 ? 'text-orange-400' :
                        'text-muted-foreground'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 font-display font-medium">{agent.name}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${platformColor(agent.platform)}`}>
                        {platformIcon(agent.platform)} {agent.platform}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-muted-foreground">{agent.posts || 0}</td>
                    <td className="py-3 text-right font-mono text-muted-foreground">{agent.replies || 0}</td>
                    <td className="py-3 text-right font-mono text-muted-foreground">{agent.dms || 0}</td>
                    <td className="py-3 text-right font-mono font-bold text-foreground">{agent.total_actions || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Platform breakdown */}
      {overview?.accounts?.by_platform && Object.keys(overview.accounts.by_platform).length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6">
          <h2 className="text-lg font-display font-semibold mb-6">Platform Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(overview.accounts.by_platform).map(([platform, count]: [string, any]) => (
              <div
                key={platform}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-colors"
              >
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${platformColor(platform)}`}>
                  {platformIcon(platform)}
                </span>
                <div>
                  <p className="font-display font-medium capitalize">{platform}</p>
                  <p className="text-sm text-muted-foreground font-mono">{count} account{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
