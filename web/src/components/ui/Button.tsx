import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            primary: 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20',
            secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700',
            ghost: 'hover:bg-zinc-800 text-zinc-300',
          }[variant],
          {
            sm: 'text-sm px-3 py-1.5 gap-1.5',
            md: 'text-sm px-4 py-2.5 gap-2',
            lg: 'text-base px-6 py-3 gap-2',
          }[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
