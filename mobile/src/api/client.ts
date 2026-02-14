import axios from 'axios';
// @ts-ignore
import { API_BASE_URL } from '@env';
import type { 
  CreateJobRequest, 
  CreateJobResponse, 
  JobStatusResponse,
  Clip 
} from '../types';

const API_BASE = API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const jobsApi = {
  createJob: async (data: CreateJobRequest): Promise<CreateJobResponse> => {
    const response = await api.post('/jobs', data);
    return response.data;
  },

  getJobStatus: async (jobId: string): Promise<JobStatusResponse> => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  getClipUrl: (jobId: string, filename: string): string => {
    return `${API_BASE}/clips/${jobId}/${filename}`;
  },

  getHealth: async (): Promise<{ status: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export const uploadApi = {
  uploadClip: async (jobId: string): Promise<{ uploaded: number }> => {
    const response = await api.post(`/upload/${jobId}`);
    return response.data;
  },

  getUploadConfig: async (): Promise<{ configured: boolean; accountCount: number }> => {
    const response = await api.get('/upload/accounts');
    return response.data;
  },
};

export default api;
