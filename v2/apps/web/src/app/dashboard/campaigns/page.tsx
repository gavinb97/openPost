'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { campaignApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { platformIcon, platformColor } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-white/[0.06] text-muted-foreground border border-white/[0.08]',
  scheduled: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  active: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  paused: 'bg-white/[0.06] text-muted-foreground border border-white/[0.08]',
  failed: 'bg-red-500/15 text-red-400 border border-red-500/20',
};

const TYPE_ICONS: Record<string, string> = {
  blast: '⚡',
  drip: '◎',
  thread: '≡',
  video: '▶',
  airdrop: '◉',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await campaignApi.list(filterStatus ? { status: filterStatus } : undefined);
      setCampaigns(data.campaigns || []);
    } catch (err: any) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterStatus]);

  async function handleLaunch(id: string) {
    setActionLoading(id);
    try {
      const result = await campaignApi.launch(id);
      toast.success(`${result.queued} posts queued for publishing!`);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to launch');
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePause(id: string) {
    setActionLoading(id);
    try {
      await campaignApi.pause(id);
      toast.success('Campaign paused');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to pause');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete campaign "${name}"? This cannot be undone.`)) return;
    try {
      await campaignApi.delete(id);
      toast.success('Campaign deleted');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Blast content to every platform simultaneously</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button variant="glow">⚡ New Campaign</Button>
        </Link>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {['', 'draft', 'scheduled', 'active', 'completed', 'paused', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              filterStatus === s
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-white/[0.04] text-muted-foreground border-white/[0.06] hover:bg-white/[0.08]'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Campaign Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <div className="text-5xl opacity-20">⚡</div>
          <h3 className="text-xl font-display font-semibold text-muted-foreground">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Create your first campaign to blast content across all your social platforms at once.
          </p>
          <Link href="/dashboard/campaigns/new">
            <Button variant="glow" className="mt-2">Create your first campaign</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campaigns.map((c: any) => (
            <div
              key={c.id}
              className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-300"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-xl opacity-60">{TYPE_ICONS[c.campaign_type] || '⚡'}</div>
                  <div>
                    <Link href={`/dashboard/campaigns/${c.id}`} className="font-semibold hover:text-primary transition-colors">
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{c.campaign_type} campaign</p>
                  </div>
                </div>
                <Badge className={STATUS_COLORS[c.status] || ''}>
                  {c.status}
                </Badge>
              </div>

              {/* Topic / content preview */}
              {(c.topic || c.base_content) && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {c.topic || c.base_content}
                </p>
              )}

              {/* Progress bar */}
              {c.posts_total > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{c.published_count || 0} of {c.post_count || 0} published</span>
                    <span className="text-emerald-400">{c.failed_count > 0 ? `${c.failed_count} failed` : ''}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-neon-pink transition-all duration-700"
                      style={{ width: `${c.post_count > 0 ? ((c.published_count || 0) / c.post_count) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span>{c.post_count || 0} platforms</span>
                {c.scheduled_at && (
                  <span>Scheduled {new Date(c.scheduled_at).toLocaleDateString()}</span>
                )}
                <span>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {c.status === 'draft' || c.status === 'scheduled' ? (
                  <>
                    <Button
                      size="sm"
                      variant="glow"
                      onClick={() => handleLaunch(c.id)}
                      disabled={actionLoading === c.id}
                      className="flex-1"
                    >
                      {actionLoading === c.id ? <Spinner size="sm" /> : '⚡ Launch'}
                    </Button>
                    <Link href={`/dashboard/campaigns/${c.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">Edit</Button>
                    </Link>
                  </>
                ) : c.status === 'active' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePause(c.id)}
                      disabled={actionLoading === c.id}
                    >
                      Pause
                    </Button>
                    <Link href={`/dashboard/campaigns/${c.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">View</Button>
                    </Link>
                  </>
                ) : (
                  <Link href={`/dashboard/campaigns/${c.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">View Details</Button>
                  </Link>
                )}
                {c.status !== 'active' && (
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all text-xs"
                    title="Delete"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
