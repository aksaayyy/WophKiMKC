export const API_BASE = '/api';

export type Platform = 'youtube' | 'tiktok' | 'instagram';
export type DetectionMode = 'smart' | 'quick' | 'even';
export type SubtitleStyle = 'standard' | 'highlight';

export const PLATFORMS: readonly { id: Platform; label: string }[] = [
  { id: 'youtube', label: 'YouTube Shorts' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram Reels' },
];

export const DETECTION_MODES: readonly { id: DetectionMode; label: string; description: string }[] = [
  { id: 'smart', label: 'Smart (AI)', description: 'Transcript + AI scoring (best for podcasts)' },
  { id: 'quick', label: 'Quick', description: 'Audio energy analysis (fast)' },
  { id: 'even', label: 'Even Split', description: 'Evenly spaced clips (fastest)' },
];

export interface ProcessingOptionsType {
  clipCount: number;
  clipDuration: number;
  platform: Platform;
  detectionMode: DetectionMode;
  enableSubtitles: boolean;
  subtitleStyle: SubtitleStyle;
  enableFaceTracking: boolean;
}

export const DEFAULT_OPTIONS: ProcessingOptionsType = {
  clipCount: 3,
  clipDuration: 40,
  platform: 'youtube',
  detectionMode: 'smart',
  enableSubtitles: false,
  subtitleStyle: 'highlight',
  enableFaceTracking: false,
};
