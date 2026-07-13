'use client';

import { Download, Loader2, Play, RotateCcw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { type BatchRow, BatchTable } from '@/components/batch/batch-table';
import { UploadCard } from '@/components/batch/upload-card';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { ApiError, runAgentTask } from '@/lib/api';
import { formatAnswerPlain } from '@/lib/format-answer';
import type { BatchTask, BatchTaskResult } from '@/lib/types';

export default function BatchPage() {
  const [rows, setRows] = useState<readonly BatchRow[]>([]);
  const [fileName, setFileName] = useState<string | undefined>();
  const [running, setRunning] = useState(false);

  const completed = useMemo(
    () =>
      rows.filter((row) => row.status === 'done' || row.status === 'error')
        .length,
    [rows],
  );
  const finished = rows.length > 0 && completed === rows.length;

  const loadTasks = useCallback((tasks: BatchTask[], name: string) => {
    setFileName(name);
    setRows(
      tasks.map((task) => ({
        taskId: task.task_id,
        prompt: task.prompt,
        status: 'pending',
      })),
    );
  }, []);

  const updateRow = useCallback((taskId: string, patch: Partial<BatchRow>) => {
    setRows((current) =>
      current.map((row) =>
        row.taskId === taskId ? { ...row, ...patch } : row,
      ),
    );
  }, []);

  const runBatch = useCallback(async () => {
    setRunning(true);
    setRows((current) =>
      current.map((row) => ({
        taskId: row.taskId,
        prompt: row.prompt,
        status: 'pending',
      })),
    );
    // Sequential on purpose: keeps load on the local model predictable and
    // makes per-row progress meaningful for the demo.
    for (const row of rows) {
      updateRow(row.taskId, { status: 'running' });
      try {
        const { result } = await runAgentTask({ input: row.prompt });
        updateRow(row.taskId, {
          status: 'done',
          capability: result.taskType,
          answer: formatAnswerPlain(result.output),
        });
      } catch (caught) {
        updateRow(row.taskId, {
          status: 'error',
          error:
            caught instanceof ApiError
              ? caught.message
              : 'Could not reach the OmniAgent API.',
        });
      }
    }
    setRunning(false);
  }, [rows, updateRow]);

  const downloadResults = useCallback(() => {
    const results: BatchTaskResult[] = rows
      .filter((row) => row.status === 'done')
      .map((row) => ({ task_id: row.taskId, answer: row.answer ?? '' }));
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'results.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Batch Demo
        </h1>
        <p className="mt-1.5 text-slate-400">
          Upload a <span className="font-mono text-sm">tasks.json</span> file
          and run every task through the agent.
        </p>
      </header>

      <UploadCard onTasks={loadTasks} disabled={running} fileName={fileName} />

      {rows.length > 0 && (
        <>
          <GlassCard className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-sm text-slate-300">
                  {running
                    ? `Processing ${completed + 1} of ${rows.length}…`
                    : finished
                      ? `Finished ${rows.length} tasks`
                      : `${rows.length} tasks ready`}
                </p>
                <p className="font-mono text-xs text-slate-500">
                  {completed}/{rows.length}
                </p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-amd transition-all duration-500"
                  style={{
                    width: `${rows.length === 0 ? 0 : (completed / rows.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={runBatch} disabled={running}>
                {running ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Running
                  </>
                ) : finished ? (
                  <>
                    <RotateCcw />
                    Run Again
                  </>
                ) : (
                  <>
                    <Play />
                    Run Batch
                  </>
                )}
              </Button>
              {finished && (
                <Button variant="secondary" onClick={downloadResults}>
                  <Download />
                  results.json
                </Button>
              )}
            </div>
          </GlassCard>

          <BatchTable rows={rows} />
        </>
      )}
    </div>
  );
}
