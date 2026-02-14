import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn('w-full h-2 bg-zinc-800 rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
