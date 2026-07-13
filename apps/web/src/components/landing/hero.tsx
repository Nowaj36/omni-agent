'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Github } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/site';

export function Hero() {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center px-4 pt-24 pb-20 text-center sm:pt-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Badge variant="accent">AMD AI Agent Hackathon</Badge>
      </motion.div>

      <motion.h1
        className="mt-6 bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-7xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
      >
        {siteConfig.name}
      </motion.h1>

      <motion.p
        className="mt-5 max-w-2xl text-lg text-slate-400 sm:text-xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.16 }}
      >
        {siteConfig.tagline}. Local-first inference, confidence-aware fallback
        to Fireworks AI, and self-verification before every answer.
      </motion.p>

      <motion.div
        className="mt-10 flex flex-col gap-3 sm:flex-row"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.24 }}
      >
        <Link href="/playground">
          <Button size="lg" className="w-full sm:w-auto">
            Try Demo
            <ArrowRight />
          </Button>
        </Link>
        <a
          href={siteConfig.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="secondary" size="lg" className="w-full sm:w-auto">
            <Github />
            GitHub
          </Button>
        </a>
      </motion.div>
    </section>
  );
}
