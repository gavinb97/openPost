'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { agentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner, EmptyState, PageLoader } from '@/components/ui/spinner';
import { platformIcon, platformColor, formatRelative, statusColor, truncate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionsPage, setActionsPage] = useState(1);
  const [totalActions, setTotalActions] = useState(0);

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, [id, router]);

  const toggleAgent = async () => {
    const { agent: updated } = await agentApi.toggle(id);
    setAgent(updated);
    toast.success(`Agent ${updated.is_enabled ? 'enabled' : 'disabled'}`);
  };

  const deleteAgent = async () => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    await agentApi.delete(id);
    toast.success('Agent deleted');
    router.push('/dashboard/agents');
  };

  if (loading) return <PageLoader />;
  if (!agent) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <span className={`inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full ${platformColor(agent.platform)}`}>
              {platformIcon(agent.platform)} {agent.platform}
            </span>
          </div>
          {agent.personality && (
            <p className="text-muted-foreground mt-2 max-w-xl">{agent.personality}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{agent.is_enabled ? 'Active' : 'Paused'}</span>
            <Switch checked={agent.is_enabled} onCheckedChange={toggleAgent} />
          </div>
          <Button variant="outline" onClick={() => router.push(`/dashboard/agents/${id}/edit`)}>
            Edit
          </Button>
          <Button variant="destructive" onClick={deleteAgent}>
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{agent.total_actions || 0}</p>
            <p className="text-xs text-muted-foreground">Total Actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold capitalize">{agent.approval_mode?.replace('_', ' ')}</p>
            <p className="text-xs text-muted-foreground">Approval Mode</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold capitalize">{agent.schedule_type}</p>
            <p className="text-xs text-muted-foreground">Schedule</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{agent.last_action_at ? formatRelative(agent.last_action_at) : '—'}</p>
            <p className="text-xs text-muted-foreground">Last Action</p>
          </CardContent>
        </Card>
      </div>

      {/* Capabilities */}
      <div className="flex gap-2">
        {agent.auto_post && <Badge>Auto Post</Badge>}
        {agent.auto_reply && <Badge>Auto Reply</Badge>}
        {agent.auto_dm && <Badge>Auto DM</Badge>}
        {agent.auto_engage && <Badge>Auto Engage</Badge>}
        {agent.auto_web_research && <Badge variant="secondary">⟡ Web Research</Badge>}
      </div>

      {/* Tabs: Actions + Conversations */}
      <Tabs defaultValue="actions">
        <TabsList>
          <TabsTrigger value="actions">Actions ({totalActions})</TabsTrigger>
          <TabsTrigger value="conversations">Conversations ({conversations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="actions">
          {actions.length === 0 ? (
            <EmptyState icon="⚡" title="No actions yet" description="This agent hasn't performed any actions." />
          ) : (
            <div className="space-y-2">
              {actions.map((action: any) => (
                <Card key={action.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor(action.status)}`}>
                      {action.status}
                    </span>
                    <Badge variant="outline">{action.action_type}</Badge>
                    <p className="text-sm flex-1 truncate">{action.content || action.target_id || '—'}</p>
                    <span className="text-xs text-muted-foreground">{formatRelative(action.created_at)}</span>
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

        <TabsContent value="conversations">
          {conversations.length === 0 ? (
            <EmptyState icon="💬" title="No conversations" description="Conversation history will appear here as the agent interacts." />
          ) : (
            <div className="space-y-2">
              {conversations.map((conv: any) => (
                <Card key={conv.id}>
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
