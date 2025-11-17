'use client'

import { motion } from 'framer-motion'
import { BarChart3, Users, Video, TrendingUp, Plus, Download, Clock, CheckCircle, AlertCircle, Loader, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
// import { UserOnboarding } from '@/components/features/UserOnboarding'
// import { WelcomeBanner } from '@/components/features/WelcomeBanner'
import { useAuth } from '@/hooks/useAuth'
import { useVideoJobs } from '@/hooks/useVideoJobs'
import { useTemplates } from '@/hooks/useTemplates'
import { useState, useEffect } from 'react'

interface DashboardStats {
  total_jobs: number
  completed_jobs: number
  processing_jobs: number
  failed_jobs: number
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-400" />
    case 'processing':
      return <Loader className="w-4 h-4 text-blue-400 animate-spin" />
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-400" />
    case 'queued':
      return <Clock className="w-4 h-4 text-yellow-400" />
    default:
      return <Clock className="w-4 h-4 text-gray-400" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500/20 text-green-400'
    case 'processing':
      return 'bg-blue-500/20 text-blue-400'
    case 'failed':
      return 'bg-red-500/20 text-red-400'
    case 'queued':
      return 'bg-yellow-500/20 text-yellow-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours} hours ago`
  if (diffInHours < 48) return '1 day ago'
  return `${Math.floor(diffInHours / 24)} days ago`
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters] = useState({})
  const { jobs, teamJobs, loading: jobsLoading, error, refetch } = useVideoJobs(filters)
  const { templates } = useTemplates()
  const [stats, setStats] = useState<DashboardStats>({
    total_jobs: 0,
    completed_jobs: 0,
    processing_jobs: 0,
    failed_jobs: 0
  })
  // const [showOnboarding, setShowOnboarding] = useState(false)
  // const [showWelcome, setShowWelcome] = useState(true)

  // Calculate stats from jobs
  useEffect(() => {
    const allJobs = [...jobs, ...teamJobs]
    setStats({
      total_jobs: allJobs.length,
      completed_jobs: allJobs.filter(j => j.status === 'completed').length,
      processing_jobs: allJobs.filter(j => j.status === 'processing').length,
      failed_jobs: allJobs.filter(j => j.status === 'failed').length
    })
  }, [jobs, teamJobs])

  // Onboarding functionality temporarily disabled
  // TODO: Re-enable after fixing component imports

  // Filter jobs based on search term
  const filteredJobs = [...jobs, ...teamJobs].filter(job =>
    job.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (authLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to view your dashboard</h1>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  const dashboardStats = [
    { 
      label: 'Total Jobs', 
      value: stats.total_jobs.toString(), 
      change: '+' + Math.round((stats.completed_jobs / Math.max(stats.total_jobs, 1)) * 100) + '%', 
      icon: Video, 
      color: 'from-primary-500 to-purple-500' 
    },
    { 
      label: 'Completed', 
      value: stats.completed_jobs.toString(), 
      change: stats.processing_jobs > 0 ? `${stats.processing_jobs} processing` : 'All done', 
      icon: CheckCircle, 
      color: 'from-green-500 to-emerald-500' 
    },
    { 
      label: 'Processing', 
      value: stats.processing_jobs.toString(), 
      change: stats.processing_jobs > 0 ? 'In progress' : 'None active', 
      icon: Loader, 
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      label: 'Templates', 
      value: templates.length.toString(), 
      change: templates.length > 0 ? 'Ready to use' : 'Create first', 
      icon: BarChart3, 
      color: 'from-purple-500 to-pink-500' 
    }
  ]

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {user.email?.split('@')[0] || 'User'}! 👋
            </h1>
            <p className="text-white/80">
              Here's what's happening with your video projects
            </p>
            <div className="mt-2 flex items-center space-x-4 text-sm text-white/60">
              <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full">
                {(user as any).subscription_tier?.toUpperCase() || 'FREE'}
              </span>
              {(user as any).team_id && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                  Team Member
                </span>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3 mt-4 md:mt-0">
            <Button onClick={() => window.location.href = '/process'}>
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
            <Button variant="secondary" onClick={refetch}>
              <TrendingUp className="w-5 h-5 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {dashboardStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-white ${stat.label === 'Processing' && stats.processing_jobs > 0 ? 'animate-spin' : ''}`} />
                  </div>
                  <span className="text-primary-400 text-sm font-medium">{stat.change}</span>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/60 text-sm">{stat.label}</div>
                </div>
                
                {/* Animated background */}
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-5 -z-10`} />
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                  <h2 className="text-xl font-semibold text-white">Video Jobs</h2>
                  
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white text-sm w-48"
                      />
                    </div>
                    <Button variant="ghost" size="sm" onClick={refetch}>
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {jobsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="w-6 h-6 text-primary-500 animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 mb-4">{error}</p>
                    <Button onClick={refetch} variant="secondary">
                      Try Again
                    </Button>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 mb-4">
                      {searchTerm ? 'No jobs match your search' : 'No video jobs yet'}
                    </p>
                    <Button onClick={() => window.location.href = '/process'}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Job
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredJobs.slice(0, 10).map((job, index) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                        className="group"
                      >
                        <Card className="p-4 hover:ring-2 hover:ring-primary-500/50 transition-all cursor-pointer">
                          <div 
                            className="flex items-center justify-between"
                            onClick={() => window.open(`/dashboard/job/${job.id}`, '_blank')}
                          >
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                {getStatusIcon(job.status)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium truncate text-sm">
                                  {job.original_filename.replace(/^youtube_[^_]+_\d+\./, '').replace(/\.(mp4|mov|avi)$/i, '')}
                                </h3>
                                <div className="flex items-center space-x-2 text-xs text-white/60 mt-1">
                                  <span>{job.clips_generated || job.clip_count} clips</span>
                                  <span>•</span>
                                  <span className="capitalize">{job.platform_target || 'General'}</span>
                                  <span>•</span>
                                  <span>{formatDate(job.created_at)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                {job.status}
                              </span>
                              
                              {/* File expiry status */}
                              {job.status === 'completed' && job.files_expired && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                  Files Expired
                                </span>
                              )}
                              
                              {/* Download button - only show if files are available */}
                              {job.status === 'completed' && job.output_files && job.output_files.length > 0 && !job.files_expired && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(`/dashboard/job/${job.id}`, '_blank')
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                              
                              {/* Time remaining indicator */}
                              {job.status === 'completed' && !job.files_expired && job.expiry && !job.expiry.expired && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                  {job.expiry.hoursRemaining}h left
                                </span>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions & Templates */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
                
                <div className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="secondary"
                    onClick={() => window.location.href = '/process'}
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Upload New Video
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="secondary"
                    onClick={() => window.location.href = '/dashboard/analytics'}
                  >
                    <BarChart3 className="w-5 h-5 mr-3" />
                    View Analytics
                  </Button>
                  
                  {(user as any).team_id && (
                    <Button 
                      className="w-full justify-start" 
                      variant="secondary"
                      onClick={() => window.location.href = '/dashboard/team'}
                    >
                      <Users className="w-5 h-5 mr-3" />
                      Manage Team
                    </Button>
                  )}
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="secondary"
                    onClick={() => window.location.href = '/dashboard/templates'}
                  >
                    <TrendingUp className="w-5 h-5 mr-3" />
                    Manage Templates
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Templates Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Templates</h2>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.location.href = '/dashboard/templates'}
                  >
                    View All
                  </Button>
                </div>
                
                {templates.length === 0 ? (
                  <div className="text-center py-6">
                    <BarChart3 className="w-8 h-8 text-white/40 mx-auto mb-2" />
                    <p className="text-white/60 text-sm mb-3">No templates yet</p>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => window.location.href = '/dashboard/templates'}
                    >
                      Create Template
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templates.slice(0, 3).map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 glass rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/templates/${template.id}`}
                      >
                        <div>
                          <h3 className="text-white font-medium text-sm">{template.name}</h3>
                          <p className="text-white/60 text-xs">
                            {template.settings.clip_count} clips • {template.settings.platform_target || 'General'}
                          </p>
                        </div>
                        <div className="text-white/40 text-xs">
                          Used {template.used_count}x
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}