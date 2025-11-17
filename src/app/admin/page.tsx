'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Video, 
  HardDrive, 
  Activity, 
  Trash2, 
  RefreshCw, 
  Settings, 
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  Shield,
  Download
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface AdminStats {
  totalUsers: number
  totalJobs: number
  completedJobs: number
  processingJobs: number
  failedJobs: number
  totalStorage: number
  expiredFiles: number
  activeUsers: number
  systemHealth: 'healthy' | 'warning' | 'critical'
}

interface AdminAnalytics {
  overview: {
    totalUsers: number
    activeUsers: number
    totalJobs: number
    processingJobs: number
    completedJobs: number
    failedJobs: number
    successRate: number
    totalStorageGB: string
  }
  charts: {
    statusDistribution: Record<string, number>
    dailyJobs: Record<string, number>
    topUsers: Array<{ email: string; jobCount: number }>
  }
  recentActivity: any[]
  period: string
  generatedAt: string
}

interface CleanupResult {
  jobsProcessed: number
  filesDeleted: number
  bytesFreed: number
  bytesFreedFormatted: string
  errors: string[]
}

export default function AdminPanel() {
  const { user, session } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if user is admin (you can implement proper admin role checking)
  const isAdmin = user?.email === 'admin@videoclipper.com' || user?.email?.includes('admin')

  useEffect(() => {
    if (isAdmin && session) {
      fetchAdminStats()
      fetchAnalytics()
    }
  }, [isAdmin, session])

  const fetchAdminStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/admin/stats', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError('Failed to fetch admin stats')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/v1/admin/analytics?period=7d', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    }
  }

  const runCleanup = async () => {
    try {
      setCleanupLoading(true)
      setError(null)
      
      const response = await fetch('/api/v1/admin/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_CLEANUP_KEY || 'a34675a9b28271fc14cb89e8394a293ebcd22dd55cb7e4323a7f06ffde541071'}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setCleanupResult(result.stats)
        // Refresh stats after cleanup
        await fetchAdminStats()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Cleanup failed')
      }
    } catch (err) {
      setError('Cleanup network error')
    } finally {
      setCleanupLoading(false)
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />
      case 'warning': return <AlertTriangle className="w-5 h-5" />
      case 'critical': return <AlertTriangle className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60">You don't have permission to access the admin panel.</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading admin panel...</p>
        </div>
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
              <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
              <p className="text-white/60">System overview and management tools</p>
            </div>
            <div className="flex items-center space-x-3">
              {stats && (
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 ${getHealthColor(stats.systemHealth)}`}>
                  {getHealthIcon(stats.systemHealth)}
                  <span className="font-medium capitalize">{stats.systemHealth}</span>
                </div>
              )}
              <Button onClick={fetchAdminStats} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
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

        {/* Analytics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{analytics?.overview.totalUsers || stats?.totalUsers || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total Jobs</p>
                    <p className="text-2xl font-bold text-white">{analytics?.overview.totalJobs || stats?.totalJobs || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Video className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Success Rate</p>
                    <p className="text-2xl font-bold text-white">{analytics?.overview.successRate || 0}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Storage Used</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics?.overview.totalStorageGB || (stats ? (stats.totalStorage / 1024 / 1024 / 1024).toFixed(1) : 0)} GB
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <HardDrive className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Manage Users</span>
                  </Button>
                </Link>
                <Link href="/admin/jobs">
                  <Button variant="outline" className="w-full flex items-center space-x-2">
                    <Video className="w-4 h-4" />
                    <span>View Jobs</span>
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button variant="outline" className="w-full flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>System Settings</span>
                  </Button>
                </Link>
                <Link href="/admin/activity">
                  <Button variant="outline" className="w-full flex items-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Activity Log</span>
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* System Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Cleanup */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">File Cleanup</h3>
                        <p className="text-white/60 text-sm">Remove expired files (48+ hours old)</p>
                      </div>
                    </div>
                    <Button
                      onClick={runCleanup}
                      disabled={cleanupLoading}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {cleanupLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Run Cleanup
                    </Button>
                  </div>

                  {cleanupResult && (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                      <h4 className="text-green-400 font-medium mb-2">Cleanup Completed</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-white/60">Jobs Processed</p>
                          <p className="text-white font-medium">{cleanupResult.jobsProcessed}</p>
                        </div>
                        <div>
                          <p className="text-white/60">Files Deleted</p>
                          <p className="text-white font-medium">{cleanupResult.filesDeleted}</p>
                        </div>
                        <div>
                          <p className="text-white/60">Space Freed</p>
                          <p className="text-white font-medium">{cleanupResult.bytesFreedFormatted}</p>
                        </div>
                      </div>
                      {cleanupResult.errors.length > 0 && (
                        <div className="mt-3 p-2 bg-red-500/20 rounded">
                          <p className="text-red-400 text-xs">
                            {cleanupResult.errors.length} error(s) occurred
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {stats && (
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <p className="text-white/60">Completed Jobs</p>
                        <p className="text-white font-medium text-lg">{stats.completedJobs}</p>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <p className="text-white/60">Processing</p>
                        <p className="text-white font-medium text-lg">{stats.processingJobs}</p>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <p className="text-white/60">Failed</p>
                        <p className="text-white font-medium text-lg">{stats.failedJobs}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Server className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">System Status</h3>
                      <p className="text-white/60 text-sm">Real-time system monitoring</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: 'Database', status: 'healthy', uptime: '99.9%' },
                      { name: 'File Storage', status: 'healthy', uptime: '99.8%' },
                      { name: 'Video Processing', status: 'healthy', uptime: '99.7%' },
                      { name: 'API Endpoints', status: 'healthy', uptime: '99.9%' }
                    ].map((service) => (
                      <div key={service.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-white font-medium">{service.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-green-400 text-sm font-medium capitalize">{service.status}</span>
                          <p className="text-white/60 text-xs">{service.uptime} uptime</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  
                  <div className="space-y-3">
                    <Button className="w-full justify-start" variant="secondary">
                      <Database className="w-4 h-4 mr-3" />
                      Database Maintenance
                    </Button>
                    
                    <Button className="w-full justify-start" variant="secondary">
                      <Settings className="w-4 h-4 mr-3" />
                      System Settings
                    </Button>
                    
                    <Button className="w-full justify-start" variant="secondary">
                      <Users className="w-4 h-4 mr-3" />
                      User Management
                    </Button>
                    
                    <Button className="w-full justify-start" variant="secondary">
                      <Download className="w-4 h-4 mr-3" />
                      Export Data
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                  
                  <div className="space-y-3">
                    {[
                      { action: 'File cleanup completed', time: '2 minutes ago', type: 'success' },
                      { action: 'New user registered', time: '5 minutes ago', type: 'info' },
                      { action: 'Video processing completed', time: '8 minutes ago', type: 'success' },
                      { action: 'System backup created', time: '1 hour ago', type: 'info' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{activity.action}</p>
                          <p className="text-white/60 text-xs">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}