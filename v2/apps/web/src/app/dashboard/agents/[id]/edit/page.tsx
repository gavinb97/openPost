'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { agentApi, oauthApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { PageLoader, Spinner } from '@/components/ui/spinner';

export default function EditAgentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [queryInput, setQueryInput] = useState('');
  const [rssInput, setRssInput] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [agRes, accRes] = await Promise.all([agentApi.get(id), oauthApi.accounts()]);
        const agent = agRes.agent;
        setForm({
          name: agent.name,
          personality: agent.personality || '',
          approval_mode: agent.approval_mode,
          auto_post: agent.auto_post,
          auto_reply: agent.auto_reply,
          auto_dm: agent.auto_dm,
          auto_engage: agent.auto_engage,
          auto_web_research: agent.auto_web_research || false,
          web_research_config: {
            search_queries: agent.web_research_config?.search_queries || [],
            rss_feeds: agent.web_research_config?.rss_feeds || [],
            sources: agent.web_research_config?.sources || { reddit: true, duckduckgo: true, hackernews: true, rss: true },
            research_depth: agent.web_research_config?.research_depth || 'basic',
          },
          schedule_type: agent.schedule_type,
          schedule_config: agent.schedule_config || { min_interval_minutes: 30, max_interval_minutes: 120 },
        });
        setAccounts(accRes.accounts);
      } catch {
        toast.error('Failed to load agent');
        router.push('/dashboard/agents');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await agentApi.update(id, form);
      toast.success('Agent updated!');
      router.push(`/dashboard/agents/${id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update agent');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Agent</h1>
        <p className="text-muted-foreground mt-1">Update agent configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Agent Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="personality">Personality / System Prompt</Label>
              <Textarea
                id="personality"
                value={form.personality}
                onChange={(e) => setForm({ ...form, personality: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Post</Label>
                <p className="text-xs text-muted-foreground">Create and publish new posts</p>
              </div>
              <Switch checked={form.auto_post} onCheckedChange={(v) => setForm({ ...form, auto_post: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Reply</Label>
                <p className="text-xs text-muted-foreground">Reply to comments and mentions</p>
              </div>
              <Switch checked={form.auto_reply} onCheckedChange={(v) => setForm({ ...form, auto_reply: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto DM</Label>
                <p className="text-xs text-muted-foreground">Send direct messages to targets</p>
              </div>
              <Switch checked={form.auto_dm} onCheckedChange={(v) => setForm({ ...form, auto_dm: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Engage</Label>
                <p className="text-xs text-muted-foreground">Like, follow, retweet, subscribe</p>
              </div>
              <Switch checked={form.auto_engage} onCheckedChange={(v) => setForm({ ...form, auto_engage: v })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⟡ Web Research</CardTitle>
            <CardDescription>Let the agent research trending news before posting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Web Research</Label>
                <p className="text-xs text-muted-foreground">Search the web for fresh info and create posts based on findings</p>
              </div>
              <Switch checked={form.auto_web_research} onCheckedChange={(v) => setForm({ ...form, auto_web_research: v })} />
            </div>

            {form.auto_web_research && (
              <>
                <div>
                  <Label>Search Queries</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a search query..."
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (queryInput.trim()) {
                            setForm({
                              ...form,
                              web_research_config: {
                                ...form.web_research_config,
                                search_queries: [...(form.web_research_config.search_queries || []), queryInput.trim()],
                              },
                            });
                            setQueryInput('');
                          }
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      if (queryInput.trim()) {
                        setForm({
                          ...form,
                          web_research_config: {
                            ...form.web_research_config,
                            search_queries: [...(form.web_research_config.search_queries || []), queryInput.trim()],
                          },
                        });
                        setQueryInput('');
                      }
                    }}>Add</Button>
                  </div>
                  {(form.web_research_config.search_queries || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.web_research_config.search_queries.map((q: string, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">
                          {q}
                          <button type="button" className="hover:text-red-400" onClick={() => setForm({
                            ...form,
                            web_research_config: {
                              ...form.web_research_config,
                              search_queries: form.web_research_config.search_queries.filter((_: string, j: number) => j !== i),
                            },
                          })}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Research Sources</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[
                      { key: 'reddit', label: '● Reddit', desc: 'Hot posts & discussions' },
                      { key: 'duckduckgo', label: '🔍 DuckDuckGo', desc: 'Web + Twitter discovery' },
                      { key: 'hackernews', label: '◈ Hacker News', desc: 'Tech & startup news' },
                      { key: 'rss', label: '◎ RSS / Google News', desc: 'News feeds & custom RSS' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-[11px] text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={(form.web_research_config.sources || {})[key] ?? true}
                          onCheckedChange={(v) => setForm({
                            ...form,
                            web_research_config: {
                              ...form.web_research_config,
                              sources: { ...(form.web_research_config.sources || {}), [key]: v },
                            },
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Research Depth</Label>
                  <Select
                    value={form.web_research_config.research_depth || 'basic'}
                    onValueChange={(v) => setForm({
                      ...form,
                      web_research_config: { ...form.web_research_config, research_depth: v },
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic — Quick scan</SelectItem>
                      <SelectItem value="deep">Deep — Thorough research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={form.approval_mode} onValueChange={(v) => setForm({ ...form, approval_mode: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">🟢 Auto — Post immediately</SelectItem>
                <SelectItem value="review">🟡 Review — Queue for manual approval</SelectItem>
                <SelectItem value="auto_with_guardrails">🔵 Guardrails — Auto with safety checks</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={form.schedule_type} onValueChange={(v) => setForm({ ...form, schedule_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random intervals</SelectItem>
                <SelectItem value="interval">Fixed interval</SelectItem>
                <SelectItem value="cron">Cron schedule</SelectItem>
              </SelectContent>
            </Select>
            {form.schedule_type === 'random' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min interval (min)</Label>
                  <Input
                    type="number"
                    min={5}
                    value={form.schedule_config.min_interval_minutes}
                    onChange={(e) =>
                      setForm({ ...form, schedule_config: { ...form.schedule_config, min_interval_minutes: Number(e.target.value) } })
                    }
                  />
                </div>
                <div>
                  <Label>Max interval (min)</Label>
                  <Input
                    type="number"
                    min={5}
                    value={form.schedule_config.max_interval_minutes}
                    onChange={(e) =>
                      setForm({ ...form, schedule_config: { ...form.schedule_config, max_interval_minutes: Number(e.target.value) } })
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? <Spinner size="sm" /> : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
