'use client';

import { motion } from 'framer-motion';
import { RefreshCcw, ShieldAlert, ShieldCheck, Timer } from 'lucide-react';
import { CapabilityBadge } from '@/components/shared/capability-badge';
import { CopyButton } from '@/components/shared/copy-button';
import { Markdown } from '@/components/shared/markdown';
import { ProviderBadge } from '@/components/shared/provider-badge';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { formatAnswerMarkdown, formatAnswerPlain } from '@/lib/format-answer';
import type { AgentResult } from '@/lib/types';

export function AnswerCard({
  result,
  durationMs,
}: {
  result: AgentResult;
  durationMs: number;
}) {
  const { verification } = result;
  const seconds = (durationMs / 1000).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <GlassCard className="p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <CapabilityBadge type={result.taskType} />
          <ProviderBadge kind="hybrid" />
          <Badge variant={verification.passed ? 'success' : 'warning'}>
            {verification.passed ? <ShieldCheck /> : <ShieldAlert />}
            {verification.passed ? 'Verified' : 'Unverified'}
          </Badge>
          {verification.attempts > 1 && (
            <Badge>
              <RefreshCcw />
              {verification.attempts} attempts
            </Badge>
          )}
          <Badge>
            <Timer />
            {seconds}s
          </Badge>
          <CopyButton
            text={formatAnswerPlain(result.output)}
            className="ml-auto"
          />
        </div>

        {verification.feedback !== undefined && (
          <p className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
            {verification.feedback}
          </p>
        )}

        <Markdown content={formatAnswerMarkdown(result.output)} />
      </GlassCard>
    </motion.div>
  );
}
