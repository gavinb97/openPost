import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelative(date: string | Date) {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function platformIcon(platform: string) {
  const icons: Record<string, string> = {
    twitter: '𝕏',
    reddit: '●',
    youtube: '▶',
    tiktok: '♪',
    facebook: 'f',
    instagram: '◉',
  };
  return icons[platform] || '◎';
}

export function platformColor(platform: string) {
  const colors: Record<string, string> = {
    twitter: 'bg-white/10 text-white border border-white/10',
    reddit: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    youtube: 'bg-red-500/15 text-red-400 border border-red-500/20',
    tiktok: 'bg-pink-500/15 text-pink-400 border border-pink-500/20',
    facebook: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    instagram: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  };
  return colors[platform] || 'bg-white/10 text-muted-foreground border border-white/10';
}

export function statusColor(status: string) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    running: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    approved: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    posted: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    pending_review: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    paused: 'bg-white/[0.06] text-muted-foreground border border-white/[0.08]',
    failed: 'bg-red-500/15 text-red-400 border border-red-500/20',
    rejected: 'bg-red-500/15 text-red-400 border border-red-500/20',
    cancelled: 'bg-red-500/15 text-red-400 border border-red-500/20',
  };
  return colors[status] || 'bg-white/[0.06] text-muted-foreground border border-white/[0.08]';
}
