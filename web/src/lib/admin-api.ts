import { API_BASE } from './constants';

export interface AdminStats {
  total: number;
  completed: number;
  failed: number;
  active: number;
  waiting: number;
  jobsToday: number;
  avgProcessingTime: number;
  diskUsage: number;
}

export interface AdminJob {
  id: string;
  videoTitle: string;
  status: string;
  progress: number;
  clipCount: number;
  platform: string;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
  duration: number;
}

export interface AdminJobsResponse {
  jobs: AdminJob[];
  total: number;
  page: number;
  limit: number;
}

export interface SystemInfo {
  cpu: { cores: number; usage: number };
  memory: { total: number; used: number; free: number };
  disk: { downloads: number; output: number; total: number };
  uptime: number;
  redis: string;
  dependencies: Record<string, string>;
}

export interface LogsResponse {
  lines: string[];
  total: number;
}

export interface CleanupResponse {
  removed: number;
  downloadsRemoved: number;
  outputRemoved: number;
}

function getHeaders(): HeadersInit {
  const key = typeof window !== 'undefined' ? sessionStorage.getItem('admin-key') : null;
  return {
    'Content-Type': 'application/json',
    ...(key ? { 'x-admin-key': key } : {}),
  };
}

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/admin${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });
  if (res.status === 401) {
    sessionStorage.removeItem('admin-key');
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const fetchStats = () => adminFetch<AdminStats>('/stats');

export const fetchJobs = (status = 'all', page = 1, limit = 20) =>
  adminFetch<AdminJobsResponse>(`/jobs?status=${status}&page=${page}&limit=${limit}`);

export const retryJob = (id: string) =>
  adminFetch<{ message: string }>(`/jobs/${id}/retry`, { method: 'POST' });

export const deleteJob = (id: string) =>
  adminFetch<{ message: string }>(`/jobs/${id}`, { method: 'DELETE' });

export const triggerCleanup = () =>
  adminFetch<CleanupResponse>('/cleanup', { method: 'POST' });

export const fetchSystem = () => adminFetch<SystemInfo>('/system');

export const fetchLogs = (lines = 100) =>
  adminFetch<LogsResponse>(`/logs?lines=${lines}`);

export async function verifyAdminKey(key: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { 'x-admin-key': key },
  });
  return res.ok;
}
