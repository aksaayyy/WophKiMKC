'use client';
import { useState } from 'react';
import { Link, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UrlInputProps {
  value: string;
  onChange: (url: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  error?: string;
}

const YOUTUBE_PATTERNS = [
  /youtube\.com\/watch\?v=/,
  /youtu\.be\//,
  /youtube\.com\/shorts\//,
  /youtube\.com\/live\//,
];

export function UrlInput({ value, onChange, onSubmit, disabled, error }: UrlInputProps) {
  const [touched, setTouched] = useState(false);

  const isValid = value.trim() === '' || YOUTUBE_PATTERNS.some(p => p.test(value));
  const showError = touched && value.trim() !== '' && !isValid;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={(e) => e.key === 'Enter' && !disabled && isValid && value.trim() && onSubmit()}
          placeholder="Paste a YouTube URL..."
          disabled={disabled}
          className={cn(
            'w-full pl-12 pr-4 py-4 rounded-xl bg-zinc-900 border text-lg',
            'placeholder:text-zinc-600 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
            'disabled:opacity-50',
            showError || error
              ? 'border-red-500/50 focus:ring-red-500/50'
              : 'border-zinc-800 focus:border-primary-500'
          )}
        />
      </div>
      {(showError || error) && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error || 'Please enter a valid YouTube URL'}</span>
        </div>
      )}
    </div>
  );
}
