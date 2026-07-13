import { cn } from '@/lib/utils';

export function GlassCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/30 backdrop-blur-xl',
        className,
      )}
      {...props}
    />
  );
}
