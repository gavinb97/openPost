'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { agentApi, oauthApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

export default function NewAgentPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    platform: 'twitter',
    personality: '',
    approval_mode: 'auto_with_guardrails',
    auto_post: true,
    auto_reply: false,
    auto_dm: false,
    auto_engage: true,
    auto_web_research: false,
    web_research_config: {
      search_queries: [] as string[],
      rss_feeds: [] as string[],
      sources: { reddit: true, duckduckgo: true, hackernews: true, rss: true },
      research_depth: 'basic' as 'basic' | 'deep',
    },
    schedule_type: 'random',
    schedule_config: { min_interval_minutes: 30, max_interval_minutes: 120 },
    platform_account_ids: [] as string[],
  });
  const [queryInput, setQueryInput] = useState('');
  const [rssInput, setRssInput] = useState('');

  useEffect(() => {
    oauthApi.accounts().then(({ accounts }) => setAccounts(accounts)).catch(() => {});
  }, []);

  const filteredAccounts = accounts.filter((a) => a.platform === form.platform);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { agent } = await agentApi.create(form);
      toast.success('Agent created!');
      router.push(`/dashboard/agents/${agent.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Agent</h1>
        <p className="text-muted-foreground mt-1">Set up a new AI agent to manage a platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                placeholder="My Twitter Agent"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v, platform_account_ids: [] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">𝕏 Twitter</SelectItem>
                  <SelectItem value="reddit">🔴 Reddit</SelectItem>
                  <SelectItem value="youtube">▶️ YouTube</SelectItem>
                  <SelectItem value="tiktok">♪ TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Connected Account</Label>
              {filteredAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-1">
                  No {form.platform} accounts connected.{' '}
                  <a href="/dashboard/accounts" className="text-primary hover:underline">Connect one →</a>
                </p>
              ) : (
                <Select
                  value={form.platform_account_ids[0] || ''}
                  onValueChange={(v) => setForm({ ...form, platform_account_ids: [v] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        @{acc.platform_username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="personality">Personality / System Prompt</Label>
              <Textarea
                id="personality"
                placeholder="You are a witty tech enthusiast who shares insights about AI and startups..."
                value={form.personality}
                onChange={(e) => setForm({ ...form, personality: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This defines how your agent writes. Leave blank for default personality.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
            <CardDescription>Choose what this agent can do</CardDescription>
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

        {/* Content Approval */}
        <Card>
          <CardHeader>
            <CardTitle>⟡ Web Research</CardTitle>
            <CardDescription>Let the agent research trending news before posting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Web Research</Label>
                <p className="text-xs text-muted-foreground">Agent will search the web for fresh info and create posts based on findings</p>
              </div>
              <Switch checked={form.auto_web_research} onCheckedChange={(v) => setForm({ ...form, auto_web_research: v })} />
            </div>

            {form.auto_web_research && (
              <>
                {/* Search queries */}
                <div>
                  <Label>Search Queries</Label>
                  <p className="text-xs text-muted-foreground mb-2">Topics to research (e.g. "bitcoin price", "AI startups", "tech IPOs")</p>
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
                                search_queries: [...form.web_research_config.search_queries, queryInput.trim()],
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
                            search_queries: [...form.web_research_config.search_queries, queryInput.trim()],
                          },
                        });
                        setQueryInput('');
                      }
                    }}>Add</Button>
                  </div>
                  {form.web_research_config.search_queries.length > 0 && (
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

                {/* Sources */}
                <div>
                  <Label>Research Sources</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[
                      { key: 'reddit', label: '● Reddit', desc: 'Hot posts & discussions' },
                      { key: 'duckduckgo', label: '🔍 DuckDuckGo', desc: 'Web search + Twitter discovery' },
                      { key: 'hackernews', label: '◈ Hacker News', desc: 'Tech & startup news' },
                      { key: 'rss', label: '◎ RSS / Google News', desc: 'News feeds & custom RSS' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-[11px] text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={(form.web_research_config.sources as any)[key] ?? true}
                          onCheckedChange={(v) => setForm({
                            ...form,
                            web_research_config: {
                              ...form.web_research_config,
                              sources: { ...form.web_research_config.sources, [key]: v },
                            },
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* RSS Feeds */}
                {form.web_research_config.sources.rss && (
                  <div>
                    <Label>Custom RSS Feeds <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <p className="text-xs text-muted-foreground mb-2">Google News is included by default. Add custom RSS URLs here.</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/feed.xml"
                        value={rssInput}
                        onChange={(e) => setRssInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (rssInput.trim()) {
                              setForm({
                                ...form,
                                web_research_config: {
                                  ...form.web_research_config,
                                  rss_feeds: [...form.web_research_config.rss_feeds, rssInput.trim()],
                                },
                              });
                              setRssInput('');
                            }
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        if (rssInput.trim()) {
                          setForm({
                            ...form,
                            web_research_config: {
                              ...form.web_research_config,
                              rss_feeds: [...form.web_research_config.rss_feeds, rssInput.trim()],
                            },
                          });
                          setRssInput('');
                        }
                      }}>Add</Button>
                    </div>
                    {form.web_research_config.rss_feeds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.web_research_config.rss_feeds.map((url: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs border border-cyan-500/20 max-w-full truncate">
                            {url}
                            <button type="button" className="hover:text-red-400 flex-shrink-0" onClick={() => setForm({
                              ...form,
                              web_research_config: {
                                ...form.web_research_config,
                                rss_feeds: form.web_research_config.rss_feeds.filter((_: string, j: number) => j !== i),
                              },
                            })}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Research depth */}
                <div>
                  <Label>Research Depth</Label>
                  <Select
                    value={form.web_research_config.research_depth}
                    onValueChange={(v: 'basic' | 'deep') => setForm({
                      ...form,
                      web_research_config: { ...form.web_research_config, research_depth: v },
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic — Quick scan (4-5 results per source)</SelectItem>
                      <SelectItem value="deep">Deep — Thorough research (8-10 results per source)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Content Approval */}
        <Card>
          <CardHeader>
            <CardTitle>Content Approval</CardTitle>
            <CardDescription>How generated content should be handled</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={form.approval_mode}
              onValueChange={(v) => setForm({ ...form, approval_mode: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">🟢 Auto — Post immediately</SelectItem>
                <SelectItem value="review">🟡 Review — Queue for manual approval</SelectItem>
                <SelectItem value="auto_with_guardrails">🔵 Guardrails — Auto with safety checks</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {form.approval_mode === 'auto' && 'Content will be posted immediately without review.'}
              {form.approval_mode === 'review' && 'All content will be queued for your manual approval.'}
              {form.approval_mode === 'auto_with_guardrails' && 'Content is auto-posted unless AI safety flags detect issues.'}
            </p>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>How often should the agent act</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={form.schedule_type}
              onValueChange={(v) => setForm({ ...form, schedule_type: v as any })}
            >
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
                  <Label>Min interval (minutes)</Label>
                  <Input
                    type="number"
                    min={5}
                    value={form.schedule_config.min_interval_minutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        schedule_config: { ...form.schedule_config, min_interval_minutes: Number(e.target.value) },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Max interval (minutes)</Label>
                  <Input
                    type="number"
                    min={5}
                    value={form.schedule_config.max_interval_minutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        schedule_config: { ...form.schedule_config, max_interval_minutes: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? <Spinner size="sm" /> : 'Create Agent'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
