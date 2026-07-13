'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Github, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { navLinks, siteConfig } from '@/lib/site';
import { cn } from '@/lib/utils';

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute top-0 right-0 flex h-full w-72 flex-col border-l border-white/10 bg-surface p-6"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="text-lg font-semibold text-white">
                {siteConfig.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={onClose}
              >
                <X className="size-5" />
              </Button>
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    'rounded-xl px-4 py-3 text-base text-slate-300 transition-colors hover:bg-white/5 hover:text-white',
                    pathname.startsWith(link.href) && 'bg-white/5 text-white',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto"
            >
              <Button variant="secondary" className="w-full">
                <Github />
                GitHub
              </Button>
            </a>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
