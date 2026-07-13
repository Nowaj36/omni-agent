'use client';

import { FileJson, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import type { BatchTask } from '@/lib/types';
import { cn } from '@/lib/utils';

function parseTasks(raw: string): BatchTask[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('The file is not valid JSON.');
  }
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Expected a non-empty JSON array of tasks.');
  }
  return data.map((entry, index) => {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      typeof (entry as { task_id?: unknown }).task_id !== 'string' ||
      typeof (entry as { prompt?: unknown }).prompt !== 'string'
    ) {
      throw new Error(
        `Task at index ${index} must be { "task_id": string, "prompt": string }.`,
      );
    }
    const task = entry as { task_id: string; prompt: string };
    if (task.task_id.length === 0 || task.prompt.length === 0) {
      throw new Error(`Task at index ${index} has an empty task_id or prompt.`);
    }
    return { task_id: task.task_id, prompt: task.prompt };
  });
}

export function UploadCard({
  onTasks,
  disabled,
  fileName,
}: {
  onTasks: (tasks: BatchTask[], fileName: string) => void;
  disabled: boolean;
  fileName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const readFile = async (file: File) => {
    setError(undefined);
    try {
      onTasks(parseTasks(await file.text()), file.name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  return (
    <div>
      <GlassCard
        role="button"
        tabIndex={0}
        aria-label="Upload tasks.json"
        onClick={() => {
          if (!disabled) {
            inputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (!disabled && file !== undefined) {
            void readFile(file);
          }
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 border-dashed p-10 text-center transition-colors',
          dragging && 'border-amd/60 bg-amd/5',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        {fileName === undefined ? (
          <UploadCloud className="size-8 text-slate-500" />
        ) : (
          <FileJson className="size-8 text-amd-bright" />
        )}
        <div>
          <p className="font-medium text-white">
            {fileName ?? 'Upload tasks.json'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Drop a file here or click to browse ·{' '}
            <span className="font-mono text-xs">
              {'[{ "task_id", "prompt" }]'}
            </span>
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file !== undefined) {
              void readFile(file);
            }
            event.target.value = '';
          }}
        />
      </GlassCard>
      {error !== undefined && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
