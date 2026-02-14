'use client';
import { Progress } from './ui/Progress';
import { Card } from './ui/Card';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import type { BatchStatus as BatchStatusType } from '@/lib/api';

interface BatchStatusProps {
  batch: BatchStatusType;
}

export function BatchStatus({ batch }: BatchStatusProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-zinc-400">
          <span>{batch.completed}/{batch.totalJobs} completed</span>
          <span>{batch.overallProgress}%</span>
        </div>
        <Progress value={batch.overallProgress} />
      </div>
      <div className="space-y-3">
        {batch.jobs.map(job => (
          <Card key={job.jobId} className="!p-3">
            <div className="flex items-center gap-3">
              {job.status === 'completed' || job.status === 'ready' ? (
                <Check className="w-4 h-4 text-green-400 shrink-0" />
              ) : job.status === 'failed' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-primary-400 animate-spin shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-200 truncate">{job.videoTitle}</p>
                <p className="text-xs text-zinc-500">{job.status} - {job.progress}%</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
