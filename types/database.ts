// Database Types for Video Clipper Pro
// These types define the structure of our Supabase database

export type SubscriptionTier = 'free' | 'pro' | 'business';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type QualityPreset = 'social' | 'pro' | 'cinematic';
export type EnhancementLevel = 'none' | 'basic' | 'pro' | 'cinematic';
export type PlatformTarget = 'tiktok' | 'instagram' | 'youtube_shorts';
export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  subscription_tier: SubscriptionTier;
  team_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  member_limit: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  invited_by?: string;
  joined_at: string;
}

export interface VideoJob {
  id: string;
  user_id: string;
  team_id?: string;
  original_filename: string;
  original_filesize: number;
  status: JobStatus;
  clip_count: number;
  clips_generated?: number;
  quality_preset: QualityPreset;
  enhancement_level: EnhancementLevel;
  platform_target?: PlatformTarget;
  output_files?: string[];
  processing_time?: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  files_expired?: boolean;
  files_expired_at?: string;
  expiry?: {
    expired: boolean;
    expiresAt?: string;
    hoursRemaining?: number;
    minutesRemaining?: number;
    message: string;
  };
}

export interface Template {
  id: string;
  name: string;
  user_id: string;
  team_id?: string;
  settings: {
    clip_count: number;
    quality_preset: QualityPreset;
    enhancement_level: EnhancementLevel;
    platform_target?: PlatformTarget;
    custom_options: Record<string, any>;
  };
  is_shared: boolean;
  used_count: number;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  team_id?: string;
  clips_processed: number;
  processing_time: number;
  storage_used: number;
  period_month: number;
  period_year: number;
  created_at: string;
  updated_at: string;
}

// Tier limits configuration
export const TIER_LIMITS = {
  free: {
    clips_per_month: 10,
    processing_time_minutes: 60,
    storage_gb: 1,
    team_members: 1
  },
  pro: {
    clips_per_month: 100,
    processing_time_minutes: 600,
    storage_gb: 10,
    team_members: 5
  },
  business: {
    clips_per_month: 1000,
    processing_time_minutes: 6000,
    storage_gb: 100,
    team_members: 25
  }
} as const;