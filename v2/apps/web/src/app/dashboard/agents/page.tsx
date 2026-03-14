'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { agentApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner, EmptyState } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { platformIcon, platformColor, formatRelative } from '@/lib/utils';
import { toast } from 'sonner';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { agents } = await agentApi.list();
      setAgents(agents);
    } catch {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleAgent = async (id: string) => {
    try {
      const { agent } = await agentApi.toggle(id);
      setAgents((prev) => prev.map((a) => (a.id === id ? agent : a)));
      toast.success(`Agent ${agent.is_enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to toggle agent');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Agents</h1>
          <p className="text-muted-foreground mt-1">AI agents that manage your social media</p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button variant="glow">+ Create Agent</Button>
        </Link>
      </div>

      {agents.length === 0 ? (
        <EmptyState
          icon="⬡"
          title="No agents yet"
          description="Create your first AI agent to start automating your social media."
          action={
            <Link href="/dashboard/agents/new">
              <Button variant="glow">Create Agent</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent, i) => (
            <div
              key={agent.id}
              className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 gradient-border-animated"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    agent.is_enabled
                      ? 'bg-gradient-to-br from-primary/30 to-neon-pink/20 border border-primary/20'
                      : 'bg-white/[0.04] border border-white/[0.06]'
                  }`}>
                    ⬡
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/agents/${agent.id}`}
                      className="font-display font-semibold hover:text-primary transition-colors"
                    >
                      {agent.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${platformColor(agent.platform)}`}>
                        {platformIcon(agent.platform)} {agent.platform}
                      </span>
                    </div>
                  </div>
                </div>
                <Switch
                  checked={agent.is_enabled}
                  onCheckedChange={() => toggleAgent(agent.id)}
                />
              </div>

              {agent.personality && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{agent.personality}</p>
              )}

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {agent.auto_post && <Badge variant="neon">Posts</Badge>}
                {agent.auto_reply && <Badge variant="neon">Replies</Badge>}
                {agent.auto_dm && <Badge variant="neon">DMs</Badge>}
                {agent.auto_engage && <Badge variant="neon">Engage</Badge>}
                {agent.auto_web_research && <Badge variant="glow">⟡ Research</Badge>}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/[0.06] pt-4">
                <span className="font-mono">{agent.total_actions || 0} actions</span>
                <span className="flex items-center gap-1.5">
                  {agent.approval_mode === 'auto' && <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Auto</>}
                  {agent.approval_mode === 'review' && <><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Review</>}
                  {agent.approval_mode === 'auto_with_guardrails' && <><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Guardrails</>}
                </span>
                {agent.last_action_at && <span>{formatRelative(agent.last_action_at)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
