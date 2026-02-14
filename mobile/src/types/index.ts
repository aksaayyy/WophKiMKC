export type Platform = 'youtube' | 'tiktok' | 'instagram';
export type DetectionMode = 'smart' | 'quick' | 'even';
export type SubtitleStyle = 'standard' | 'highlight';
export type JobStatus = 'queued' | 'downloading' | 'analyzing' | 'clipping' | 'completed' | 'failed';

export interface ProcessingOptions {
  clipCount: number;
  clipDuration: number;
  platform: Platform;
  detectionMode: DetectionMode;
  enableSubtitles: boolean;
  subtitleStyle: SubtitleStyle;
  enableFaceTracking: boolean;
}

export interface Job {
  id: string;
  videoTitle: string;
  videoDuration: number;
  thumbnail: string;
  clipCount: number;
  clipDuration: number;
  platform: Platform;
  status: JobStatus;
  progress?: number;
  stage?: string;
  clips?: Clip[];
  error?: string;
  createdAt?: string;
}

export interface Clip {
  filename: string;
  url: string;
  startTime: number;
  score: number;
}

export interface CreateJobRequest {
  url: string;
  clipCount: number;
  clipDuration: number;
  platform: Platform;
  detectionMode: DetectionMode;
  enableSubtitles: boolean;
  subtitleStyle: SubtitleStyle;
  enableFaceTracking: boolean;
}

export interface CreateJobResponse {
  jobId: string;
  videoTitle: string;
  videoDuration: number;
  thumbnail: string;
  clipCount: number;
  clipDuration: number;
  platform: Platform;
  status: JobStatus;
}

export interface JobStatusResponse {
  id: string;
  status: JobStatus;
  progress: number;
  stage: string;
  clips: Clip[];
  error: string | null;
}

export const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: 'youtube', label: 'YouTube Shorts', icon: 'play-circle' },
  { id: 'tiktok', label: 'TikTok', icon: 'music-note' },
  { id: 'instagram', label: 'Instagram Reels', icon: 'camera' },
];

export const DETECTION_MODES: { id: DetectionMode; label: string; description: string }[] = [
  { id: 'smart', label: 'Smart (AI)', description: 'Best for podcasts' },
  { id: 'quick', label: 'Quick', description: 'Fast audio analysis' },
  { id: 'even', label: 'Even', description: 'Evenly spaced clips' },
];

export const DEFAULT_OPTIONS: ProcessingOptions = {
  clipCount: 3,
  clipDuration: 40,
  platform: 'youtube',
  detectionMode: 'smart',
  enableSubtitles: false,
  subtitleStyle: 'highlight',
  enableFaceTracking: false,
};
