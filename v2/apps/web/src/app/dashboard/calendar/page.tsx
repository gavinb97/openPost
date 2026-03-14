'use client';

// ============================================================
// Content Calendar — Visual view of all scheduled content
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { campaignApi, oauthApi, contentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { cn, platformIcon, platformColor } from '@/lib/utils';
import Link from 'next/link';

type CalendarEvent = {
  id: string;
  platform: string;
  status: string;
  scheduled_at: string;
  published_at?: string;
  content_text?: string;
  adapted_content?: string;
  use_adapted?: boolean;
  account_handle?: string;
  campaign_name?: string;
  campaign_id?: string;
  platform_url?: string;
  source_type: 'campaign' | 'standalone' | 'agent';
};

const SOURCE_COLORS: Record<string, string> = {
  campaign: 'border-l-primary',
  standalone: 'border-l-cyan-400',
  agent: 'border-l-purple-400',
};

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  queued: 'bg-blue-400',
  scheduled: 'bg-blue-400',
  published: 'bg-emerald-400',
  failed: 'bg-red-400',
  processing: 'bg-amber-400 animate-pulse',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [aiHookLoading, setAiHookLoading] = useState(false);

  const [quickForm, setQuickForm] = useState({
    platform_account_id: '',
    platform: '',
    content_text: '',
    scheduled_at: '',
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      const data = await campaignApi.calendar({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      setEvents(data.events || []);
    } catch (err) {
      // calendar might not have any events yet
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => {
    oauthApi.accounts().then(({ accounts }) => setAccounts(accounts)).catch(() => {});
  }, []);

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
    setSelectedDay(null);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = new Date(year, month).toLocaleString('en', { month: 'long' });

  function eventsForDay(day: number): CalendarEvent[] {
    return events.filter((e) => {
      const d = new Date(e.scheduled_at);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : [];

  function openQuickAdd(day: number) {
    const dt = new Date(year, month, day, 12, 0);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setQuickForm({ ...quickForm, scheduled_at: local });
    setSelectedDay(day);
    setShowQuickAdd(true);
  }

  async function generateAiHook() {
    if (!quickForm.platform) { toast.error('Select a platform first'); return; }
    setAiHookLoading(true);
    try {
      const { hooks } = await contentApi.hooks({ topic: 'app launch promotion', platform: quickForm.platform, count: 1 });
      if (hooks?.[0]) setQuickForm({ ...quickForm, content_text: hooks[0] });
    } catch {
      toast.error('Failed to generate hook');
    } finally {
      setAiHookLoading(false);
    }
  }

  async function submitQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickForm.content_text || !quickForm.scheduled_at || !quickForm.platform) {
      toast.error('Platform, content, and time are required');
      return;
    }
    setQuickAddLoading(true);
    try {
      await campaignApi.schedulePost({
        platform_account_id: quickForm.platform_account_id || undefined,
        platform: quickForm.platform,
        content_text: quickForm.content_text,
        scheduled_at: new Date(quickForm.scheduled_at).toISOString(),
      });
      toast.success('Post scheduled!');
      setShowQuickAdd(false);
      setQuickForm({ platform_account_id: '', platform: '', content_text: '', scheduled_at: '' });
      loadEvents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule');
    } finally {
      setQuickAddLoading(false);
    }
  }

  async function deleteEvent(event: CalendarEvent) {
    if (event.source_type !== 'standalone') {
      toast.error('Only standalone scheduled posts can be deleted from here. Manage campaigns from the Campaigns page.');
      return;
    }
    try {
      await campaignApi.deleteScheduledPost(event.id);
      toast.success('Post removed from calendar');
      loadEvents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Content Calendar</h1>
          <p className="text-muted-foreground mt-1">All your scheduled content at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/campaigns/new">
            <Button variant="outline" size="sm">⚡ New Campaign</Button>
          </Link>
          <Button variant="glow" size="sm" onClick={() => openQuickAdd(selectedDay || today.getDate())}>
            + Schedule Post
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{monthName} {year}</CardTitle>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-muted-foreground hover:text-foreground">‹</button>
                  <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDay(today.getDate()); }}
                    className="text-xs text-primary hover:underline px-2">Today</button>
                  <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-muted-foreground hover:text-foreground">›</button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              {loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells before first day */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[80px]" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayEvents = eventsForDay(day);
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const isSelected = day === selectedDay;

                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        onDoubleClick={() => openQuickAdd(day)}
                        className={cn(
                          'min-h-[80px] p-1.5 rounded-lg border cursor-pointer transition-all',
                          isSelected
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.02]',
                        )}
                      >
                        <div className={cn(
                          'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                          isToday ? 'bg-primary text-white' : 'text-muted-foreground',
                          isSelected && !isToday ? 'text-primary' : '',
                        )}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((ev, j) => (
                            <div
                              key={j}
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded border-l-2 truncate',
                                SOURCE_COLORS[ev.source_type] || 'border-l-white/20',
                                'bg-white/[0.04]',
                              )}
                            >
                              <span className="mr-1">{platformIcon(ev.platform)}</span>
                              {ev.content_text?.slice(0, 20) || ev.campaign_name || 'Post'}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-muted-foreground pl-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded border-l-2 border-l-primary bg-white/[0.04]" />
                  Campaign
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded border-l-2 border-l-cyan-400 bg-white/[0.04]" />
                  Scheduled
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded border-l-2 border-l-purple-400 bg-white/[0.04]" />
                  Agent
                </div>
                <span className="text-xs text-muted-foreground ml-auto">Double-click a day to add</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Detail Panel */}
        <div className="space-y-4">
          {showQuickAdd ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Schedule Post</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitQuickAdd} className="space-y-3">
                  <div>
                    <Label>Platform</Label>
                    <Select
                      value={quickForm.platform}
                      onValueChange={(v) => {
                        const acc = accounts.find((a) => a.platform === v);
                        setQuickForm({
                          ...quickForm,
                          platform: v,
                          platform_account_id: acc?.id || '',
                        });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Choose platform" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twitter">𝕏 Twitter/X</SelectItem>
                        <SelectItem value="reddit">● Reddit</SelectItem>
                        <SelectItem value="youtube">▶ YouTube</SelectItem>
                        <SelectItem value="tiktok">♪ TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label>Content</Label>
                      <button type="button" onClick={generateAiHook} disabled={aiHookLoading}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                        {aiHookLoading ? <Spinner size="sm" /> : '✨'} AI Hook
                      </button>
                    </div>
                    <Textarea
                      rows={4}
                      value={quickForm.content_text}
                      onChange={(e) => setQuickForm({ ...quickForm, content_text: e.target.value })}
                      placeholder="What do you want to post?"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{quickForm.content_text.length} chars</p>
                  </div>
                  <div>
                    <Label>Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={quickForm.scheduled_at}
                      onChange={(e) => setQuickForm({ ...quickForm, scheduled_at: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="flex-1" disabled={quickAddLoading}>
                      {quickAddLoading ? <Spinner size="sm" /> : 'Schedule'}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowQuickAdd(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedDay
                    ? `${monthName} ${selectedDay}`
                    : 'Select a day'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedDay ? (
                  <p className="text-sm text-muted-foreground">Click a day to see posts. Double-click to add one.</p>
                ) : selectedDayEvents.length === 0 ? (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-sm text-muted-foreground">Nothing scheduled</p>
                    <Button size="sm" variant="outline" onClick={() => openQuickAdd(selectedDay)}>
                      + Add Post
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayEvents.map((ev, i) => (
                      <div
                        key={i}
                        className={cn(
                          'p-3 rounded-lg border-l-2 bg-white/[0.02]',
                          SOURCE_COLORS[ev.source_type] || '',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{platformIcon(ev.platform)}</span>
                            <span className="text-xs text-muted-foreground">
                              @{ev.account_handle || ev.platform}
                            </span>
                            <div className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[ev.status] || 'bg-white/20')} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(ev.scheduled_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs leading-relaxed line-clamp-3">
                          {(ev.use_adapted ? ev.adapted_content : ev.content_text) || ev.content_text || '—'}
                        </p>

                        {ev.campaign_name && (
                          <div className="mt-1.5">
                            {ev.campaign_id ? (
                              <Link href={`/dashboard/campaigns/${ev.campaign_id}`}
                                className="text-[10px] text-primary hover:underline">
                                ⚡ {ev.campaign_name}
                              </Link>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">↬ {ev.campaign_name}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <Badge className={`text-[10px] ${
                            ev.status === 'published' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                            ev.status === 'failed' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                            'bg-amber-500/15 text-amber-400 border-amber-500/20'
                          }`}>
                            {ev.status}
                          </Badge>
                          {ev.platform_url && (
                            <a href={ev.platform_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline">
                              View →
                            </a>
                          )}
                          {ev.source_type === 'standalone' && (
                            <button onClick={() => deleteEvent(ev)} className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors">
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Monthly stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total scheduled</span>
                <span className="text-foreground font-medium">{events.length}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Published</span>
                <span className="text-emerald-400 font-medium">
                  {events.filter((e) => e.status === 'published').length}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Pending</span>
                <span className="text-amber-400 font-medium">
                  {events.filter((e) => ['pending', 'queued', 'scheduled'].includes(e.status)).length}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Failed</span>
                <span className="text-red-400 font-medium">
                  {events.filter((e) => e.status === 'failed').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
