'use client';

// ============================================================
// New Campaign Wizard
// Step 1: Strategy → Step 2: Content → Step 3: Platforms → Step 4: Schedule → Launch
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { campaignApi, oauthApi, contentApi, mediaApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { platformIcon, platformColor, cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

const CAMPAIGN_TYPES = [
  { id: 'blast', icon: '⚡', label: 'Blast', desc: 'Same content, all platforms, right now' },
  { id: 'drip', icon: '◎', label: 'Drip', desc: 'Spread posts over time to avoid spam' },
  { id: 'thread', icon: '≡', label: 'Thread', desc: 'Twitter/Reddit long-form thread' },
  { id: 'video', icon: '▶', label: 'Video', desc: 'Push a video to TikTok, YouTube, X' },
];

const PLATFORM_LABELS: Record<string, string> = {
  twitter: '𝕏 Twitter/X',
  reddit: '● Reddit',
  youtube: '▶ YouTube',
  tiktok: '♪ TikTok',
  facebook: 'f Facebook',
  instagram: '◉ Instagram',
};

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [adaptLoading, setAdaptLoading] = useState(false);
  const [hooks, setHooks] = useState<string[]>([]);
  const [adaptedContent, setAdaptedContent] = useState<Record<string, string>>({});
  const [hashtagInput, setHashtagInput] = useState('');

  // Form state
  const [form, setForm] = useState({
    name: '',
    campaign_type: 'blast',
    // Strategy
    topic: '',
    target_audience: '',
    call_to_action: '',
    hashtags: [] as string[],
    // Content
    base_content: '',
    use_ai_adaptation: true,
    ai_personality: '',
    // Platforms (array of {platform_account_id, platform, content_override?})
    platform_account_ids: [] as any[],
    // Schedule
    schedule_mode: 'immediate',
    scheduled_at: '',
    drip_interval_hours: 24,
  });

  useEffect(() => {
    oauthApi.accounts().then(({ accounts }) => setAccounts(accounts)).catch(() => {});
  }, []);

  const selectedAccountIds = new Set(form.platform_account_ids.map((p: any) => p.platform_account_id));

  function toggleAccount(acc: any) {
    const isSelected = selectedAccountIds.has(acc.id);
    if (isSelected) {
      setForm({
        ...form,
        platform_account_ids: form.platform_account_ids.filter((p: any) => p.platform_account_id !== acc.id),
      });
    } else {
      setForm({
        ...form,
        platform_account_ids: [
          ...form.platform_account_ids,
          { platform_account_id: acc.id, platform: acc.platform },
        ],
      });
    }
  }

  async function generateHooks() {
    if (!form.topic && !form.base_content) return;
    setAiLoading(true);
    try {
      const { hooks: h } = await contentApi.hooks({
        topic: form.topic || form.base_content,
        platform: 'general',
        count: 5,
      });
      setHooks(h || []);
    } catch (err: any) {
      toast.error('Failed to generate hooks');
    } finally {
      setAiLoading(false);
    }
  }

  async function adaptAllPlatforms(campaignId: string) {
    setAdaptLoading(true);
    try {
      const { adaptations } = await campaignApi.adaptAll(campaignId);
      setAdaptedContent(adaptations || {});
      toast.success('AI adapted content for all platforms');
    } catch {
      toast.error('AI adaptation failed');
    } finally {
      setAdaptLoading(false);
    }
  }

  async function handleSubmit() {
    if (!form.name) { toast.error('Campaign name is required'); return; }
    if (form.platform_account_ids.length === 0) { toast.error('Select at least one platform account'); return; }
    if (!form.base_content && !form.topic) { toast.error('Add content or a topic'); return; }

    setLoading(true);
    try {
      const { campaign } = await campaignApi.create(form);

      if (form.use_ai_adaptation && campaign.id) {
        await adaptAllPlatforms(campaign.id);
      }

      if (form.schedule_mode === 'immediate') {
        await campaignApi.launch(campaign.id);
        toast.success('Campaign launched! Posts are being published.');
      } else {
        toast.success('Campaign scheduled!');
      }

      router.push('/dashboard/campaigns');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { n: 1, label: 'Strategy' },
    { n: 2, label: 'Content' },
    { n: 3, label: 'Platforms' },
    { n: 4, label: 'Schedule' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-3xl font-display font-bold">New Campaign</h1>
        <p className="text-muted-foreground mt-1">Reach every platform in one shot</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-all',
                step === n
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                  : step > n
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-white/[0.04] text-muted-foreground border-white/[0.08]',
              )}>
                {step > n ? '✓' : n}
              </div>
              <span className={cn(
                'text-sm font-medium hidden sm:block',
                step === n ? 'text-foreground' : 'text-muted-foreground',
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'flex-1 h-px transition-all',
                step > n ? 'bg-primary/30' : 'bg-white/[0.06]',
              )} />
            )}
          </div>
        ))}
      </div>

      {/* ─────────────────────── STEP 1: Strategy ─────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Type</CardTitle>
              <CardDescription>Choose how you want to distribute your content</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {CAMPAIGN_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm({ ...form, campaign_type: t.id })}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all',
                    form.campaign_type === t.id
                      ? 'border-primary/50 bg-primary/10 shadow-lg shadow-primary/10'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]',
                  )}
                >
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <p className="font-semibold text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Strategy</CardTitle>
              <CardDescription>Define your goal — the AI uses this to adapt content per platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  placeholder="WalletVote App Launch — March"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="topic">Topic / Angle</Label>
                <Input
                  id="topic"
                  placeholder="My app WalletVote just launched — it lets you scan products to see brand political donations"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">AI will use this to generate platform-specific content</p>
              </div>
              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  placeholder="People who care about where their money goes, conscious consumers, political activists"
                  value={form.target_audience}
                  onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cta">Call to Action</Label>
                <Input
                  id="cta"
                  placeholder="Download WalletVote on the App Store — link in bio"
                  value={form.call_to_action}
                  onChange={(e) => setForm({ ...form, call_to_action: e.target.value })}
                />
              </div>
              <div>
                <Label>Hashtag Pool</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="#WalletVote #ConsciousConsumer"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const tags = hashtagInput.split(/[\s,]+/).map(t => t.startsWith('#') ? t : `#${t}`).filter(Boolean);
                        setForm({ ...form, hashtags: [...new Set([...form.hashtags, ...tags])] });
                        setHashtagInput('');
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const tags = hashtagInput.split(/[\s,]+/).map(t => t.startsWith('#') ? t : `#${t}`).filter(Boolean);
                    setForm({ ...form, hashtags: [...new Set([...form.hashtags, ...tags])] });
                    setHashtagInput('');
                  }}>Add</Button>
                </div>
                {form.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.hashtags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">
                        {tag}
                        <button type="button" onClick={() => setForm({ ...form, hashtags: form.hashtags.filter((_, j) => j !== i) })}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!form.name}>Next: Content →</Button>
          </div>
        </div>
      )}

      {/* ─────────────────────── STEP 2: Content ─────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Base Content</CardTitle>
              <CardDescription>Write your core message — AI will adapt it per platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="base_content">Content</Label>
                <Textarea
                  id="base_content"
                  rows={5}
                  placeholder="Write your core message here, or leave blank if you want the AI to generate it entirely from your topic and strategy..."
                  value={form.base_content}
                  onChange={(e) => setForm({ ...form, base_content: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.base_content.length} chars — this will be rewritten for each platform unless you turn off AI adaptation below
                </p>
              </div>

              {/* Hook generator */}
              {form.topic && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Hook Ideas</Label>
                    <button
                      type="button"
                      onClick={generateHooks}
                      disabled={aiLoading}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      {aiLoading ? <Spinner size="sm" /> : '✨'} Generate Hooks
                    </button>
                  </div>
                  {hooks.length > 0 && (
                    <div className="space-y-2">
                      {hooks.map((hook, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setForm({ ...form, base_content: hook })}
                          className="w-full text-left p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-primary/30 hover:bg-primary/5 transition-all text-sm"
                        >
                          {hook}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="personality">AI Personality / Voice</Label>
                <Textarea
                  id="personality"
                  rows={2}
                  placeholder="Casual and direct, like a friend sharing an app they love. Not salesy. Occasionally witty."
                  value={form.ai_personality}
                  onChange={(e) => setForm({ ...form, ai_personality: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div>
                  <p className="text-sm font-semibold text-primary">AI Platform Adaptation</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    AI rewrites your content for each platform's style, tone, and character limits
                  </p>
                </div>
                <Switch
                  checked={form.use_ai_adaptation}
                  onCheckedChange={(v) => setForm({ ...form, use_ai_adaptation: v })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
            <Button onClick={() => setStep(3)}>Next: Platforms →</Button>
          </div>
        </div>
      )}

      {/* ─────────────────────── STEP 3: Platforms ─────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Platforms</CardTitle>
              <CardDescription>
                {accounts.length === 0
                  ? 'No accounts connected yet. Connect platforms in Account Settings first.'
                  : 'Choose which accounts to post to'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <a href="/dashboard/accounts" className="text-primary hover:underline text-sm">
                    Connect social accounts →
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((acc: any) => {
                    const isSelected = selectedAccountIds.has(acc.id);
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => toggleAccount(acc)}
                        className={cn(
                          'w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left',
                          isSelected
                            ? 'border-primary/40 bg-primary/8'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{platformIcon(acc.platform)}</span>
                          <div>
                            <p className="text-sm font-medium">@{acc.handle || acc.platform_user_id}</p>
                            <p className="text-xs text-muted-foreground">{PLATFORM_LABELS[acc.platform] || acc.platform}</p>
                          </div>
                        </div>
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                          isSelected ? 'bg-primary border-primary' : 'border-white/20',
                        )}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {form.platform_account_ids.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-xs text-emerald-400">
                    ✓ {form.platform_account_ids.length} platform{form.platform_account_ids.length !== 1 ? 's' : ''} selected — content will be{form.use_ai_adaptation ? ' AI-adapted and' : ''} posted to all of them
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
            <Button onClick={() => setStep(4)} disabled={form.platform_account_ids.length === 0}>
              Next: Schedule →
            </Button>
          </div>
        </div>
      )}

      {/* ─────────────────────── STEP 4: Schedule + Launch ─────────────────────── */}
      {step === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>When should this campaign go live?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['immediate', 'scheduled', 'drip'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForm({ ...form, schedule_mode: mode })}
                  className={cn(
                    'w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all',
                    form.schedule_mode === mode
                      ? 'border-primary/40 bg-primary/8'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]',
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    form.schedule_mode === mode ? 'bg-primary border-primary' : 'border-white/20',
                  )}>
                    {form.schedule_mode === mode && <span className="text-white text-xs">●</span>}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {mode === 'immediate' ? '⚡ Launch Now' : mode === 'scheduled' ? '◷ Schedule for Later' : '◎ Drip Campaign'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mode === 'immediate' && 'All posts go out as soon as you click Launch'}
                      {mode === 'scheduled' && 'All posts go out at a specific date and time'}
                      {mode === 'drip' && `Posts spread out every ${form.drip_interval_hours}h to look organic`}
                    </p>
                  </div>
                </button>
              ))}

              {form.schedule_mode === 'scheduled' && (
                <div>
                  <Label>Launch Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}

              {form.schedule_mode === 'drip' && (
                <div>
                  <Label>Hours Between Posts</Label>
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={form.drip_interval_hours}
                    onChange={(e) => setForm({ ...form, drip_interval_hours: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.platform_account_ids.length} posts × {form.drip_interval_hours}h gap = campaign completes in ~{Math.round(form.platform_account_ids.length * form.drip_interval_hours / 24)} days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Name</span>
                <span className="text-foreground font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Type</span>
                <span className="text-foreground capitalize">{form.campaign_type}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platforms</span>
                <span className="text-foreground">{form.platform_account_ids.length} accounts</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>AI Adaptation</span>
                <span className={form.use_ai_adaptation ? 'text-emerald-400' : 'text-muted-foreground'}>
                  {form.use_ai_adaptation ? '✓ Enabled' : 'Off'}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Schedule</span>
                <span className="text-foreground capitalize">{form.schedule_mode}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>← Back</Button>
            <Button
              variant="glow"
              onClick={handleSubmit}
              disabled={loading}
              className="px-8"
            >
              {loading ? (
                <span className="flex items-center gap-2"><Spinner size="sm" /> Creating...</span>
              ) : (
                form.schedule_mode === 'immediate' ? '⚡ Launch Campaign' : '◷ Schedule Campaign'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
