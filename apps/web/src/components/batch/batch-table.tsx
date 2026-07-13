'use client';

import { motion } from 'framer-motion';
import { CircleAlert, CircleCheck, CircleDashed, Loader2 } from 'lucide-react';
import { CapabilityBadge } from '@/components/shared/capability-badge';
import { ProviderBadge } from '@/components/shared/provider-badge';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import type { TaskType } from '@/lib/types';

export type BatchRowStatus = 'pending' | 'running' | 'done' | 'error';

export interface BatchRow {
  readonly taskId: string;
  readonly prompt: string;
  readonly status: BatchRowStatus;
  readonly capability?: TaskType;
  readonly answer?: string;
  readonly error?: string;
}

function StatusBadge({ status }: { status: BatchRowStatus }) {
  switch (status) {
    case 'pending':
      return (
        <Badge>
          <CircleDashed />
          Pending
        </Badge>
      );
    case 'running':
      return (
        <Badge variant="info">
          <Loader2 className="animate-spin" />
          Running
        </Badge>
      );
    case 'done':
      return (
        <Badge variant="success">
          <CircleCheck />
          Done
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="danger">
          <CircleAlert />
          Failed
        </Badge>
      );
  }
}

export function BatchTable({ rows }: { rows: readonly BatchRow[] }) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 font-mono text-xs tracking-wider text-slate-500 uppercase">
              <th className="px-5 py-3.5 font-medium">Task ID</th>
              <th className="px-5 py-3.5 font-medium">Capability</th>
              <th className="px-5 py-3.5 font-medium">Provider</th>
              <th className="px-5 py-3.5 font-medium">Status</th>
              <th className="px-5 py-3.5 font-medium">Answer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <motion.tr
                key={row.taskId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-white/5 last:border-none"
              >
                <td className="px-5 py-3.5 font-mono text-xs text-slate-300">
                  {row.taskId}
                </td>
                <td className="px-5 py-3.5">
                  {row.capability !== undefined ? (
                    <CapabilityBadge type={row.capability} />
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {row.status === 'done' ? (
                    <ProviderBadge kind="hybrid" />
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={row.status} />
                </td>
                <td className="max-w-md px-5 py-3.5 text-slate-400">
                  <span className="line-clamp-2 whitespace-pre-line">
                    {row.status === 'error' ? row.error : (row.answer ?? '—')}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
