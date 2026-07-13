import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-base text-slate-100 placeholder:text-slate-500 backdrop-blur-sm transition-colors duration-200 focus:border-amd/50 focus:outline-none focus:ring-2 focus:ring-amd/20',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
