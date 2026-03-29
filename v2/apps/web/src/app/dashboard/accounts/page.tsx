'use client';

import { useEffect, useState } from 'react';
import { oauthApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner, EmptyState } from '@/components/ui/spinner';
import { platformIcon, platformColor, formatRelative } from '@/lib/utils';
import { toast } from 'sonner';
 
const platforms = [
  { id: 'twitter', name: 'Twitter / X', icon: '𝕏', comingSoon: false, gradient: 'from-white/10 to-white/5' },
  { id: 'reddit', name: 'Reddit', icon: '●', comingSoon: false, gradient: 'from-orange-500/15 to-orange-600/5' },
  { id: 'youtube', name: 'YouTube', icon: '▶', comingSoon: false, gradient: 'from-red-500/15 to-red-600/5' },
  { id: 'tiktok', name: 'TikTok', icon: '♪', comingSoon: false, gradient: 'from-pink-500/15 to-cyan-500/5' },
  { id: 'facebook', name: 'Facebook', icon: 'f', comingSoon: true, gradient: 'from-blue-500/10 to-blue-600/5' },
  { id: 'instagram', name: 'Instagram', icon: '◉', comingSoon: true, gradient: 'from-purple-500/10 to-pink-500/5' },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { accounts } = await oauthApi.accounts();
      setAccounts(accounts);
    } catch {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const disconnect = async (id: string) => {
    if (!confirm('Disconnect this account? Agents using it will stop working.')) return;
    try {
      await oauthApi.disconnect(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      toast.success('Account disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const connect = async (platform: string) => {
    try {
      const { url } = await oauthApi.start(platform);
      window.location.href = url;
    } catch {
      toast.error(`Failed to start ${platform} OAuth flow`);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Connected Accounts</h1>
        <p className="text-muted-foreground mt-1">Manage your social media platform connections</p>
      </div>

      {/* Connect buttons */}
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Add Platform</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {platforms.map((p) => (
            <button
              key={p.id}
              className={`group relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-white/[0.06] bg-gradient-to-b ${p.gradient} backdrop-blur-sm hover:border-white/[0.12] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed`}
              disabled={p.comingSoon}
              onClick={() => !p.comingSoon && connect(p.id)}
            >
              <span className="text-2xl">{p.icon}</span>
              <span className="text-xs font-medium">{p.comingSoon ? 'Coming Soon' : p.name}</span>
              {!p.comingSoon && (
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-white/[0.02] to-transparent" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Connected accounts */}
      {accounts.length === 0 ? (
        <EmptyState
          icon="◎"
          title="No accounts connected"
          description="Connect a social media account to start using AI agents."
        />
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${platformColor(acc.platform)}`}>
                {platformIcon(acc.platform)}
              </div>
              <div className="flex-1">
                <p className="font-display font-medium">@{acc.platform_username}</p>
                <p className="text-xs text-muted-foreground">
                  {acc.platform} · Connected {formatRelative(acc.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await oauthApi.refreshToken(acc.id);
                      toast.success('Token refreshed');
                    } catch {
                      toast.error('Failed to refresh token');
                    }
                  }}
                >
                  Refresh
                </Button>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => disconnect(acc.id)}>
                  Disconnect
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
