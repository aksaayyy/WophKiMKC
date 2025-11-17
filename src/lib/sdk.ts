// Video Clipper Pro SDK
export class VideoClipperProSDK {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl = '/api/v1') {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    return response.json()
  }

  // Process a video
  async processVideo(params: {
    video_url: string
    platform?: 'tiktok' | 'instagram' | 'youtube' | 'twitter'
    quality?: 'standard' | 'high' | 'premium'
    clip_count?: number
  }) {
    return this.request('/process', {
      method: 'POST',
      body: JSON.stringify(params)
    })
  }

  // Check job status
  async getJobStatus(jobId: string) {
    return this.request(`/status/${jobId}`)
  }

  // Get download links
  async getDownloadLinks(jobId: string, clipId?: string) {
    const params = clipId ? `?clip_id=${clipId}` : ''
    return this.request(`/download/${jobId}${params}`)
  }

  // Poll job until completion
  async waitForCompletion(jobId: string, onProgress?: (status: any) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getJobStatus(jobId)
          
          if (onProgress) {
            onProgress(status)
          }

          if (status.status === 'completed') {
            resolve(status)
          } else if (status.status === 'failed') {
            reject(new Error(status.message || 'Processing failed'))
          } else {
            // Continue polling
            setTimeout(poll, 5000) // Poll every 5 seconds
          }
        } catch (error) {
          reject(error)
        }
      }
      
      poll()
    })
  }

  // Convenience method: Process and wait for completion
  async processAndWait(params: {
    video_url: string
    platform?: 'tiktok' | 'instagram' | 'youtube' | 'twitter'
    quality?: 'standard' | 'high' | 'premium'
    clip_count?: number
  }, onProgress?: (status: any) => void) {
    const job = await this.processVideo(params)
    return this.waitForCompletion(job.job_id, onProgress)
  }
}

// Usage example:
// const sdk = new VideoClipperProSDK('your-api-key')
// const result = await sdk.processAndWait({
//   video_url: 'https://youtube.com/watch?v=...',
//   platform: 'tiktok',
//   quality: 'high'
// }, (status) => console.log('Progress:', status.progress))