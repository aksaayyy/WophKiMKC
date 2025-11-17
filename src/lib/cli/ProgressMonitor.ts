/**
 * Progress Monitor
 * Real-time progress monitoring system for CLI integration
 */

import { EventEmitter } from 'events'
import { ProgressUpdate } from './CLIProcessManager'

export interface ProgressSubscription {
  jobId: string
  userId: string
  callback: (progress: ProgressUpdate) => void
  createdAt: Date
}

export interface ProgressMetrics {
  jobId: string
  totalStages: number
  currentStage: number
  stageProgress: number
  overallProgress: number
  estimatedTimeRemaining?: number
  processingSpeed?: number
  startTime: Date
  lastUpdate: Date
}

export interface StageDefinition {
  name: string
  displayName: string
  weight: number // Relative weight for overall progress calculation
  estimatedDuration: number // Estimated duration in seconds
}

export class ProgressMonitor extends EventEmitter {
  private subscriptions = new Map<string, ProgressSubscription[]>()
  private progressMetrics = new Map<string, ProgressMetrics>()
  private stageHistory = new Map<string, ProgressUpdate[]>()
  
  // Define processing stages with weights for overall progress calculation
  private readonly PROCESSING_STAGES: StageDefinition[] = [
    { name: 'initializing', displayName: 'Initializing', weight: 5, estimatedDuration: 10 },
    { name: 'analyzing', displayName: 'Analyzing Video', weight: 15, estimatedDuration: 30 },
    { name: 'processing', displayName: 'Processing Clips', weight: 60, estimatedDuration: 180 },
    { name: 'enhancing', displayName: 'Enhancing Quality', weight: 15, estimatedDuration: 45 },
    { name: 'finalizing', displayName: 'Finalizing Output', weight: 5, estimatedDuration: 15 }
  ]

  constructor() {
    super()
    
    // Clean up old subscriptions periodically
    setInterval(() => {
      this.cleanupOldSubscriptions()
    }, 5 * 60 * 1000) // Every 5 minutes
  }

