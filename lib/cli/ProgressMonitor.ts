import { VideoJobManager } from '../database'

interface ProgressUpdate {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  timestamp: number
}

class ProgressMonitor {
  private progressCallbacks: Map<string, ((update: ProgressUpdate) => void)[]> = new Map()
  
  /**
   * Register a callback for progress updates
   */
  onProgress(jobId: string, callback: (update: ProgressUpdate) => void): void {
    if (!this.progressCallbacks.has(jobId)) {
      this.progressCallbacks.set(jobId, [])
    }
    this.progressCallbacks.get(jobId)!.push(callback)
  }
  
  /**
   * Remove a callback for progress updates
   */
  offProgress(jobId: string, callback: (update: ProgressUpdate) => void): void {
    const callbacks = this.progressCallbacks.get(jobId)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }
  
  /**
   * Update progress for a job
   */
  async updateProgress(jobId: string, progress: number, message: string = ''): Promise<void> {
    try {
      // Update database
      // Progress tracking would be implemented here
      // For now, we'll just log the progress
      console.log(`[ProgressMonitor] Job ${jobId} progress: ${progress}%`)
      
      // Notify callbacks
      const update: ProgressUpdate = {
        jobId,
        status: 'processing',
        progress,
        message,
        timestamp: Date.now()
      }
      
      const callbacks = this.progressCallbacks.get(jobId)
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(update)
          } catch (error) {
            console.error(`[ProgressMonitor] Error in progress callback for job ${jobId}:`, error)
          }
        })
      }
    } catch (error) {
      console.error(`[ProgressMonitor] Error updating progress for job ${jobId}:`, error)
    }
  }
  
  /**
   * Update job status
   */
  async updateStatus(jobId: string, status: ProgressUpdate['status'], message: string = ''): Promise<void> {
    try {
      // Update database
      await VideoJobManager.updateJobStatus(jobId, status)
      
      // Notify callbacks
      const update: ProgressUpdate = {
        jobId,
        status,
        progress: status === 'completed' ? 100 : status === 'failed' ? 0 : 50,
        message,
        timestamp: Date.now()
      }
      
      const callbacks = this.progressCallbacks.get(jobId)
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(update)
          } catch (error) {
            console.error(`[ProgressMonitor] Error in status callback for job ${jobId}:`, error)
          }
        })
      }
    } catch (error) {
      console.error(`[ProgressMonitor] Error updating status for job ${jobId}:`, error)
    }
  }
}

// Export singleton instance
export const progressMonitor = new ProgressMonitor()