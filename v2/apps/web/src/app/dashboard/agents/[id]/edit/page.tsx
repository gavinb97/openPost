'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { agentApi, oauthApi, mediaApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHEDULE_TYPES = [
  { id: 'random',         label: 'Random',         desc: 'Post at random intervals within a range' },
  { id: 'interval',       label: 'Fixed Interval',  desc: 'Post every N minutes' },
  { id: 'cron',           label: 'Cron',            desc: 'Use a cron expression for full control' },
  { id: 'set_times',      label: 'Set Times',       desc: 'Post at specific times of day' },
  { id: 'peak_hours',     label: 'Peak Hours',      desc: 'Post during peak platform hours' },
  { id: 'burst',          label: 'Burst',           desc: 'Post in bursts with cooldown periods' },
  { id: 'business_hours', label: 'Business Hours',  desc: 'Post only during business hours' },
];

const SCHEDULE_DEFAULTS: Record<string, any> = {
  random:         { min_minutes: 30, max_minutes: 240 },
  interval:       { interval_minutes: 60 },
  cron:           { expression: '0 */2 * * *' },
  set_times:      { times: [], days: [0, 1, 2, 3, 4, 5, 6] },
  peak_hours:     { platform: 'twitter' },
  burst:          { burst_count: 3, burst_interval_minutes: 5, cooldown_hours: 4 },
  business_hours: { start_hour: 9, end_hour: 17, interval_minutes: 60, days: [1, 2, 3, 4, 5] },
};

