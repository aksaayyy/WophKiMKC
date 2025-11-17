'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { VideoJob } from '../../../types/database'
import { useAuth } from './useAuth'
import { supabase } from '../../lib/supabase'

export interface VideoJobFilters {
  status?: string
  platform_target?: string
  quality_preset?: string
  enhancement_level?: string
  date_from?: string
  date_to?: string
}

export interface UseVideoJobsReturn {
  jobs: VideoJob[]
  teamJobs: VideoJob[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createJob: (jobData: any) => Promise<VideoJob | null>
  updateJobStatus: (jobId: string, status: string) => Promise<void>
}

export function useVideoJobs(filters: VideoJobFilters = {}, limit = 50, offset = 0): UseVideoJobsReturn {
  const { user, session } = useAuth()
  const [jobs, setJobs] = useState<VideoJob[]>([])
  const [teamJobs, setTeamJobs] = useState<VideoJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)])

  const fetchJobs = useCallback(async () => {
    if (!user || !session) {
      setJobs([])
      setTeamJobs([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...Object.fromEntries(
          Object.entries(memoizedFilters).filter(([_, value]) => value !== undefined && value !== '')
        )
      })

      const response = await fetch(`/api/v1/user/jobs?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setJobs(data.user_jobs || [])
        setTeamJobs(data.team_jobs || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch jobs')
      }
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }, [user, session, memoizedFilters, limit, offset])

  const createJob = useCallback(async (jobData: any): Promise<VideoJob | null> => {
    if (!user || !session) {
      setError('User not authenticated')
      return null
    }

    try {
      const response = await fetch('/api/v1/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(jobData)
      })

      if (response.ok) {
        const data = await response.json()
        // Refetch jobs to get the updated list
        await fetchJobs()
        return data
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create job')
        return null
      }
    } catch (err) {
      console.error('Error creating job:', err)
      setError('Network error occurred')
      return null
    }
  }, [user, session, fetchJobs])

  const updateJobStatus = useCallback(async (jobId: string, status: string) => {
    if (!user || !session) {
      setError('User not authenticated')
      return
    }

    try {
      const response = await fetch(`/api/v1/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // Update local state
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId ? { ...job, status: status as any } : job
          )
        )
        setTeamJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId ? { ...job, status: status as any } : job
          )
        )
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update job status')
      }
    } catch (err) {
      console.error('Error updating job status:', err)
      setError('Network error occurred')
    }
  }, [user, session])

  // Set up real-time subscriptions for job status updates
  useEffect(() => {
    if (!user || !session) return

    const subscription = supabase
      .channel('video_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_jobs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Job status update:', payload)
          
          if (payload.eventType === 'UPDATE') {
            const updatedJob = payload.new as VideoJob
            
            setJobs(prevJobs => 
              prevJobs.map(job => 
                job.id === updatedJob.id ? updatedJob : job
              )
            )
          } else if (payload.eventType === 'INSERT') {
            const newJob = payload.new as VideoJob
            setJobs(prevJobs => [newJob, ...prevJobs])
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, session])

  useEffect(() => {
    fetchJobs()
  }, [user?.id, session?.access_token, limit, offset])

  // Separate effect for filter changes to avoid infinite loops
  useEffect(() => {
    if (user && session) {
      fetchJobs()
    }
  }, [memoizedFilters])

  return {
    jobs,
    teamJobs,
    loading,
    error,
    refetch: fetchJobs,
    createJob,
    updateJobStatus
  }
}