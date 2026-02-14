'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getBatchStatus, type BatchStatus } from '@/lib/api';

const POLL_INTERVAL = 3000;

export function useBatch(batchId: string | null) {
  const [data, setData] = useState<BatchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!batchId) return;

    const poll = async () => {
      try {
        const status = await getBatchStatus(batchId);
        setData(status);
        if (status.completed + status.failed >= status.totalJobs) {
          stopPolling();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
        stopPolling();
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return stopPolling;
  }, [batchId, stopPolling]);

  return { data, error, stopPolling };
}
