import { Cpu, Flame, GitMerge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type ProviderKind = 'hybrid' | 'local' | 'fireworks';

const providerMeta: Record<
  ProviderKind,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: 'accent' | 'success' | 'warning';
  }
> = {
  hybrid: { label: 'Hybrid · local-first', icon: GitMerge, variant: 'accent' },
  local: { label: 'Local vLLM', icon: Cpu, variant: 'success' },
  fireworks: { label: 'Fireworks AI', icon: Flame, variant: 'warning' },
};

export function ProviderBadge({ kind }: { kind: ProviderKind }) {
  const meta = providerMeta[kind];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon />
      {meta.label}
    </Badge>
  );
}
