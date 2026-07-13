'use client';

import {
  Cpu,
  Flame,
  GitMerge,
  Layers,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  type ServiceStatus,
  StatusCard,
} from '@/components/shared/status-card';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { fetchHealth } from '@/lib/api';
import type { HealthStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const POLL_INTERVAL_MS = 15_000;

function formatUptime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthStatus | undefined>();
  const [apiStatus, setApiStatus] = useState<ServiceStatus>('unknown');
  const [checkedAt, setCheckedAt] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const check = useCallback(async () => {
    setRefreshing(true);
    try {
      const status = await fetchHealth();
      setHealth(status);
      setApiStatus('online');
    } catch {
      setHealth(undefined);
      setApiStatus('offline');
    } finally {
      setCheckedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void check();
    const interval = setInterval(() => void check(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [check]);

  // The public API exposes a single /health endpoint; in-process services
  // follow it, while upstream inference providers are not individually
  // reported and stay honest as "unknown".
  const services = [
    {
      name: 'Local vLLM',
      description:
        'Primary inference tier. Reachability is not exposed through the public API.',
      status: 'unknown' as ServiceStatus,
      icon: Cpu,
    },
    {
      name: 'Fireworks',
      description:
        'Cloud fallback tier. Reachability is not exposed through the public API.',
      status: 'unknown' as ServiceStatus,
      icon: Flame,
    },
    {
      name: 'Hybrid Provider',
      description:
        'Local-first routing with confidence-aware fallback, inside the API process.',
      status: apiStatus,
      icon: GitMerge,
    },
    {
      name: 'Verification',
      description:
        'Provider-aware self-verification engine, inside the API process.',
      status: apiStatus,
      icon: ShieldCheck,
    },
    {
      name: 'Batch Runner',
      description:
        'Executes tasks.json workloads through the same agent pipeline.',
      status: apiStatus,
      icon: Layers,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            System Status
          </h1>
          <p className="mt-1.5 text-slate-400">
            Live view of the OmniAgent pipeline, refreshed every 15 seconds.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={check}>
          <RefreshCcw className={cn(refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </header>

      <GlassCard className="flex flex-wrap items-center gap-x-10 gap-y-3 p-5">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'size-2.5 rounded-full',
              apiStatus === 'online' && 'animate-pulse-dot bg-emerald-400',
              apiStatus === 'offline' && 'bg-red-500',
              apiStatus === 'unknown' && 'bg-slate-500',
            )}
          />
          <span className="font-medium text-white">
            {apiStatus === 'online'
              ? 'All systems operational'
              : apiStatus === 'offline'
                ? 'API unreachable'
                : 'Checking…'}
          </span>
        </div>
        {health !== undefined && (
          <>
            <p className="font-mono text-xs text-slate-500">
              env <span className="text-slate-300">{health.environment}</span>
            </p>
            <p className="font-mono text-xs text-slate-500">
              uptime{' '}
              <span className="text-slate-300">
                {formatUptime(health.uptimeSeconds)}
              </span>
            </p>
          </>
        )}
        {checkedAt !== undefined && (
          <p className="ml-auto font-mono text-xs text-slate-500">
            last check <span className="text-slate-300">{checkedAt}</span>
          </p>
        )}
      </GlassCard>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <StatusCard
            key={service.name}
            name={service.name}
            description={service.description}
            status={service.status}
            icon={service.icon}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
