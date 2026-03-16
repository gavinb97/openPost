'use client';

import { useEffect, useState } from 'react';
import { reviewApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Spinner, EmptyState } from '@/components/ui/spinner';
import { platformIcon, formatRelative } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReviewPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      const res = await reviewApi.queue(page);
      setActions(res.actions);
      setTotal(res.total);
    } catch {
      toast.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const review = async (id: string, action: 'approve' | 'reject') => {
    try {
      const editedContent = editing[id];
      await reviewApi.review(id, { action, edited_content: editedContent });
      setActions((prev) => prev.filter((a) => a.id !== id));
      setTotal((t) => t - 1);
      toast.success(`Action ${action}d`);
    } catch {
      toast.error('Failed to review action');
    }
  };

  const bulkReview = async (action: 'approve' | 'reject') => {
    if (selected.size === 0) return;
    try {
      await reviewApi.bulkReview({ action_ids: Array.from(selected), action });
      setActions((prev) => prev.filter((a) => !selected.has(a.id)));
      setTotal((t) => t - selected.size);
      setSelected(new Set());
      toast.success(`${selected.size} actions ${action}d`);
    } catch {
      toast.error('Failed to bulk review');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === actions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(actions.map((a) => a.id)));
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Review Queue</h1>
          <p className="text-muted-foreground mt-1">
            <span className="font-mono text-foreground">{total}</span> items pending review
          </p>
        </div>
        {actions.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selected.size === actions.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selected.size > 0 && (
              <>
                <Button size="sm" onClick={() => bulkReview('approve')}>
                  ✓ Approve ({selected.size})
                </Button>
                <Button variant="destructive" size="sm" onClick={() => bulkReview('reject')}>
                  ✗ Reject ({selected.size})
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {actions.length === 0 ? (
        <EmptyState
          icon="✓"
          title="All caught up!"
          description="No content pending review. Your agents are either on auto-approve or haven't generated content yet."
        />
      ) : (
        <div className="space-y-3">
          {actions.map((action, i) => (
            <div
              key={action.id}
              className={`rounded-2xl border bg-white/[0.02] backdrop-blur-sm p-6 transition-all duration-200 animate-fade-up ${
                selected.has(action.id)
                  ? 'border-primary/40 bg-primary/[0.04] glow-purple'
                  : 'border-white/[0.06] hover:border-white/[0.1]'
              }`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start gap-4">
                {/* Select checkbox */}
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={selected.has(action.id)}
                    onChange={() => toggleSelect(action.id)}
                    className="h-4 w-4 rounded border-white/20 bg-white/[0.04] text-primary focus:ring-primary/50 focus:ring-offset-0"
                  />
                </div>

                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">
                      {action.action_type === 'reply' && action.platform === 'twitter' ? 'quote tweet' : action.action_type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {platformIcon(action.platform)} {action.platform}
                    </span>
                    <span className="text-sm font-medium">{action.agent_name}</span>
                    {action.account_handle && (
                      <span className="text-sm text-muted-foreground font-mono">@{action.account_handle}</span>
                    )}
                    <span className="text-xs text-muted-foreground font-mono">{formatRelative(action.created_at)}</span>
                  </div>

                  {/* Target tweet/post context — for reply, retweet, like */}
                  {action.target_post_id && (
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
                      <p className="text-xs text-muted-foreground">
                        {action.action_type === 'retweet' ? 'Retweeting: ' :
                         action.action_type === 'like' ? 'Liking: ' :
                         (action.action_type === 'reply' && action.platform === 'twitter') ? 'Quote tweeting: ' :
                         'Replying to: '}
                        {action.platform === 'twitter' ? (
                          <a
                            href={`https://twitter.com/i/status/${action.target_post_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-primary/70 hover:text-primary underline underline-offset-2"
                          >
                            {action.target_post_id}
                          </a>
                        ) : (
                          <span className="font-mono text-foreground/60">{action.target_post_id}</span>
                        )}
                        {action.target_user && (
                          <> · by <span className="font-mono text-foreground/60">@{action.target_user}</span></>
                        )}
                        {action.target_subreddit && (
                          <> in <span className="font-mono text-foreground/60">r/{action.target_subreddit}</span></>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Media preview */}
                  {action.media_url && (
                    <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-black/20">
                      {action.media_mime_type?.startsWith('video/') ? (
                        <video
                          src={action.media_url}
                          controls
                          className="max-h-64 w-full object-contain"
                        />
                      ) : (
                        <img
                          src={action.media_url}
                          alt="Attached media"
                          className="max-h-64 w-full object-contain"
                        />
                      )}
                    </div>
                  )}

                  {/* Content — editable (not shown for engage actions like retweet/like) */}
                  {action.action_type !== 'retweet' && action.action_type !== 'like' && action.action_type !== 'follow' && (
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                      {action.content_text ? (
                        <Textarea
                          value={editing[action.id] ?? action.content_text}
                          onChange={(e) => setEditing({ ...editing, [action.id]: e.target.value })}
                          rows={3}
                          className="bg-transparent border-none p-0 focus-visible:ring-0 resize-none text-sm leading-relaxed"
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Content will be generated when approved and dispatched to the worker.
                        </p>
                      )}
                    </div>
                  )}

                  {action.guardrail_score != null && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            action.guardrail_score > 0.8 ? 'bg-emerald-500' :
                            action.guardrail_score > 0.5 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${action.guardrail_score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {(action.guardrail_score * 100).toFixed(0)}%
                      </span>
                      {action.guardrail_notes && (
                        <span className="text-xs text-red-400">· {action.guardrail_notes}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => review(action.id, 'approve')}>
                      ✓ Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => review(action.id, 'reject')}>
                      ✗ Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
