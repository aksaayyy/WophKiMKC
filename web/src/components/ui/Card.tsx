import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-900/50 p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
