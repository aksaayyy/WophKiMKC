import { create } from 'zustand';
import type { Job, ProcessingOptions, JobStatusResponse } from '../types';
import { jobsApi } from '../api/client';

interface JobState {
  jobs: Job[];
  currentJob: Job | null;
  isLoading: boolean;
  error: string | null;
  options: ProcessingOptions;
  
  // Actions
  setOptions: (options: Partial<ProcessingOptions>) => void;
  createJob: (url: string) => Promise<void>;
  pollJobStatus: (jobId: string) => void;
  stopPolling: () => void;
  clearError: () => void;
  resetCurrentJob: () => void;
}

let pollInterval: NodeJS.Timeout | null = null;

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  currentJob: null,
  isLoading: false,
  error: null,
  options: {
    clipCount: 3,
    clipDuration: 40,
    platform: 'youtube',
    detectionMode: 'smart',
    enableSubtitles: false,
    subtitleStyle: 'highlight',
    enableFaceTracking: false,
  },

  setOptions: (newOptions) => {
    set((state) => ({
      options: { ...state.options, ...newOptions },
    }));
  },

  createJob: async (url: string) => {
    set({ isLoading: true, error: null });
    try {
      const { options } = get();
      const response = await jobsApi.createJob({
        url,
        ...options,
      });

      const newJob: Job = {
        id: response.jobId,
        videoTitle: response.videoTitle,
        videoDuration: response.videoDuration,
        thumbnail: response.thumbnail,
        clipCount: response.clipCount,
        clipDuration: response.clipDuration,
        platform: response.platform,
        status: response.status,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        jobs: [newJob, ...state.jobs],
        currentJob: newJob,
        isLoading: false,
      }));

      // Start polling
      get().pollJobStatus(response.jobId);
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to create job',
        isLoading: false,
      });
    }
  },

  pollJobStatus: (jobId: string) => {
    // Clear existing poll
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    pollInterval = setInterval(async () => {
      try {
        const status = await jobsApi.getJobStatus(jobId);
        
        set((state) => {
          const updatedJob = state.currentJob?.id === jobId
            ? {
                ...state.currentJob,
                status: status.status,
                progress: status.progress,
                stage: status.stage,
                clips: status.clips || state.currentJob?.clips,
                error: status.error || undefined,
              }
            : state.currentJob;

          return { currentJob: updatedJob };
        });

        // Stop polling if job is complete or failed
        if (status.status === 'completed' || status.status === 'failed') {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    }, 2000);
  },

  stopPolling: () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  },

  clearError: () => set({ error: null }),
  
  resetCurrentJob: () => {
    get().stopPolling();
    set({ currentJob: null });
  },
}));
