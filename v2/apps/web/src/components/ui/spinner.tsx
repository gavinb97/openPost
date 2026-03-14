'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div className={cn('relative', sizes[size], className)}>
      <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      <div className="absolute inset-0 rounded-full animate-pulse-glow opacity-40 bg-primary/20 blur-md" />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && (
        <div className="relative mb-6">
          <span className="text-5xl block animate-float">{icon}</span>
          <div className="absolute inset-0 blur-2xl opacity-20 bg-primary/40 rounded-full scale-150" />
        </div>
      )}
      <h3 className="text-lg font-display font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
