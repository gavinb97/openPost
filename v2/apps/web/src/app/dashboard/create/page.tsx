'use client';

// ============================================================
// Quick Create — AI-powered content studio
// Tabs: Hook Generator | Thread Builder | Hashtags | Viral Score
// ============================================================

import { useState } from 'react';
import { contentApi, campaignApi, oauthApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Tab = 'hooks' | 'thread' | 'hashtags' | 'viral' | 'besttimes';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'hooks', icon: '⚡', label: 'Hook Generator' },
  { id: 'thread', icon: '≡', label: 'Thread Builder' },
  { id: 'hashtags', icon: '#', label: 'Hashtags' },
  { id: 'viral', icon: '◎', label: 'Viral Score' },
  { id: 'besttimes', icon: '◷', label: 'Best Times' },
];

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className={`text-5xl font-display font-bold ${color}`}>
      {score}<span className="text-2xl text-muted-foreground">/100</span>
    </div>
  );
}

export default function CreatePage() {
  const [tab, setTab] = useState<Tab>('hooks');
  const [loading, setLoading] = useState(false);

  // Hook generator
  const [hookTopic, setHookTopic] = useState('');
  const [hookPlatform, setHookPlatform] = useState('twitter');
  const [hookStyle, setHookStyle] = useState('');
  const [hooks, setHooks] = useState<string[]>([]);

  // Thread builder
  const [threadTopic, setThreadTopic] = useState('');
  const [threadBase, setThreadBase] = useState('');
  const [threadCount, setThreadCount] = useState(6);
  const [threadCta, setThreadCta] = useState('');
  const [threadPersonality, setThreadPersonality] = useState('');
  const [tweets, setTweets] = useState<string[]>([]);
  const [editingTweet, setEditingTweet] = useState<number | null>(null);

  // Hashtags
  const [hashTopic, setHashTopic] = useState('');
  const [hashPlatform, setHashPlatform] = useState('twitter');
  const [hashNiche, setHashNiche] = useState('');
  const [hashResult, setHashResult] = useState<{ hashtags: string[]; trending: string[]; niche: string[] } | null>(null);

  // Viral score
  const [viralContent, setViralContent] = useState('');
  const [viralPlatform, setViralPlatform] = useState('twitter');
  const [viralResult, setViralResult] = useState<any>(null);

  // Best times
  const [bestPlatform, setBestPlatform] = useState('twitter');
  const [bestTimes, setBestTimes] = useState<{ times: string[]; note: string } | null>(null);

  // ── Hook Generator ──
  async function generateHooks() {
    if (!hookTopic) { toast.error('Enter a topic'); return; }
    setLoading(true);
    setHooks([]);
    try {
      const { hooks: h } = await contentApi.hooks({ topic: hookTopic, platform: hookPlatform, count: 6, style: hookStyle });
      setHooks(h || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Thread Builder ──
  async function buildThread() {
    if (!threadTopic && !threadBase) { toast.error('Enter topic or content'); return; }
    setLoading(true);
    setTweets([]);
    try {
      const { tweets: t } = await contentApi.buildThread({
        topic: threadTopic || undefined,
        base_content: threadBase || undefined,
        tweet_count: threadCount,
        personality: threadPersonality || undefined,
        include_cta: threadCta || undefined,
      });
      setTweets(t || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  function copyThread() {
    navigator.clipboard.writeText(tweets.join('\n\n'));
    toast.success('Thread copied to clipboard!');
  }

  async function sendToCalendar() {
    // Open campaign wizard with this thread pre-filled
    const params = new URLSearchParams({ thread: JSON.stringify(tweets), type: 'thread' });
    window.location.href = `/dashboard/campaigns/new?${params.toString()}`;
  }

  // ── Hashtags ──
  async function getHashtags() {
    if (!hashTopic) { toast.error('Enter a topic'); return; }
    setLoading(true);
    setHashResult(null);
    try {
      const result = await contentApi.hashtags({ topic: hashTopic, platform: hashPlatform, count: 12, niche: hashNiche });
      setHashResult(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  function copyHashtags(tags: string[]) {
    navigator.clipboard.writeText(tags.join(' '));
    toast.success('Copied!');
  }

  // ── Viral Score ──
  async function scoreContent() {
    if (!viralContent) { toast.error('Enter content to analyze'); return; }
    setLoading(true);
    setViralResult(null);
    try {
      const result = await contentApi.viralScore({ content: viralContent, platform: viralPlatform });
      setViralResult(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Best Times ──
  async function getBestTimes() {
    setLoading(true);
    setBestTimes(null);
    try {
      const result = await contentApi.bestTimes(bestPlatform);
      setBestTimes(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Content Studio</h1>
          <p className="text-muted-foreground mt-1">AI tools to make every post count</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button variant="glow">⚡ New Campaign</Button>
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
              tab === t.id
                ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
            )}
          >
            <span className="text-base">{t.icon}</span>
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ───────────── HOOK GENERATOR ───────────── */}
      {tab === 'hooks' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>⚡ Hook Generator</CardTitle>
              <CardDescription>Generate 6 scroll-stopping opening lines for your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Topic *</Label>
                  <Input
                    placeholder="My app WalletVote shows brand political donations"
                    value={hookTopic}
                    onChange={(e) => setHookTopic(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Platform</Label>
                  <Select value={hookPlatform} onValueChange={setHookPlatform}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">𝕏 Twitter/X</SelectItem>
                      <SelectItem value="tiktok">♪ TikTok</SelectItem>
                      <SelectItem value="reddit">● Reddit</SelectItem>
                      <SelectItem value="youtube">▶ YouTube</SelectItem>
                      <SelectItem value="general">All Platforms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Style / Tone (optional)</Label>
                <Input
                  placeholder="Outraged, educational, casual, thought-provoking..."
                  value={hookStyle}
                  onChange={(e) => setHookStyle(e.target.value)}
                />
              </div>
              <Button onClick={generateHooks} disabled={loading} className="w-full">
                {loading ? <span className="flex items-center gap-2"><Spinner size="sm" /> Generating...</span> : '⚡ Generate Hooks'}
              </Button>
            </CardContent>
          </Card>

          {hooks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Click a hook to use it as your base content:</p>
              {hooks.map((hook, i) => (
                <div key={i} className="group relative">
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                    onClick={() => { navigator.clipboard.writeText(hook); toast.success('Copied!'); }}>
                    <p className="text-sm pr-20">{hook}</p>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-muted-foreground">{hook.length} chars</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(hook);
                          toast.success('Copied!');
                        }}
                        className="text-xs text-primary hover:underline"
                      >Copy</button>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={generateHooks} disabled={loading}>
                Regenerate
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ───────────── THREAD BUILDER ───────────── */}
      {tab === 'thread' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>≡ Twitter Thread Builder</CardTitle>
              <CardDescription>AI writes a multi-tweet thread that builds tension and drives engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Topic</Label>
                  <Input
                    placeholder="Why people don't realize brands fund politicians"
                    value={threadTopic}
                    onChange={(e) => setThreadTopic(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Number of Tweets</Label>
                  <Select value={threadCount.toString()} onValueChange={(v) => setThreadCount(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5, 6, 7, 8, 10].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n} tweets</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Base Content (optional)</Label>
                <Textarea
                  rows={3}
                  placeholder="Paste existing content to thread-ify it..."
                  value={threadBase}
                  onChange={(e) => setThreadBase(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Call to Action (last tweet)</Label>
                  <Input
                    placeholder="Download WalletVote on the App Store"
                    value={threadCta}
                    onChange={(e) => setThreadCta(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Voice / Personality</Label>
                  <Input
                    placeholder="Direct, punchy, slightly outraged"
                    value={threadPersonality}
                    onChange={(e) => setThreadPersonality(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={buildThread} disabled={loading} className="w-full">
                {loading ? <span className="flex items-center gap-2"><Spinner size="sm" /> Building thread...</span> : '≡ Build Thread'}
              </Button>
            </CardContent>
          </Card>

          {tweets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{tweets.length} tweets — {tweets.reduce((s, t) => s + t.length, 0)} total chars</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyThread}>Copy All</Button>
                  <Button size="sm" variant="glow" onClick={sendToCalendar}>Schedule as Campaign →</Button>
                </div>
              </div>
              {tweets.map((tweet, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {i + 1}
                    </div>
                    {i < tweets.length - 1 && <div className="w-px flex-1 my-1 bg-white/[0.06]" />}
                  </div>
                  <div className="flex-1 pb-2">
                    {editingTweet === i ? (
                      <div className="space-y-2">
                        <Textarea
                          rows={3}
                          value={tweet}
                          onChange={(e) => {
                            const updated = [...tweets];
                            updated[i] = e.target.value;
                            setTweets(updated);
                          }}
                        />
                        <div className="flex items-center justify-between">
                          <span className={cn('text-xs', tweet.length > 280 ? 'text-red-400' : 'text-muted-foreground')}>
                            {tweet.length}/280
                          </span>
                          <Button size="sm" variant="outline" onClick={() => setEditingTweet(null)}>Done</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] transition-all">
                        <p className="text-sm leading-relaxed">{tweet}</p>
                        <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className={cn('text-xs', tweet.length > 280 ? 'text-red-400 font-medium' : 'text-muted-foreground')}>
                            {tweet.length}/280 {tweet.length > 280 ? '⚠ over limit' : ''}
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => { navigator.clipboard.writeText(tweet); toast.success('Copied!'); }}
                              className="text-xs text-muted-foreground hover:text-foreground">Copy</button>
                            <button onClick={() => setEditingTweet(i)}
                              className="text-xs text-primary hover:underline">Edit</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={buildThread} disabled={loading}>Regenerate</Button>
                <Button variant="glow" onClick={copyThread}>Copy Full Thread</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────── HASHTAGS ───────────── */}
      {tab === 'hashtags' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle># Hashtag Recommender</CardTitle>
              <CardDescription>Platform-optimized hashtag sets mixing viral and niche tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Topic *</Label>
                  <Input
                    placeholder="Political donation transparency app"
                    value={hashTopic}
                    onChange={(e) => setHashTopic(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Platform</Label>
                  <Select value={hashPlatform} onValueChange={setHashPlatform}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">𝕏 Twitter/X</SelectItem>
                      <SelectItem value="tiktok">♪ TikTok</SelectItem>
                      <SelectItem value="instagram">◉ Instagram</SelectItem>
                      <SelectItem value="youtube">▶ YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Niche Context (optional)</Label>
                <Input
                  placeholder="Civic tech, consumer advocacy, political transparency"
                  value={hashNiche}
                  onChange={(e) => setHashNiche(e.target.value)}
                />
              </div>
              <Button onClick={getHashtags} disabled={loading} className="w-full">
                {loading ? <span className="flex items-center gap-2"><Spinner size="sm" /> Researching...</span> : '# Get Hashtags'}
              </Button>
            </CardContent>
          </Card>

          {hashResult && (
            <div className="space-y-4">
              {/* All hashtags */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">All Hashtags</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => copyHashtags(hashResult.hashtags)}>
                      Copy All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {hashResult.hashtags.map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => { navigator.clipboard.writeText(tag); toast.success('Copied!'); }}
                        className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hashResult.trending?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">🔥 Trending</CardTitle>
                        <button onClick={() => copyHashtags(hashResult.trending)} className="text-xs text-primary hover:underline">Copy</button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {hashResult.trending.map((tag, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs border border-orange-500/20">{tag}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {hashResult.niche?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">◎ Niche</CardTitle>
                        <button onClick={() => copyHashtags(hashResult.niche)} className="text-xs text-primary hover:underline">Copy</button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {hashResult.niche.map((tag, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs border border-cyan-500/20">{tag}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────── VIRAL SCORE ───────────── */}
      {tab === 'viral' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>◎ Viral Score Analyzer</CardTitle>
              <CardDescription>Get an AI score and improvement suggestions for your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Platform</Label>
                <Select value={viralPlatform} onValueChange={setViralPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">𝕏 Twitter/X</SelectItem>
                    <SelectItem value="tiktok">♪ TikTok</SelectItem>
                    <SelectItem value="reddit">● Reddit</SelectItem>
                    <SelectItem value="youtube">▶ YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Content to Analyze</Label>
                <Textarea
                  rows={5}
                  placeholder="Paste your post here..."
                  value={viralContent}
                  onChange={(e) => setViralContent(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">{viralContent.length} chars</p>
              </div>
              <Button onClick={scoreContent} disabled={loading} className="w-full">
                {loading ? <span className="flex items-center gap-2"><Spinner size="sm" /> Analyzing...</span> : '◎ Analyze Virality'}
              </Button>
            </CardContent>
          </Card>

          {viralResult && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-8">
                    <ScoreRing score={viralResult.score || 0} />
                    <div className="flex-1 space-y-2">
                      {[
                        { label: 'Hook Strength', value: viralResult.hook_strength },
                        { label: 'Clarity', value: viralResult.clarity },
                        { label: 'Emotion', value: viralResult.emotion },
                        { label: 'Shareability', value: viralResult.shareability },
                        { label: 'Platform Fit', value: viralResult.platform_fit },
                      ].filter(({ value }) => value != null).map(({ label, value }) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium">{value}/10</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-neon-pink"
                              style={{ width: `${(value / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {viralResult.weaknesses?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm text-red-400">⚠ Weaknesses</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {viralResult.weaknesses.map((w: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-red-400 flex-shrink-0">×</span> {w}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {viralResult.improvements?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm text-emerald-400">✓ Improvements</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {viralResult.improvements.map((imp: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-emerald-400 flex-shrink-0">→</span> {imp}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {viralResult.rewrite && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-primary">✨ AI Rewrite</CardTitle>
                      <button onClick={() => { navigator.clipboard.writeText(viralResult.rewrite); toast.success('Copied!'); }}
                        className="text-xs text-primary hover:underline">Copy</button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{viralResult.rewrite}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ───────────── BEST TIMES ───────────── */}
      {tab === 'besttimes' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>◷ Best Times to Post</CardTitle>
              <CardDescription>Research-backed optimal posting windows by platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={bestPlatform} onValueChange={setBestPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">𝕏 Twitter/X</SelectItem>
                  <SelectItem value="reddit">● Reddit</SelectItem>
                  <SelectItem value="youtube">▶ YouTube</SelectItem>
                  <SelectItem value="tiktok">♪ TikTok</SelectItem>
                  <SelectItem value="facebook">f Facebook</SelectItem>
                  <SelectItem value="instagram">◉ Instagram</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={getBestTimes} disabled={loading} className="w-full">
                {loading ? <span className="flex items-center gap-2"><Spinner size="sm" /> Loading...</span> : '◷ Get Best Times'}
              </Button>
            </CardContent>
          </Card>

          {bestTimes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base capitalize">{bestPlatform} — Top Posting Windows</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {bestTimes.times.map((time, i) => (
                    <div key={i} className={cn(
                      'p-3 rounded-xl border text-center',
                      i === 0
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-white/[0.06] bg-white/[0.02]',
                    )}>
                      <p className="text-xs text-muted-foreground mb-1">#{i + 1}</p>
                      <p className="font-semibold text-sm">{time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-sm text-muted-foreground leading-relaxed">{bestTimes.note}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Times shown in ET (Eastern). Adjust 3h for PT, -5h for GMT.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
