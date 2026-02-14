import { API_BASE, type ProcessingOptionsType } from './constants';

export interface CreateJobResponse {
  jobId: string;
  videoTitle: string;
  videoDuration: number;
  thumbnail: string;
  clipCount: number;
  clipDuration: number;
  platform: string;
  status: string;
}

export interface ClipInfo {
  filename: string;
  downloadUrl: string;
  startTime: number;
  duration: number;
  hookScore: number;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
  youtubeUrl: string | null;
}

export interface JobStatus {
  jobId: string;
  status: string;
  progress: number;
  videoTitle: string;
  videoDuration: number;
  videoId: string;
  clipCount: number;
  platform: string;
  clips: ClipInfo[];
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export async function createJob(url: string, options: ProcessingOptionsType): Promise<CreateJobResponse> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, ...options }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to create job');
  }

  return res.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!res.ok) throw new Error('Failed to fetch job status');
  return res.json();
}

export function getClipDownloadUrl(jobId: string, filename: string): string {
  return `${API_BASE}/clips/${jobId}/${filename}`;
}

export async function triggerUpload(jobId: string): Promise<{ uploaded: number }> {
  const res = await fetch(`${API_BASE}/upload/${jobId}`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Upload failed');
  }
  return res.json();
}

export async function getUploadConfig(): Promise<{ configured: boolean; accountCount: number }> {
  const res = await fetch(`${API_BASE}/upload/accounts`);
  return res.json();
}

// Batch types and functions

export interface BatchResponse {
  batchId: string;
  jobs: Array<{ jobId: string; videoTitle: string; videoDuration: number; thumbnail: string }>;
  errors: Array<{ index: number; url: string; error: string }>;
  totalQueued: number;
  totalFailed: number;
}

export interface BatchStatus {
  batchId: string;
  createdAt: string;
  totalJobs: number;
  completed: number;
  failed: number;
  inProgress: number;
  overallProgress: number;
  jobs: JobStatus[];
}

export async function createBatch(urls: string[], options: ProcessingOptionsType): Promise<BatchResponse> {
  const res = await fetch(`${API_BASE}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls, ...options }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to create batch');
  }
  return res.json();
}

export async function getBatchStatus(batchId: string): Promise<BatchStatus> {
  const res = await fetch(`${API_BASE}/batch/${batchId}`);
  if (!res.ok) throw new Error('Failed to fetch batch status');
  return res.json();
}
