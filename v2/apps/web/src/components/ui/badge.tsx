import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'neon' | 'glow';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-primary/15 text-primary border-primary/20',
    secondary: 'bg-white/[0.06] text-muted-foreground border-white/[0.08]',
    destructive: 'bg-red-500/15 text-red-400 border-red-500/20',
    outline: 'text-foreground border-white/[0.1] bg-transparent',
    neon: 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/25',
    glow: 'bg-primary/15 text-primary border-primary/25 shadow-sm shadow-primary/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase transition-all',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
