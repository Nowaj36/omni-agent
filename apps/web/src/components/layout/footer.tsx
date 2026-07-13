import { siteConfig } from '@/lib/site';

export function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
        <p>
          <span className="font-medium text-slate-300">{siteConfig.name}</span>{' '}
          — {siteConfig.tagline}
        </p>
        <p className="font-mono text-xs">
          Built for the AMD AI Agent Hackathon
        </p>
      </div>
    </footer>
  );
}
