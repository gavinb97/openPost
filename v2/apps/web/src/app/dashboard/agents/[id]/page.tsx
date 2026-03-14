'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { agentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner, EmptyState, PageLoader } from '@/components/ui/spinner';
import { platformIcon, platformColor, formatRelative, statusColor, truncate, cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Countdown ──────────────────────────────────────────────────────────────────

function formatCountdown(isoString: string | null | undefined): string {
  if (!isoString) return 'Not scheduled yet';
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (diffMs < -60_000) return 'Overdue — processing soon';
  if (diffMs < 0) return 'Any moment now';
  const totalSeconds = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `Next action in ${h}h ${m}m`;
  if (m > 0) return `Next action in ${m}m`;
  return `Next action in ${s}s`;
}

function NextActionCountdown({ nextActionAt }: { nextActionAt: string | null | undefined }) {
  const [label, setLabel] = useState(() => formatCountdown(nextActionAt));

  useEffect(() => {
    setLabel(formatCountdown(nextActionAt));
    const interval = setInterval(() => setLabel(formatCountdown(nextActionAt)), 30_000);
    return () => clearInterval(interval);
  }, [nextActionAt]);

  const isOverdue = nextActionAt && new Date(nextActionAt).getTime() < Date.now() - 60_000;
  const notScheduled = !nextActionAt;

  return (
    <span className={cn(
      'text-sm font-medium',
      notScheduled ? 'text-muted-foreground' : isOverdue ? 'text-yellow-400' : 'text-green-400'
    )}>
      {label}
    </span>
  );
}

// ── Schedule summary ───────────────────────────────────────────────────────────

function scheduleLabel(type: string, config: Record<string, any>): string {
  if (!type) return '—';
  switch (type) {
    case 'random':
      return `Random ${config.min_minutes ?? 30}–${config.max_minutes ?? 240} min`;
    case 'interval':
      return `Every ${config.interval_minutes ?? 60} min`;
    case 'cron':
      return `Cron: ${config.expression ?? '—'}`;
    case 'set_times': {
      const times: string[] = config.times ?? [];
      return times.length ? `Daily at ${times.join(', ')}` : 'Set times (none configured)';
    }
    case 'peak_hours':
      return `Peak hours: ${config.platform ? String(config.platform).charAt(0).toUpperCase() + String(config.platform).slice(1) : '—'}`;
    case 'burst':
      return `Burst ${config.burst_count ?? 3}× every ${config.burst_interval_minutes ?? 5} min, cooldown ${config.cooldown_hours ?? 4}h`;
    case 'business_hours':
      return `Business hours ${config.start_hour ?? 9}:00–${config.end_hour ?? 17}:00, every ${config.interval_minutes ?? 60} min`;
    default:
      return type;
  }
}

// ── Scheduled-at formatter ─────────────────────────────────────────────────────

function formatScheduledAt(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = Date.now();
  const diffMs = date.getTime() - now;
  if (diffMs > 0) {
    // future
    return `Scheduled for ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return formatRelative(isoString);
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionsPage, setActionsPage] = useState(1);
  const [totalActions, setTotalActions] = useState(0);

  const load = useCallback(async () => {
    try {
      const [agRes, acRes, cvRes] = await Promise.all([
        agentApi.get(id),
        agentApi.actions(id),
        agentApi.conversations(id),
      ]);
      setAgent(agRes.agent);
      setActions(acRes.actions);
      setTotalActions(acRes.total);
      setConversations(cvRes.conversations);
    } catch {
      toast.error('Agent not found');
      router.push('/dashboard/agents');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
    // Refresh agent (for next_action_at countdown) every 30 seconds
    const interval = setInterval(() => {
      agentApi.get(id).then((res) => setAgent(res.agent)).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [id, load]);

  const toggleAgent = async () => {
    try {
      const { agent: updated } = await agentApi.toggle(id);
      setAgent(updated);
      toast.success(`Agent ${updated.enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to toggle agent');
    }
  };

  const deleteAgent = async () => {
    if (!confirm('Are you sure you want to delete this agent? This cannot be undone.')) return;
    try {
      await agentApi.delete(id);
      toast.success('Agent deleted');
      router.push('/dashboard/agents');
    } catch {
      toast.error('Failed to delete agent');
    }
  };

  if (loading) return <PageLoader />;
  if (!agent) return null;

  const engagements = (agent.likes_given ?? 0) + (agent.follows_made ?? 0);

  const capabilities = [
    { key: 'auto_post', label: 'Auto Post' },
    { key: 'auto_reply', label: 'Auto Reply' },
    { key: 'auto_comment', label: 'Auto Comment' },
    { key: 'auto_like', label: 'Auto Like' },
    { key: 'auto_follow', label: 'Auto Follow' },
    { key: 'auto_retweet', label: 'Auto Retweet' },
    { key: 'auto_dm', label: 'Auto DM' },
    { key: 'auto_web_research', label: 'Web Research' },
  ].filter(({ key }) => agent[key]);

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold truncate">{agent.name}</h1>
          {agent.personality_prompt && (
            <p className="text-muted-foreground mt-1 max-w-xl text-sm">{truncate(agent.personality_prompt, 160)}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{agent.enabled ? 'Active' : 'Paused'}</span>
            <Switch checked={!!agent.enabled} onCheckedChange={toggleAgent} />
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/agents/${id}/edit`)}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={deleteAgent}>
            Delete
          </Button>
        </div>
      </div>

      {/* ── Status bar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className={cn('w-2 h-2 rounded-full shrink-0', agent.enabled ? 'bg-green-400' : 'bg-zinc-500')} />
        <NextActionCountdown nextActionAt={agent.next_action_at} />
        {agent.last_active_at && (
          <span className="text-xs text-muted-foreground ml-auto">
            Last active {formatRelative(agent.last_active_at)}
          </span>
        )}
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{agent.posts_made ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Posts Made</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{agent.replies_sent ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Replies Sent</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{agent.dms_sent ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">DMs Sent</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{engagements}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Engagements</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Capabilities + Schedule ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {capabilities.length > 0 ? (
          capabilities.map(({ key, label }) => (
            <Badge key={key} variant={key === 'auto_web_research' ? 'secondary' : 'default'}>
              {label}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No capabilities enabled</span>
        )}

        {agent.schedule_type && (
          <span className="ml-auto text-xs text-muted-foreground px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02]">
            {scheduleLabel(agent.schedule_type, agent.schedule_config ?? {})}
          </span>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <Tabs defaultValue="actions">
        <TabsList>
          <TabsTrigger value="actions">Actions ({totalActions})</TabsTrigger>
          <TabsTrigger value="conversations">Conversations ({conversations.length})</TabsTrigger>
        </TabsList>

        {/* Actions */}
        <TabsContent value="actions">
          {actions.length === 0 ? (
            <EmptyState icon="⚡" title="No actions yet" description="This agent hasn't performed any actions." />
          ) : (
            <div className="space-y-2">
              {actions.map((action: any) => (
                <Card key={action.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <CardContent className="p-4 flex items-start gap-3">
                    {/* Status + type badges */}
                    <div className="flex flex-col gap-1.5 shrink-0 pt-0.5">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', statusColor(action.status))}>
                        {action.status}
                      </span>
                      <Badge variant="outline" className="text-[11px]">{action.action_type}</Badge>
                    </div>

                    {/* Content preview */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/90 leading-snug">
                        {action.content_text ? truncate(action.content_text, 180) : (action.target_id ? `Target: ${action.target_id}` : '—')}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {/* Scheduled at */}
                        {action.scheduled_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatScheduledAt(action.scheduled_at)}
                          </span>
                        )}
                        {/* Fallback to created_at */}
                        {!action.scheduled_at && action.created_at && (
                          <span className="text-xs text-muted-foreground">{formatRelative(action.created_at)}</span>
                        )}
                        {/* Published URL */}
                        {action.platform_url && (
                          <Link
                            href={action.platform_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View post →
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {totalActions > actions.length && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    const next = actionsPage + 1;
                    const res = await agentApi.actions(id, next);
                    setActions((prev) => [...prev, ...res.actions]);
                    setActionsPage(next);
                  }}
                >
                  Load more
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* Conversations */}
        <TabsContent value="conversations">
          {conversations.length === 0 ? (
            <EmptyState icon="💬" title="No conversations" description="Conversation history will appear here as the agent interacts." />
          ) : (
            <div className="space-y-2">
              {conversations.map((conv: any) => (
                <Card key={conv.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{conv.target_username}</Badge>
                        <span className="text-xs text-muted-foreground">{conv.message_count} messages</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatRelative(conv.updated_at)}</span>
                    </div>
                    {conv.context_summary && (
                      <p className="text-sm text-muted-foreground">{truncate(conv.context_summary, 200)}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
