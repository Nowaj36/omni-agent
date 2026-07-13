'use client';

import { motion } from 'framer-motion';
import {
  Container,
  Cpu,
  Flame,
  GitMerge,
  ShieldCheck,
  Waypoints,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';

const features = [
  {
    icon: Waypoints,
    title: 'Hybrid Routing',
    description:
      'A task router classifies every request and dispatches it to the right capability automatically.',
  },
  {
    icon: Cpu,
    title: 'Local vLLM',
    description:
      'Generation runs local-first on a vLLM server for low-latency, on-prem inference.',
  },
  {
    icon: Flame,
    title: 'Fireworks AI',
    description:
      'Production-grade hosted models serve as the always-available cloud inference tier.',
  },
  {
    icon: GitMerge,
    title: 'Confidence-aware Fallback',
    description:
      'Low-confidence or failed local responses transparently retry on Fireworks — no request is lost.',
  },
  {
    icon: ShieldCheck,
    title: 'Provider-aware Verification',
    description:
      'Every answer is verified before it returns, by the same provider family that generated it.',
  },
  {
    icon: Container,
    title: 'Docker Ready',
    description:
      'Ships as a container with server and batch modes — one image for the API and offline runs.',
  },
] as const;

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
          >
            <GlassCard className="h-full p-6 transition-colors duration-300 hover:border-amd/30">
              <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl border border-amd/20 bg-amd/10">
                <feature.icon className="size-5 text-amd-bright" />
              </div>
              <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
              <p className="text-sm leading-6 text-slate-400">
                {feature.description}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
