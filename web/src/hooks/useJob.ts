'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getJobStatus, type JobStatus } from '@/lib/api';

const POLL_INTERVAL = 2000;
const TERMINAL_STATES = ['completed', 'failed', 'ready'];

export function useJob(jobId: string | null) {
  const [data, setData] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const status = await getJobStatus(jobId);
        setData(status);

        if (TERMINAL_STATES.includes(status.status)) {
          stopPolling();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        stopPolling();
      }
    };

    // Poll immediately, then every 2s
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return stopPolling;
  }, [jobId, stopPolling]);

  return { data, error, stopPolling };
}
