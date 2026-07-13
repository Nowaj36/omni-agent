import {
  Braces,
  Bug,
  Calculator,
  Code2,
  FileText,
  Lightbulb,
  MessageCircleQuestion,
  Tags,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TaskType } from '@/lib/types';

const capabilityMeta: Record<
  TaskType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  qa: { label: 'Q&A', icon: MessageCircleQuestion },
  summarization: { label: 'Summarization', icon: FileText },
  classification: { label: 'Classification', icon: Tags },
  math: { label: 'Math', icon: Calculator },
  ner: { label: 'NER', icon: Braces },
  codegen: { label: 'Code Generation', icon: Code2 },
  debug: { label: 'Code Debugging', icon: Bug },
  reasoning: { label: 'Reasoning', icon: Lightbulb },
};

export function CapabilityBadge({ type }: { type: TaskType }) {
  const meta = capabilityMeta[type];
  const Icon = meta.icon;
  return (
    <Badge variant="info">
      <Icon />
      {meta.label}
    </Badge>
  );
}
