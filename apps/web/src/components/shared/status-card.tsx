'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

export type ServiceStatus = 'online' | 'offline' | 'unknown';

const statusMeta: Record<
  ServiceStatus,
  { label: string; dot: string; text: string }
> = {
  online: {
    label: 'Online',
    dot: 'bg-emerald-400 shadow-[0_0_10px_rgb(52_211_153/0.7)]',
    text: 'text-emerald-400',
  },
  offline: {
    label: 'Offline',
    dot: 'bg-red-500 shadow-[0_0_10px_rgb(239_68_68/0.7)]',
    text: 'text-red-400',
  },
  unknown: {
    label: 'Unknown',
    dot: 'bg-slate-500',
    text: 'text-slate-400',
  },
};

export function StatusCard({
  name,
  description,
  status,
  icon: Icon,
  index = 0,
}: {
  name: string;
  description: string;
  status: ServiceStatus;
  icon: React.ComponentType<{ className?: string }>;
  index?: number;
}) {
  const meta = statusMeta[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <GlassCard className="h-full p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Icon className="size-5 text-slate-300" />
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-2 font-mono text-xs font-medium tracking-wide',
              meta.text,
            )}
          >
            <span className={cn('size-2 rounded-full', meta.dot)} />
            {meta.label}
          </span>
        </div>
        <h3 className="font-semibold text-white">{name}</h3>
        <p className="mt-1.5 text-sm leading-6 text-slate-400">{description}</p>
      </GlassCard>
    </motion.div>
  );
}
