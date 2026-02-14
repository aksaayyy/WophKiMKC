'use client';
import { Check, Loader2, Download, Zap, Scissors, Search, MessageSquare, Type, Scan } from 'lucide-react';
import { Progress } from './ui/Progress';
import type { JobStatus } from '@/lib/api';

const STAGES = [
  { key: 'queued', label: 'Queued', icon: Loader2 },
  { key: 'downloading', label: 'Downloading video', icon: Download },
  { key: 'transcribing', label: 'Transcribing audio', icon: MessageSquare },
  { key: 'analyzing', label: 'Analyzing audio hooks', icon: Search },
  { key: 'face_tracking', label: 'Face tracking', icon: Scan },
  { key: 'subtitling', label: 'Adding subtitles', icon: Type },
  { key: 'clipping', label: 'Generating clips', icon: Scissors },
  { key: 'ready', label: 'Clips ready', icon: Zap },
  { key: 'completed', label: 'Completed', icon: Check },
];

interface ProcessingStatusProps {
  job: JobStatus;
}

export function ProcessingStatus({ job }: ProcessingStatusProps) {
  const currentIndex = STAGES.findIndex(s => s.key === job.status);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">{job.videoTitle}</h3>
        <p className="text-sm text-zinc-500">Processing {job.clipCount} clips</p>
      </div>

      <Progress value={job.progress} />

      <div className="space-y-3">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = stage.key === job.status;
          const isDone = i < currentIndex;

          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDone
                    ? 'bg-green-500/20 text-green-400'
                    : isActive
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'bg-zinc-800 text-zinc-600'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? 'animate-spin' : ''}`} />
                )}
              </div>
              <span
                className={`text-sm ${
                  isDone ? 'text-green-400' : isActive ? 'text-zinc-100' : 'text-zinc-600'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {job.status === 'failed' && job.error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {job.error}
        </div>
      )}
    </div>
  );
}
