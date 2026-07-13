'use client';

import { CornerDownLeft, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Textarea } from '@/components/ui/textarea';

export function PromptCard({
  value,
  onChange,
  onRun,
  running,
}: {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  running: boolean;
}) {
  const canRun = !running && value.trim().length > 0;

  return (
    <GlassCard className="p-5">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            if (canRun) {
              onRun();
            }
          }
        }}
        placeholder="Ask anything..."
        rows={6}
        maxLength={20_000}
        className="border-none bg-transparent px-1 py-0 backdrop-blur-none focus:ring-0"
      />
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
        <p className="hidden items-center gap-1.5 font-mono text-xs text-slate-500 sm:flex">
          <CornerDownLeft className="size-3" />
          Ctrl + Enter to run
        </p>
        <Button onClick={onRun} disabled={!canRun} className="ml-auto">
          {running ? (
            <>
              <Loader2 className="animate-spin" />
              Running
            </>
          ) : (
            <>
              <Sparkles />
              Run
            </>
          )}
        </Button>
      </div>
    </GlassCard>
  );
}