  /**
   * Subscribe to progress updates for a specific job
   */
  subscribe(jobId: string, userId: string, callback: (progress: ProgressUpdate) => void): () => void {
    const subscription: ProgressSubscription = {
      jobId,
      userId,
      callback,
      createdAt: new Date()
    }
    
    if (!this.subscriptions.has(jobId)) {
      this.subscriptions.set(jobId, [])
    }
    
    this.subscriptions.get(jobId)!.push(subscription)
    
    console.log(`[Progress Monitor] User ${userId} subscribed to job ${jobId}`)
    
    // Send current progress if available
    const currentProgress = this.getJobProgress(jobId)
    if (currentProgress) {
      callback(currentProgress)
    }
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(jobId, userId)
    }
  }

  /**
   * Unsubscribe from progress updates
   */
  unsubscribe(jobId: string, userId: string): void {
    const jobSubscriptions = this.subscriptions.get(jobId)
    if (jobSubscriptions) {
      const filteredSubscriptions = jobSubscriptions.filter(sub => sub.userId !== userId)
      
      if (filteredSubscriptions.length === 0) {
        this.subscriptions.delete(jobId)
      } else {
        this.subscriptions.set(jobId, filteredSubscriptions)
      }
      
      console.log(`[Progress Monitor] User ${userId} unsubscribed from job ${jobId}`)
    }
  }

  /**
   * Update progress for a job
   */
  updateProgress(progress: ProgressUpdate): void {
    const { jobId } = progress
    
    // Store progress history
    if (!this.stageHistory.has(jobId)) {
      this.stageHistory.set(jobId, [])
    }
    this.stageHistory.get(jobId)!.push(progress)
    
    // Update metrics
    this.updateProgressMetrics(progress)
    
    // Enhance progress with additional information
    const enhancedProgress = this.enhanceProgressUpdate(progress)
    
    // Notify subscribers
    const jobSubscriptions = this.subscriptions.get(jobId)
    if (jobSubscriptions) {
      jobSubscriptions.forEach(subscription => {
        try {
          subscription.callback(enhancedProgress)
        } catch (error) {
          console.error(`[Progress Monitor] Error in progress callback for job ${jobId}:`, error)
        }
      })
    }
    
    // Emit global progress event
    this.emit('progress', enhancedProgress)
    
    // Clean up completed jobs
    if (progress.stage === 'completed' || progress.stage === 'failed') {
      setTimeout(() => {
        this.cleanupJob(jobId)
      }, 5 * 60 * 1000) // Clean up after 5 minutes
    }
  }

  /**
   * Get current progress for a job
   */
  getJobProgress(jobId: string): ProgressUpdate | null {
    const history = this.stageHistory.get(jobId)
    if (history && history.length > 0) {
      return history[history.length - 1]
    }
    return null
  }

  /**
   * Get progress metrics for a job
   */
  getJobMetrics(jobId: string): ProgressMetrics | null {
    return this.progressMetrics.get(jobId) || null
  }

  /**
   * Get progress history for a job
   */
  getProgressHistory(jobId: string): ProgressUpdate[] {
    return this.stageHistory.get(jobId) || []
  }

  /**
   * Get all active jobs being monitored
   */
  getActiveJobs(): string[] {
    return Array.from(this.subscriptions.keys())
  }

  /**
   * Get subscriber count for a job
   */
  getSubscriberCount(jobId: string): number {
    return this.subscriptions.get(jobId)?.length || 0
  }

  /**
   * Update progress metrics for a job
   */
  private updateProgressMetrics(progress: ProgressUpdate): void {
    const { jobId, stage, progress: stageProgress } = progress
    
    let metrics = this.progressMetrics.get(jobId)
    
    if (!metrics) {
      metrics = {
        jobId,
        totalStages: this.PROCESSING_STAGES.length,
        currentStage: 0,
        stageProgress: 0,
        overallProgress: 0,
        startTime: new Date(),
        lastUpdate: new Date()
      }
    }
    
    // Update current stage
    const stageIndex = this.PROCESSING_STAGES.findIndex(s => s.name === stage)
    if (stageIndex >= 0) {
      metrics.currentStage = stageIndex
    }
    
    metrics.stageProgress = stageProgress
    metrics.lastUpdate = new Date()
    
    // Calculate overall progress based on stage weights
    metrics.overallProgress = this.calculateOverallProgress(metrics.currentStage, stageProgress)
    
    // Calculate estimated time remaining
    metrics.estimatedTimeRemaining = this.calculateEstimatedTimeRemaining(metrics)
    
    // Calculate processing speed
    metrics.processingSpeed = this.calculateProcessingSpeed(metrics)
    
    this.progressMetrics.set(jobId, metrics)
  }

  /**
   * Calculate overall progress based on stage weights
   */
  private calculateOverallProgress(currentStageIndex: number, stageProgress: number): number {
    let totalWeight = 0
    let completedWeight = 0
    
    // Add weight of completed stages
    for (let i = 0; i < currentStageIndex; i++) {
      completedWeight += this.PROCESSING_STAGES[i].weight
    }
    
    // Add partial weight of current stage
    if (currentStageIndex < this.PROCESSING_STAGES.length) {
      const currentStageWeight = this.PROCESSING_STAGES[currentStageIndex].weight
      completedWeight += (currentStageWeight * stageProgress) / 100
    }
    
    // Calculate total weight
    totalWeight = this.PROCESSING_STAGES.reduce((sum, stage) => sum + stage.weight, 0)
    
    return Math.min(100, Math.round((completedWeight / totalWeight) * 100))
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTimeRemaining(metrics: ProgressMetrics): number {
    const elapsedTime = Date.now() - metrics.startTime.getTime()
    const elapsedSeconds = elapsedTime / 1000
    
    if (metrics.overallProgress <= 0) {
      // Use stage-based estimation
      return this.PROCESSING_STAGES.reduce((sum, stage) => sum + stage.estimatedDuration, 0)
    }
    
    // Calculate based on current progress
    const totalEstimatedTime = (elapsedSeconds / metrics.overallProgress) * 100
    const remainingTime = totalEstimatedTime - elapsedSeconds
    
    return Math.max(0, Math.round(remainingTime))
  }

  /**
   * Calculate processing speed (progress per second)
   */
  private calculateProcessingSpeed(metrics: ProgressMetrics): number {
    const elapsedTime = Date.now() - metrics.startTime.getTime()
    const elapsedSeconds = elapsedTime / 1000
    
    if (elapsedSeconds <= 0) return 0
    
    return metrics.overallProgress / elapsedSeconds
  }

  /**
   * Enhance progress update with additional information
   */
  private enhanceProgressUpdate(progress: ProgressUpdate): ProgressUpdate {
    const metrics = this.progressMetrics.get(progress.jobId)
    
    if (!metrics) return progress
    
    // Find stage definition
    const stageDefinition = this.PROCESSING_STAGES.find(s => s.name === progress.stage)
    
    return {
      ...progress,
      details: {
        ...progress.details,
        // overallProgress: metrics.overallProgress, // Removed as not in ProgressUpdate details type
        // currentStage: metrics.currentStage + 1, // Removed as not in ProgressUpdate details type
        // totalStages: metrics.totalStages, // Removed as not in ProgressUpdate details type
        // stageDisplayName: stageDefinition?.displayName || progress.stage, // Removed as not in ProgressUpdate details type
        estimatedRemaining: metrics.estimatedTimeRemaining,
        processingTime: Math.round((Date.now() - metrics.startTime.getTime()) / 1000)
      }
    }
  }

  /**
   * Clean up old subscriptions
   */
  private cleanupOldSubscriptions(): void {
    const maxAge = 30 * 60 * 1000 // 30 minutes
    const now = Date.now()
    
    for (const [jobId, subscriptions] of this.subscriptions.entries()) {
      const activeSubscriptions = subscriptions.filter(
        sub => now - sub.createdAt.getTime() < maxAge
      )
      
      if (activeSubscriptions.length === 0) {
        this.subscriptions.delete(jobId)
        console.log(`[Progress Monitor] Cleaned up old subscriptions for job ${jobId}`)
      } else if (activeSubscriptions.length !== subscriptions.length) {
        this.subscriptions.set(jobId, activeSubscriptions)
      }
    }
  }

  /**
   * Clean up completed job data
   */
  private cleanupJob(jobId: string): void {
    this.subscriptions.delete(jobId)
    this.progressMetrics.delete(jobId)
    
    // Keep history for a while longer for debugging
    setTimeout(() => {
      this.stageHistory.delete(jobId)
    }, 60 * 60 * 1000) // 1 hour
    
    console.log(`[Progress Monitor] Cleaned up job ${jobId}`)
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    activeJobs: number
    totalSubscriptions: number
    averageSubscribersPerJob: number
    oldestJob?: Date
  } {
    const activeJobs = this.subscriptions.size
    const totalSubscriptions = Array.from(this.subscriptions.values())
      .reduce((sum, subs) => sum + subs.length, 0)
    
    let oldestJob: Date | undefined
    for (const metrics of this.progressMetrics.values()) {
      if (!oldestJob || metrics.startTime < oldestJob) {
        oldestJob = metrics.startTime
      }
    }
    
    return {
      activeJobs,
      totalSubscriptions,
      averageSubscribersPerJob: activeJobs > 0 ? totalSubscriptions / activeJobs : 0,
      oldestJob
    }
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    console.log('[Progress Monitor] Cleaning up all resources')
    this.subscriptions.clear()
    this.progressMetrics.clear()
    this.stageHistory.clear()
  }
}

// Singleton instance
export const progressMonitor = new ProgressMonitor()

export default ProgressMonitor