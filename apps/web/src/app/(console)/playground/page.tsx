'use client';

import { AlertTriangle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { AnswerCard } from '@/components/playground/answer-card';
import { PromptCard } from '@/components/playground/prompt-card';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { GlassCard } from '@/components/ui/glass-card';
import { ApiError, runAgentTask, type TimedAgentResult } from '@/lib/api';

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState<TimedAgentResult | undefined>();
  const [error, setError] = useState<string | undefined>();

  const run = useCallback(async () => {
    setRunning(true);
    setError(undefined);
    setResponse(undefined);
    try {
      setResponse(await runAgentTask({ input: prompt.trim() }));
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Could not reach the OmniAgent API. Is the backend running?',
      );
    } finally {
      setRunning(false);
    }
  }, [prompt]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Playground
        </h1>
        <p className="mt-1.5 text-slate-400">
          Send a task to the agent — it routes, generates, and verifies the
          answer before returning.
        </p>
      </header>

      <PromptCard
        value={prompt}
        onChange={setPrompt}
        onRun={run}
        running={running}
      />

      {running && <LoadingSkeleton />}

      {error !== undefined && (
        <GlassCard className="flex items-start gap-3 border-red-500/20 p-5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-400" />
          <div>
            <p className="font-medium text-red-300">Request failed</p>
            <p className="mt-1 text-sm text-slate-400">{error}</p>
          </div>
        </GlassCard>
      )}

      {response !== undefined && (
        <AnswerCard result={response.result} durationMs={response.durationMs} />
      )}
    </div>
  );
}