const CRON_PRESETS = [
  { label: 'Every hour',    value: '0 * * * *' },
  { label: 'Every 2h',     value: '0 */2 * * *' },
  { label: 'Every 6h',     value: '0 */6 * * *' },
  { label: '9am daily',    value: '0 9 * * *' },
  { label: 'Weekdays 9am', value: '0 9 * * 1-5' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Tag input component ───────────────────────────────────────────────────────

function TagInput({
  tags, onAdd, onRemove, placeholder,
  colorClass = 'bg-primary/10 text-primary border-primary/20',
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (i: number) => void;
  placeholder: string;
  colorClass?: string;
}) {
  const [input, setInput] = useState('');
  const add = () => { if (input.trim()) { onAdd(input.trim()); setInput(''); } };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input placeholder={placeholder} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <Button type="button" variant="outline" size="sm" onClick={add}>Add</Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border', colorClass)}>
              {tag}
              <button type="button" className="hover:text-red-400" onClick={() => onRemove(i)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditAgentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [timeInput, setTimeInput] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [agRes, accRes, foldersRes] = await Promise.all([
          agentApi.get(id),
          oauthApi.accounts(),
          mediaApi.listFolders().catch(() => ({ folders: [] })),
        ]);
        const a = agRes.agent;
        setForm({
          name: a.name ?? '',
          description: a.description ?? '',
          personality_prompt: a.personality_prompt ?? '',
          model: a.model ?? 'gpt-4o',
          platform_account_ids: a.platform_account_ids ?? [],
          topic_keywords: a.topic_keywords ?? [],
          hashtag_targets: a.hashtag_targets ?? [],
          subreddit_targets: a.subreddit_targets ?? [],
          auto_post: a.auto_post ?? true,
          auto_reply: a.auto_reply ?? false,
          auto_comment: a.auto_comment ?? false,
          auto_like: a.auto_like ?? false,
          auto_follow: a.auto_follow ?? false,
          auto_retweet: a.auto_retweet ?? false,
          auto_dm: a.auto_dm ?? false,
          auto_web_research: a.auto_web_research ?? false,
          web_research_config: {
            search_queries: a.web_research_config?.search_queries ?? [],
            rss_feeds: a.web_research_config?.rss_feeds ?? [],
            sources: a.web_research_config?.sources ?? { reddit: true, duckduckgo: true, hackernews: true, rss: true },
            research_depth: a.web_research_config?.research_depth ?? 'basic',
          },
          media_folder_id: a.media_folder_id ?? '',
          media_settings: {
            order: a.media_settings?.order ?? 'random',
            frequency: a.media_settings?.frequency ?? 'always',
            frequency_pct: a.media_settings?.frequency_pct ?? 50,
            include_body_text: a.media_settings?.include_body_text ?? true,
            caption_source: a.media_settings?.caption_source ?? 'ai_generated',
            caption_prefix_mode: a.media_settings?.caption_prefix_mode ?? 'static',
            caption_prefix: a.media_settings?.caption_prefix ?? '',
            caption_hashtags: a.media_settings?.caption_hashtags ?? [],
          },
          approval_mode: a.approval_mode ?? 'auto_with_guardrails',
          schedule_type: a.schedule_type ?? 'random',
          schedule_config: a.schedule_config ?? { min_minutes: 30, max_minutes: 240 },
          dm_template: a.dm_template ?? '',
          dm_max_per_day: a.dm_max_per_day ?? 50,
        });
        setAccounts(accRes.accounts ?? []);
        setFolders(foldersRes.folders ?? []);
      } catch {
        toast.error('Failed to load agent');
        router.push('/dashboard/agents');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const setScheduleType = (type: string) =>
    setForm({ ...form, schedule_type: type, schedule_config: SCHEDULE_DEFAULTS[type] ?? {} });

  const setSC = (patch: Record<string, any>) =>
    setForm({ ...form, schedule_config: { ...form.schedule_config, ...patch } });

  const setMS = (patch: Record<string, any>) =>
    setForm({ ...form, media_settings: { ...form.media_settings, ...patch } });

  const toggleDay = (day: number) => {
    const days: number[] = form.schedule_config.days ?? [];
    setSC({ days: days.includes(day) ? days.filter((d: number) => d !== day) : [...days, day].sort() });
  };

  const addTime = () => {
    if (/^\d{2}:\d{2}$/.test(timeInput)) {
      const times: string[] = form.schedule_config.times ?? [];
      if (!times.includes(timeInput)) setSC({ times: [...times, timeInput].sort() });
      setTimeInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Agent name is required'); return; }
    setSaving(true);
    try {
      await agentApi.update(id, { ...form, media_folder_id: form.media_folder_id || null, dm_template: form.dm_template || null });
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
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold">Edit Agent</h1>
        <p className="text-muted-foreground mt-1">Update every aspect of your agent's configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── IDENTITY ─────────────────────────────────────────── */}
        <Card className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Identity</CardTitle>
            <CardDescription>Name, accounts, personality and AI model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="name">Agent Name <span className="text-red-400">*</span></Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
            </div>

            <div>
              <Label>Connected Accounts</Label>
              <p className="text-xs text-muted-foreground mb-2 mt-0.5">Select all accounts this agent should post from</p>
              {accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No accounts connected. <a href="/dashboard/accounts" className="text-primary hover:underline">Connect one →</a></p>
              ) : (
                <div className="space-y-2">
                  {accounts.map((acc) => (
                    <label key={acc.id} className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      form.platform_account_ids.includes(acc.id)
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                    )}>
                      <input type="checkbox" className="accent-primary"
                        checked={form.platform_account_ids.includes(acc.id)}
                        onChange={(e) => setForm({
                          ...form,
                          platform_account_ids: e.target.checked
                            ? [...form.platform_account_ids, acc.id]
                            : form.platform_account_ids.filter((x: string) => x !== acc.id),
                        })}
                      />
                      <div>
                        <p className="text-sm font-medium">@{acc.platform_username ?? acc.handle}</p>
                        <p className="text-xs text-muted-foreground capitalize">{acc.platform}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="personality_prompt">Personality / System Prompt</Label>
              <Textarea id="personality_prompt" value={form.personality_prompt}
                onChange={(e) => setForm({ ...form, personality_prompt: e.target.value })}
                placeholder="You are a witty tech enthusiast who shares insights about AI and startups..." rows={4} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Defines how your agent writes.</p>
            </div>

            <div>
              <Label>AI Model</Label>
              <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o — Smartest, best quality</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini — Faster, lower cost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── TARGETING ────────────────────────────────────────── */}
        <Card className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Targeting</CardTitle>
            <CardDescription>Keywords, hashtags, and subreddits to focus on</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Topic Keywords</Label>
              <p className="text-xs text-muted-foreground mb-2 mt-0.5">Topics to write about</p>
              <TagInput tags={form.topic_keywords}
                onAdd={(t) => setForm({ ...form, topic_keywords: [...form.topic_keywords, t] })}
                onRemove={(i) => setForm({ ...form, topic_keywords: form.topic_keywords.filter((_: string, j: number) => j !== i) })}
                placeholder="Add a keyword..." />
            </div>
            <div>
              <Label>Hashtag Targets</Label>
              <p className="text-xs text-muted-foreground mb-2 mt-0.5">Hashtags to monitor and engage with</p>
              <TagInput tags={form.hashtag_targets}
                onAdd={(t) => setForm({ ...form, hashtag_targets: [...form.hashtag_targets, t] })}
                onRemove={(i) => setForm({ ...form, hashtag_targets: form.hashtag_targets.filter((_: string, j: number) => j !== i) })}
                placeholder="#tech or tech" colorClass="bg-blue-500/10 text-blue-400 border-blue-500/20" />
            </div>
            <div>
              <Label>Subreddit Targets</Label>
              <p className="text-xs text-muted-foreground mb-2 mt-0.5">Subreddits for cross-posting or engagement</p>
              <TagInput tags={form.subreddit_targets}
                onAdd={(t) => setForm({ ...form, subreddit_targets: [...form.subreddit_targets, t] })}
                onRemove={(i) => setForm({ ...form, subreddit_targets: form.subreddit_targets.filter((_: string, j: number) => j !== i) })}
                placeholder="r/technology or technology" colorClass="bg-orange-500/10 text-orange-400 border-orange-500/20" />
            </div>
          </CardContent>
        </Card>

        {/* ── CAPABILITIES ─────────────────────────────────────── */}
        <Card className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
            <CardDescription>Choose what this agent is allowed to do</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'auto_post',    label: 'Auto Post',    desc: 'Create and publish new posts autonomously' },
              { key: 'auto_reply',   label: 'Auto Reply',   desc: 'Reply to comments and mentions' },
              { key: 'auto_comment', label: 'Auto Comment', desc: 'Comment on relevant posts' },
              { key: 'auto_like',    label: 'Auto Like',    desc: 'Like posts matching your targets' },
              { key: 'auto_follow',  label: 'Auto Follow',  desc: 'Follow relevant accounts' },
              { key: 'auto_retweet', label: 'Auto Retweet', desc: 'Retweet/repost relevant content' },
              { key: 'auto_dm',      label: 'Auto DM',      desc: 'Send direct messages to targeted users' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-0.5">
                <div><Label>{label}</Label><p className="text-xs text-muted-foreground">{desc}</p></div>
                <Switch checked={form[key]} onCheckedChange={(v) => setForm({ ...form, [key]: v })} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── WEB RESEARCH ─────────────────────────────────────── */}
        <Card className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Web Research</CardTitle>
            <CardDescription>Let the agent research trending news before posting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Web Research</Label>
                <p className="text-xs text-muted-foreground">Agent searches the web for fresh info before writing</p>
              </div>
              <Switch checked={form.auto_web_research} onCheckedChange={(v) => setForm({ ...form, auto_web_research: v })} />
            </div>
            {form.auto_web_research && (
              <>
                <div>
                  <Label>Search Queries</Label>
                  <p className="text-xs text-muted-foreground mb-2 mt-0.5">Topics to research</p>
                  <TagInput
                    tags={form.web_research_config.search_queries}
                    onAdd={(t) => setForm({ ...form, web_research_config: { ...form.web_research_config, search_queries: [...form.web_research_config.search_queries, t] } })}
                    onRemove={(i) => setForm({ ...form, web_research_config: { ...form.web_research_config, search_queries: form.web_research_config.search_queries.filter((_: string, j: number) => j !== i) } })}
                    placeholder="Add a search query..."
                  />
                </div>
                <div>
                  <Label>Research Sources</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[
                      { key: 'reddit',     label: '● Reddit',            desc: 'Hot posts & discussions' },
                      { key: 'duckduckgo', label: '🔍 DuckDuckGo',       desc: 'Web + Twitter discovery' },
                      { key: 'hackernews', label: '◈ Hacker News',       desc: 'Tech & startup news' },
                      { key: 'rss',        label: '◎ RSS / Google News', desc: 'News feeds & custom RSS' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div><p className="text-sm font-medium">{label}</p><p className="text-[11px] text-muted-foreground">{desc}</p></div>
                        <Switch
                          checked={(form.web_research_config.sources ?? {})[key] ?? true}
                          onCheckedChange={(v) => setForm({ ...form, web_research_config: { ...form.web_research_config, sources: { ...(form.web_research_config.sources ?? {}), [key]: v } } })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Research Depth</Label>
                  <Select value={form.web_research_config.research_depth}
                    onValueChange={(v) => setForm({ ...form, web_research_config: { ...form.web_research_config, research_depth: v } })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic — Quick scan (4–5 results per source)</SelectItem>
                      <SelectItem value="deep">Deep — Thorough research (8–10 results per source)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── MEDIA POOL ───────────────────────────────────────── */}
        <Card className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Media Pool</CardTitle>
            <CardDescription>Videos and images the agent attaches to its posts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {folders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No folders yet. <a href="/dashboard/media" className="text-primary hover:underline">Create one in Media Library →</a></p>
            ) : (
              <div className="space-y-2">
                <Label>Media Folder</Label>
                <label className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  !form.media_folder_id ? 'border-primary/40 bg-primary/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                )}>
                  <input type="radio" name="media_folder" className="accent-primary" checked={!form.media_folder_id} onChange={() => setForm({ ...form, media_folder_id: '' })} />
                  <p className="text-sm font-medium text-muted-foreground">No media (text-only posts)</p>
                </label>
                {folders.map((f: any) => (
                  <label key={f.id} className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    form.media_folder_id === f.id ? 'border-primary/40 bg-primary/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                  )}>
                    <input type="radio" name="media_folder" className="accent-primary" checked={form.media_folder_id === f.id} onChange={() => setForm({ ...form, media_folder_id: f.id })} />
                    <div>
                      <p className="text-sm font-medium">▣ {f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.file_count} file{f.file_count !== 1 ? 's' : ''}{f.label && ` · ${f.label}`}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {form.media_folder_id && (
              <div className="space-y-4 pt-4 border-t border-white/[0.06]">

                {/* Order */}
                <div>
                  <Label>Post Order</Label>
                  <p className="text-xs text-muted-foreground mb-2 mt-0.5">How to cycle through files in the folder</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'random',     label: 'Random',     desc: 'Pick a random file each time' },
                      { value: 'sequential', label: 'Sequential', desc: 'Cycle through files in order' },
                    ].map(({ value, label, desc }) => (
                      <label key={value} className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        form.media_settings.order === value ? 'border-primary/40 bg-primary/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                      )}>
                        <input type="radio" name="media_order" className="accent-primary" checked={form.media_settings.order === value} onChange={() => setMS({ order: value })} />
                        <div><p className="text-sm font-medium">{label}</p><p className="text-[11px] text-muted-foreground">{desc}</p></div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <Label>Media Frequency</Label>
                  <p className="text-xs text-muted-foreground mb-2 mt-0.5">How often to attach media to posts</p>
                  <div className="space-y-2">
                    {[
                      { value: 'always',    label: 'Always',    desc: 'Every post includes a media file' },
                      { value: 'sometimes', label: 'Sometimes', desc: 'Attach media to a percentage of posts' },
                      { value: 'never',     label: 'Never',     desc: 'Disable media without removing the folder' },
                    ].map(({ value, label, desc }) => (
                      <label key={value} className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        form.media_settings.frequency === value ? 'border-primary/40 bg-primary/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                      )}>
                        <input type="radio" name="media_frequency" className="accent-primary" checked={form.media_settings.frequency === value} onChange={() => setMS({ frequency: value })} />
                        <div><p className="text-sm font-medium">{label}</p><p className="text-[11px] text-muted-foreground">{desc}</p></div>
                      </label>
                    ))}
                  </div>
                  {form.media_settings.frequency === 'sometimes' && (
                    <div className="mt-3 flex items-center gap-3">
                      <Input type="number" min={1} max={100} className="w-24"
                        value={form.media_settings.frequency_pct}
                        onChange={(e) => setMS({ frequency_pct: Math.min(100, Math.max(1, Number(e.target.value))) })} />
                      <span className="text-sm text-muted-foreground">% chance per post</span>
                    </div>
                  )}
                </div>

                {/* Caption source */}
                <div>
                  <Label>Caption / Post Text Source</Label>
                  <p className="text-xs text-muted-foreground mb-2 mt-0.5">Where the text accompanying your media comes from</p>
                  <div className="space-y-2">
                    {[
                      { value: 'ai_generated',     label: 'AI Generated',     desc: 'Agent writes a fresh caption every time' },
                      { value: 'file_description', label: 'File Description', desc: 'Uses the description saved on the media file' },
                      { value: 'none',             label: 'No Caption',       desc: 'Post media with no text (turn off body text below)' },
                    ].map(({ value, label, desc }) => (
                      <label key={value} className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        form.media_settings.caption_source === value ? 'border-primary/40 bg-primary/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                      )}>
                        <input type="radio" name="caption_source" className="accent-primary" checked={form.media_settings.caption_source === value} onChange={() => setMS({ caption_source: value })} />
                        <div><p className="text-sm font-medium">{label}</p><p className="text-[11px] text-muted-foreground">{desc}</p></div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Caption prefix */}
                <div>
                  <Label>Caption Prefix</Label>
                  <p className="text-xs text-muted-foreground mb-2 mt-0.5">Text added before every media post</p>
                  <div className="space-y-2 mb-3">
                    {[
                      { value: 'static',   label: 'Static Text',  desc: 'Same fixed text on every post' },
                      { value: 'hashtags', label: 'Hashtag List', desc: 'Pick your hashtags — formatted automatically' },
                      { value: 'ai',       label: 'AI Generated', desc: 'Agent writes a unique punchy opener each time' },
                    ].map(({ value, label, desc }) => (
                      <label key={value} className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        form.media_settings.caption_prefix_mode === value ? 'border-primary/40 bg-primary/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                      )}>
                        <input type="radio" name="caption_prefix_mode" className="accent-primary"
                          checked={form.media_settings.caption_prefix_mode === value}
                          onChange={() => setMS({ caption_prefix_mode: value })} />
                        <div><p className="text-sm font-medium">{label}</p><p className="text-[11px] text-muted-foreground">{desc}</p></div>
                      </label>
                    ))}
                  </div>
                  {form.media_settings.caption_prefix_mode === 'static' && (
                    <Textarea value={form.media_settings.caption_prefix}
                      onChange={(e) => setMS({ caption_prefix: e.target.value })}
                      placeholder="e.g. Check this out! 🔥" rows={2} />
                  )}
                  {form.media_settings.caption_prefix_mode === 'hashtags' && (
                    <TagInput
                      tags={form.media_settings.caption_hashtags}
                      onAdd={(t) => setMS({ caption_hashtags: [...form.media_settings.caption_hashtags, t.replace(/^#/, '')] })}
                      onRemove={(i) => setMS({ caption_hashtags: form.media_settings.caption_hashtags.filter((_: string, j: number) => j !== i) })}
                      placeholder="Add a hashtag (with or without #)"
                      colorClass="bg-violet-500/10 text-violet-400 border-violet-500/20"
                    />
                  )}
                  {form.media_settings.caption_prefix_mode === 'ai' && (
                    <p className="text-xs text-muted-foreground p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      The agent will use its personality prompt to write a fresh, unique opener before each post — no two will be alike.
                    </p>
                  )}
                </div>

                {/* Include body text toggle */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <Label>Always Include Body Text</Label>
                    <p className="text-xs text-muted-foreground">Add AI-generated text alongside the media. Disable for media-only posts.</p>
                  </div>
                  <Switch checked={form.media_settings.include_body_text} onCheckedChange={(v) => setMS({ include_body_text: v })} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── CONTENT APPROVAL ─────────────────────────────────── */}
        <Card className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Content Approval</CardTitle>
            <CardDescription>How generated content is handled before publishing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { value: 'auto',                 label: 'Auto',                 sub: 'Post immediately without review',               color: 'text-green-400' },
              { value: 'review',               label: 'Review',               sub: 'Queue all content for manual approval',          color: 'text-yellow-400' },
              { value: 'auto_with_guardrails', label: 'Auto with Guardrails', sub: 'Auto-post unless AI safety flags detect issues',  color: 'text-blue-400' },
            ].map(({ value, label, sub, color }) => (
              <label key={value} className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                form.approval_mode === value ? 'border-primary/40 bg-primary/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
              )}>
                <input type="radio" name="approval_mode" value={value} className="accent-primary"
                  checked={form.approval_mode === value} onChange={() => setForm({ ...form, approval_mode: value })} />
                <div>
                  <p className={cn('text-sm font-medium', color)}>{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* ── SCHEDULE ─────────────────────────────────────────── */}
        <Card className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Control when and how often this agent acts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SCHEDULE_TYPES.map(({ id, label, desc }) => (
                <button key={id} type="button" onClick={() => setScheduleType(id)}
                  className={cn('text-left p-3 rounded-lg border transition-colors',
                    form.schedule_type === id ? 'border-primary/50 bg-primary/10' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]')}>
                  <p className={cn('text-sm font-semibold', form.schedule_type === id ? 'text-primary' : '')}>{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-white/[0.06] space-y-4">
              {form.schedule_type === 'random' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Min minutes</Label><Input type="number" min={1} className="mt-1" value={form.schedule_config.min_minutes ?? 30} onChange={(e) => setSC({ min_minutes: Number(e.target.value) })} /></div>
                  <div><Label>Max minutes</Label><Input type="number" min={1} className="mt-1" value={form.schedule_config.max_minutes ?? 240} onChange={(e) => setSC({ max_minutes: Number(e.target.value) })} /></div>
                </div>
              )}
              {form.schedule_type === 'interval' && (
                <div><Label>Interval (minutes)</Label><Input type="number" min={1} className="mt-1" value={form.schedule_config.interval_minutes ?? 60} onChange={(e) => setSC({ interval_minutes: Number(e.target.value) })} /></div>
              )}
              {form.schedule_type === 'cron' && (
                <div className="space-y-3">
                  <div><Label>Cron Expression</Label><Input className="mt-1 font-mono" value={form.schedule_config.expression ?? ''} onChange={(e) => setSC({ expression: e.target.value })} placeholder="0 */2 * * *" /></div>
                  <div className="flex flex-wrap gap-2">
                    {CRON_PRESETS.map(({ label, value }) => (
                      <button key={value} type="button" onClick={() => setSC({ expression: value })}
                        className={cn('px-2.5 py-1 rounded text-xs border transition-colors',
                          form.schedule_config.expression === value ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/[0.06] hover:bg-white/[0.04] text-muted-foreground')}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {form.schedule_type === 'set_times' && (
                <div className="space-y-4">
                  <div>
                    <Label>Post Times</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} className="w-auto" />
                      <Button type="button" variant="outline" size="sm" onClick={addTime}>Add</Button>
                    </div>
                    {(form.schedule_config.times ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(form.schedule_config.times as string[]).map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">
                            {t}<button type="button" className="hover:text-red-400" onClick={() => setSC({ times: form.schedule_config.times.filter((x: string) => x !== t) })}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Active Days</Label>
                    <div className="flex gap-1.5 mt-1">
                      {DAY_LABELS.map((d, i) => (
                        <button key={i} type="button" onClick={() => toggleDay(i)}
                          className={cn('w-9 h-9 rounded-lg text-xs font-medium border transition-colors',
                            (form.schedule_config.days ?? []).includes(i) ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/[0.06] text-muted-foreground hover:bg-white/[0.04]')}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {form.schedule_type === 'peak_hours' && (
                <div>
                  <Label>Platform</Label>
                  <Select value={form.schedule_config.platform ?? 'twitter'} onValueChange={(v) => setSC({ platform: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter / X</SelectItem>
                      <SelectItem value="reddit">Reddit</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Posts scheduled during the highest-engagement hours for this platform.</p>
                </div>
              )}
              {form.schedule_type === 'burst' && (
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Burst count</Label><Input type="number" min={1} className="mt-1" value={form.schedule_config.burst_count ?? 3} onChange={(e) => setSC({ burst_count: Number(e.target.value) })} /></div>
                  <div><Label>Burst interval (min)</Label><Input type="number" min={1} className="mt-1" value={form.schedule_config.burst_interval_minutes ?? 5} onChange={(e) => setSC({ burst_interval_minutes: Number(e.target.value) })} /></div>
                  <div><Label>Cooldown (hours)</Label><Input type="number" min={1} className="mt-1" value={form.schedule_config.cooldown_hours ?? 4} onChange={(e) => setSC({ cooldown_hours: Number(e.target.value) })} /></div>
                </div>
              )}
              {form.schedule_type === 'business_hours' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>Start hour</Label><Input type="number" min={0} max={23} className="mt-1" value={form.schedule_config.start_hour ?? 9} onChange={(e) => setSC({ start_hour: Number(e.target.value) })} /></div>
                    <div><Label>End hour</Label><Input type="number" min={0} max={23} className="mt-1" value={form.schedule_config.end_hour ?? 17} onChange={(e) => setSC({ end_hour: Number(e.target.value) })} /></div>
                    <div><Label>Interval (min)</Label><Input type="number" min={1} className="mt-1" value={form.schedule_config.interval_minutes ?? 60} onChange={(e) => setSC({ interval_minutes: Number(e.target.value) })} /></div>
                  </div>
                  <div>
                    <Label>Active Days</Label>
                    <div className="flex gap-1.5 mt-1">
                      {DAY_LABELS.map((d, i) => (
                        <button key={i} type="button" onClick={() => toggleDay(i)}
                          className={cn('w-9 h-9 rounded-lg text-xs font-medium border transition-colors',
                            (form.schedule_config.days ?? []).includes(i) ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/[0.06] text-muted-foreground hover:bg-white/[0.04]')}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── DM CONFIG ────────────────────────────────────────── */}
        {form.auto_dm && (
          <Card className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle>DM Configuration</CardTitle>
              <CardDescription>Direct message template and rate limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>DM Template</Label>
                <Textarea value={form.dm_template ?? ''} onChange={(e) => setForm({ ...form, dm_template: e.target.value })}
                  placeholder="Hi, I noticed you're interested in..." rows={3} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Leave blank to let AI generate each DM.</p>
              </div>
              <div>
                <Label>Max DMs per day</Label>
                <Input type="number" min={1} max={500} className="mt-1 w-32"
                  value={form.dm_max_per_day} onChange={(e) => setForm({ ...form, dm_max_per_day: Number(e.target.value) })} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── SUBMIT ───────────────────────────────────────────── */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? <Spinner size="sm" /> : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>

      </form>
    </div>
  );
}
