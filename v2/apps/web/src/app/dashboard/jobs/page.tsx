'use client';

import { useEffect, useState } from 'react';
import { jobApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner, EmptyState } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { statusColor, platformIcon, formatRelative } from '@/lib/utils';
import { toast } from 'sonner';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  const load = async () => {
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (platformFilter !== 'all') params.platform = platformFilter;
      const { jobs } = await jobApi.list(params);
      setJobs(jobs);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [statusFilter, platformFilter]);

  const handleAction = async (id: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      await jobApi[action](id);
      toast.success(`Job ${action}d`);
      load();
    } catch {
      toast.error(`Failed to ${action} job`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage scheduled and running jobs</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white/[0.03] border-white/[0.08]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-40 bg-white/[0.03] border-white/[0.08]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="reddit">Reddit</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState icon="⚡" title="No jobs" description="Jobs are created automatically when agents run." />
      ) : (
        <div className="space-y-2">
          {jobs.map((job, i) => (
            <div
              key={job.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition-all duration-200 animate-fade-up"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${statusColor(job.status)}`}>
                {job.status}
              </span>
              <span className="text-lg w-6 text-center">{platformIcon(job.platform)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-medium truncate">{job.name || job.job_type}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {job.job_type} · {formatRelative(job.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {job.status === 'running' || job.status === 'active' ? (
                  <Button variant="outline" size="sm" onClick={() => handleAction(job.id, 'pause')}>
                    Pause
                  </Button>
                ) : job.status === 'paused' ? (
                  <Button variant="outline" size="sm" onClick={() => handleAction(job.id, 'resume')}>
                    Resume
                  </Button>
                ) : null}
                {job.status !== 'completed' && job.status !== 'cancelled' && (
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleAction(job.id, 'cancel')}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
