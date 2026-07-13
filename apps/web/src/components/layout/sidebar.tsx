'use client';

import { Activity, Layers, Terminal } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  { href: '/playground', label: 'Playground', icon: Terminal },
  { href: '/batch', label: 'Batch Demo', icon: Layers },
  { href: '/status', label: 'System Status', icon: Activity },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-white/5 py-8 pr-6 lg:block">
      <p className="mb-4 px-4 font-mono text-xs tracking-widest text-slate-500 uppercase">
        Console
      </p>
      <nav className="flex flex-col gap-1">
        {sidebarLinks.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white',
                active && 'bg-amd/10 text-white',
              )}
            >
              <Icon className={cn('size-4', active ? 'text-amd-bright' : '')} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
