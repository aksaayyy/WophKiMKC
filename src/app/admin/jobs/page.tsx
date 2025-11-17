'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Video, 
  Search, 
  Trash2, 
  Eye, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
  Download,
  User
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface VideoJob {
  id: string
  user_id: string
  status: string
  original_filename: string
  original_filesize: number
  clip_count: number
  quality_preset: string
  platform_target: string
  processing_time: number | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  files_expired: boolean
  files_expired_at: string | null
  clips_generated: number
  users: { email: string }
}

export default function AdminJobsPage() {
  const { user, session } = useAuth()
  const [jobs, setJobs] = useState<VideoJob[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  const isAdmin = user?.email === 'admin@videoclipper.com' || user?.email?.includes('admin')

  useEffect(() => {
    if (isAdmin && session) {
      fetchJobs()
    }
  }, [isAdmin, session, search, statusFilter])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null) // Clear previous errors
      
      if (!session?.access_token) {
        setError('No authentication token available')
        return
      }

      const params = new URLSearchParams({
        limit: '50',
        offset: '0'
      })
      
      if (search) {
        params.append('search', search)
      }
      
      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/v1/admin/jobs?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
        console.log('Jobs fetched successfully:', data.jobs?.length || 0)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(`Failed to fetch jobs: ${errorData.error || response.statusText}`)
        console.error('Jobs fetch failed:', response.status, errorData)
      }
    } catch (err) {
      console.error('Jobs fetch error:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }

    try {
      setDeleteLoading(jobId)
      const response = await fetch('/api/v1/admin/jobs', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId })
      })

      if (response.ok) {
        setJobs(jobs.filter(j => j.id !== jobId))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete job')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setDeleteLoading(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'processing': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400'
      case 'processing': return 'bg-yellow-500/20 text-yellow-400'
      case 'failed': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60">You don't have permission to access job management.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Link href="/admin" className="text-white/60 hover:text-white transition-colors">
                  Admin
                </Link>
                <span className="text-white/40">/</span>
                <span className="text-white">Jobs</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Job Management</h1>
              <p className="text-white/60">Monitor and manage video processing jobs</p>
            </div>
            <Button onClick={fetchJobs} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by filename or user email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Jobs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">All Jobs</h3>
                  <p className="text-white/60 text-sm">{jobs.length} jobs found</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
                  <p className="text-white/60">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No jobs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getStatusIcon(job.status)}
                            <h4 className="text-white font-medium">{job.original_filename}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                              {job.status}
                            </span>
                            {job.files_expired && (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                                Files Expired
                              </span>
                            )}
                          </div>
                          
                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-white/60">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{job.users.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="w-4 h-4" />
                              <span>{formatFileSize(job.original_filesize)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Video className="w-4 h-4" />
                              <span>{job.clips_generated || job.clip_count} clips</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(job.processing_time)}</span>
                            </div>
                          </div>
                          
                          <div className="mt-2 text-xs text-white/40">
                            Created: {formatDate(job.created_at)} | 
                            {job.completed_at ? ` Completed: ${formatDate(job.completed_at)}` : 
                             job.started_at ? ` Started: ${formatDate(job.started_at)}` : ' Pending'}
                          </div>
                          
                          {job.error_message && (
                            <div className="mt-2 p-2 bg-red-500/20 rounded text-red-400 text-xs">
                              Error: {job.error_message}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/dashboard/job/${job.id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteJob(job.id)}
                            disabled={deleteLoading === job.id}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            {deleteLoading === job.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}