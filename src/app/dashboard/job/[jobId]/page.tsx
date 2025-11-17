'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Play, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { VideoPreview } from '@/components/features/VideoPreview'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface JobDetailsProps {
  params: { jobId: string }
}

interface JobDetails {
  id: string
  status: string
  original_filename: string
  original_filesize: number
  clip_count: number
  quality_preset: string
  enhancement_level: string
  platform_target: string
  created_at: string
  started_at?: string
  completed_at?: string
  processing_time?: number
  progress: number
  clips_generated: number
  output_files?: Array<any>
  clips?: Array<{
    id: string
    url: string
    thumbnail?: string
    duration?: number
    size?: number
  }>
  error?: string
  files_expired?: boolean
  expiry?: {
    expires_at: string
    hours_remaining: number
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-400" />
    case 'processing':
      return <Loader className="w-5 h-5 text-blue-400 animate-spin" />
    case 'failed':
      return <AlertCircle className="w-5 h-5 text-red-400" />
    case 'queued':
      return <Clock className="w-5 h-5 text-yellow-400" />
    default:
      return <Clock className="w-5 h-5 text-gray-400" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'processing':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'failed':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'queued':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const formatFileSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export default function JobDetailsPage({ params }: JobDetailsProps) {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const [job, setJob] = useState<JobDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session || authLoading) return

    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`/api/v1/status/${params.jobId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch job details: ${response.status}`)
        }

        const data = await response.json()
        setJob(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job details')
      } finally {
        setLoading(false)
      }
    }

    fetchJobDetails()
  }, [params.jobId, session, authLoading])

  const handleDownload = async (filename: string) => {
    try {
      // Use the new public video API that doesn't require auth headers
      const videoUrl = `/api/v1/video/${params.jobId}/${filename}`
      
      // Create a temporary link to trigger download
      const downloadLink = document.createElement('a')
      downloadLink.href = videoUrl
      downloadLink.download = filename
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      
      console.log('Download initiated for:', filename)
      
    } catch (error) {
      console.error('Download error:', error)
      alert(`Failed to download ${filename}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }



  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Job</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Job Not Found</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{job.original_filename}</h1>
              <p className="text-white/60">Job ID: {job.id}</p>
            </div>
          </div>
          
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${getStatusColor(job.status)}`}>
            {getStatusIcon(job.status)}
            <span className="font-medium capitalize">{job.status}</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <h2 className="text-xl font-semibold text-white mb-6">Job Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-white/60 text-sm">File Size</label>
                    <p className="text-white font-medium">{formatFileSize(job.original_filesize)}</p>
                  </div>
                  
                  <div>
                    <label className="text-white/60 text-sm">Clips Requested</label>
                    <p className="text-white font-medium">{job.clip_count}</p>
                  </div>
                  
                  <div>
                    <label className="text-white/60 text-sm">Clips Generated</label>
                    <p className="text-white font-medium">{job.clips_generated || 0}</p>
                  </div>
                  
                  <div>
                    <label className="text-white/60 text-sm">Quality</label>
                    <p className="text-white font-medium capitalize">{job.quality_preset}</p>
                  </div>
                  
                  <div>
                    <label className="text-white/60 text-sm">Platform</label>
                    <p className="text-white font-medium capitalize">{job.platform_target || 'General'}</p>
                  </div>
                  
                  <div>
                    <label className="text-white/60 text-sm">Enhancement</label>
                    <p className="text-white font-medium capitalize">{job.enhancement_level}</p>
                  </div>
                  
                  <div>
                    <label className="text-white/60 text-sm">Progress</label>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-white font-medium">{job.progress || 0}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-white/60 text-sm">Created</label>
                    <p className="text-white font-medium">{formatDate(job.created_at)}</p>
                  </div>
                  
                  {job.completed_at && (
                    <div>
                      <label className="text-white/60 text-sm">Completed</label>
                      <p className="text-white font-medium">{formatDate(job.completed_at)}</p>
                    </div>
                  )}
                  
                  {job.processing_time && (
                    <div>
                      <label className="text-white/60 text-sm">Processing Time</label>
                      <p className="text-white font-medium">{job.processing_time}s</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Downloads Section */}
          <div className="lg:col-span-2 space-y-6">
            {job.status === 'completed' && job.output_files && job.output_files.length > 0 ? (
              <>
                {/* Success Banner with Glass Effect */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl"
                >
                  {/* Glass background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-xl border border-green-500/20" />
                  
                  {/* Animated background elements */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-xl animate-pulse delay-1000" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative p-6">
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm border border-green-500/30 flex items-center justify-center"
                      >
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </motion.div>
                      
                      <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl font-bold text-green-400 mb-2"
                      >
                        🎉 Processing Complete!
                      </motion.h3>
                      
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/80"
                      >
                        Your clips are ready for download. We've generated <span className="font-semibold text-green-400">{job.clips_generated || job.clip_count}</span> amazing clips from your video.
                      </motion.p>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-3 flex items-center justify-center space-x-4 text-xs text-white/60"
                      >
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          <span>High Quality</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-300" />
                          <span>Platform Optimized</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-600" />
                          <span>Ready to Share</span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Video Preview Component */}
                <VideoPreview
                  jobId={job.id}
                  files={job.output_files
                    .map((file: any) => {
                      // Handle both string JSON and object formats
                      let fileObj = file
                      if (typeof file === 'string') {
                        try {
                          fileObj = JSON.parse(file)
                        } catch (e) {
                          // If parsing fails, create a basic object
                          fileObj = { filename: file }
                        }
                      }
                      return fileObj
                    })
                    .filter((file: any) => {
                      const filename = file.filename || ''
                      return filename.includes('.mp4') || filename.includes('.mov') || filename.includes('.avi')
                    })
                    .map((file: any, index: number) => {
                      // Extract just the filename from the full path
                      const fullPath = file.filename || `clip_${index + 1}.mp4`
                      const filename = fullPath.split('/').pop() || fullPath
                      
                      return {
                        filename: filename,
                        size: file.size || undefined,
                        duration: file.duration || undefined,
                        url: file.path || file.url
                      }
                    })}
                  onDownload={handleDownload}
                  filesExpired={job.files_expired || false}
                  expiryInfo={job.expiry ? {
                    expired: job.files_expired || false,
                    expiresAt: job.expiry.expires_at,
                    hoursRemaining: job.expiry.hours_remaining,
                    message: job.files_expired ? 'Files have expired' : `Files expire in ${job.expiry.hours_remaining} hours`
                  } : undefined}
                />
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white">Generated Clips</h2>
                  </div>
                  
                  {job.status === 'processing' ? (
                    <div className="text-center py-12">
                      <Loader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Processing in Progress</h3>
                      <p className="text-white/60 mb-4">
                        Your video is being processed. This usually takes a few minutes.
                      </p>
                      <div className="max-w-md mx-auto">
                        <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                          <span>Progress</span>
                          <span>{job.progress || 0}%</span>
                        </div>
                        <div className="bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : job.status === 'failed' ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Processing Failed</h3>
                      <p className="text-red-400 mb-4">{job.error || 'An unknown error occurred'}</p>
                      <Button variant="secondary">
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Job Queued</h3>
                      <p className="text-white/60">
                        Your job is in the queue and will start processing soon.
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}