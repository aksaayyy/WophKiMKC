/**
 * File Cleanup Service
 * Handles automatic deletion of video files after 48 hours while preserving metadata
 */

import { readdir, stat, unlink, rmdir } from 'fs/promises'
import { join } from 'path'
import { supabase } from '../../lib/supabase'

const RETENTION_HOURS = 48
const RETENTION_MS = RETENTION_HOURS * 60 * 60 * 1000

export interface CleanupResult {
  jobsProcessed: number
  filesDeleted: number
  bytesFreed: number
  errors: string[]
}

/**
 * Check if a job's files have expired (older than 48 hours)
 */
export function isJobExpired(completedAt: string): boolean {
  const completedTime = new Date(completedAt).getTime()
  const now = Date.now()
  return (now - completedTime) > RETENTION_MS
}

/**
 * Get time remaining until files expire
 */
export function getTimeUntilExpiry(completedAt: string): {
  expired: boolean
  hoursRemaining: number
  minutesRemaining: number
} {
  const completedTime = new Date(completedAt).getTime()
  const expiryTime = completedTime + RETENTION_MS
  const now = Date.now()
  const timeRemaining = expiryTime - now

  if (timeRemaining <= 0) {
    return { expired: true, hoursRemaining: 0, minutesRemaining: 0 }
  }

  const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000))
  const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))

  return { expired: false, hoursRemaining, minutesRemaining }
}

/**
 * Delete video files for a specific job while preserving metadata
 */
async function cleanupJobFiles(userId: string, jobId: string): Promise<{
  filesDeleted: number
  bytesFreed: number
  errors: string[]
}> {
  const result = {
    filesDeleted: 0,
    bytesFreed: 0,
    errors: [] as string[]
  }

  try {
    const jobDir = join(process.cwd(), 'public', 'processed', userId, jobId)
    
    // Check if directory exists
    try {
      await stat(jobDir)
    } catch {
      // Directory doesn't exist, nothing to clean
      return result
    }

    // Get all files in the job directory
    const items = await readdir(jobDir, { withFileTypes: true })
    
    for (const item of items) {
      const itemPath = join(jobDir, item.name)
      
      if (item.isFile()) {
        // Only delete video files, keep metadata
        if (item.name.endsWith('.mp4') || item.name.endsWith('.mov') || 
            item.name.endsWith('.avi') || item.name.endsWith('.mkv') ||
            item.name.endsWith('.jpg') || item.name.endsWith('.png')) {
          
          try {
            const stats = await stat(itemPath)
            await unlink(itemPath)
            result.filesDeleted++
            result.bytesFreed += stats.size
          } catch (error) {
            result.errors.push(`Failed to delete ${itemPath}: ${error}`)
          }
        }
      } else if (item.isDirectory()) {
        // Recursively clean subdirectories (like thumbnails)
        if (item.name === 'thumbnails' || item.name === 'clips') {
          try {
            const subItems = await readdir(itemPath)
            for (const subItem of subItems) {
              const subItemPath = join(itemPath, subItem)
              try {
                const stats = await stat(subItemPath)
                await unlink(subItemPath)
                result.filesDeleted++
                result.bytesFreed += stats.size
              } catch (error) {
                result.errors.push(`Failed to delete ${subItemPath}: ${error}`)
              }
            }
            // Remove empty directory
            await rmdir(itemPath)
          } catch (error) {
            result.errors.push(`Failed to clean directory ${itemPath}: ${error}`)
          }
        }
      }
    }

    // Update job status in database to mark files as expired
    const { error: updateError } = await supabase
      .from('video_jobs')
      .update({ 
        files_expired: true,
        files_expired_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (updateError) {
      result.errors.push(`Failed to update job status: ${updateError.message}`)
    }

  } catch (error) {
    result.errors.push(`Failed to process job ${jobId}: ${error}`)
  }

  return result
}

/**
 * Run cleanup for all expired jobs
 */
export async function runFileCleanup(): Promise<CleanupResult> {
  const result: CleanupResult = {
    jobsProcessed: 0,
    filesDeleted: 0,
    bytesFreed: 0,
    errors: []
  }

  try {
    // Get all completed jobs that haven't been cleaned up yet
    const cutoffTime = new Date(Date.now() - RETENTION_MS).toISOString()
    
    const { data: expiredJobs, error } = await supabase
      .from('video_jobs')
      .select('id, user_id, completed_at, files_expired')
      .eq('status', 'completed')
      .eq('files_expired', false)
      .lt('completed_at', cutoffTime)

    if (error) {
      result.errors.push(`Database query failed: ${error.message}`)
      return result
    }

    if (!expiredJobs || expiredJobs.length === 0) {
      return result
    }

    console.log(`Found ${expiredJobs.length} expired jobs to clean up`)

    // Process each expired job
    for (const job of expiredJobs) {
      const jobResult = await cleanupJobFiles(job.user_id, job.id)
      
      result.jobsProcessed++
      result.filesDeleted += jobResult.filesDeleted
      result.bytesFreed += jobResult.bytesFreed
      result.errors.push(...jobResult.errors)
    }

    console.log(`Cleanup completed: ${result.jobsProcessed} jobs, ${result.filesDeleted} files, ${(result.bytesFreed / 1024 / 1024).toFixed(2)} MB freed`)

  } catch (error) {
    result.errors.push(`Cleanup process failed: ${error}`)
  }

  return result
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}