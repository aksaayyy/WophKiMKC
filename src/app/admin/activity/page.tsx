'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Search, 
  Filter,
  RefreshCw,
  AlertTriangle,
  User,
  Clock,
  Globe,
  Monitor,
  Eye,
  Trash2,
  Settings,
  UserPlus,
  UserMinus
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface AdminActivity {
  id: string
  admin_user_id: string
  action: string
  target_type: string | null
  target_id: string | null
  details: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  users: { email: string }
}

export default function AdminActivityPage() {
  const { user, session } = useAuth()
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.email === 'admin@videoclipper.com' || user?.email?.includes('admin')

  useEffect(() => {
    if (isAdmin && session) {
      fetchActivities()
    }
  }, [isAdmin, session, search, actionFilter])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '50',
        offset: '0'
      })
      
      if (actionFilter) {
        params.append('action', actionFilter)
      }

      const response = await fetch(`/api/v1/admin/activity?${params}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      } else {
        setError('Failed to fetch activity log')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'user_delete':
      case 'user_ban':
        return <UserMinus className="w-4 h-4 text-red-400" />
      case 'user_create':
      case 'user_invite':
        return <UserPlus className="w-4 h-4 text-green-400" />
      case 'job_delete':
      case 'job_cancel':
        return <Trash2 className="w-4 h-4 text-red-400" />
      case 'settings_update':
        return <Settings className="w-4 h-4 text-blue-400" />
      case 'login':
      case 'logout':
        return <User className="w-4 h-4 text-gray-400" />
      case 'view':
      case 'access':
        return <Eye className="w-4 h-4 text-gray-400" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'user_delete':
      case 'job_delete':
      case 'user_ban':
        return 'bg-red-500/20 text-red-400'
      case 'user_create':
      case 'job_complete':
        return 'bg-green-500/20 text-green-400'
      case 'settings_update':
      case 'job_update':
        return 'bg-blue-500/20 text-blue-400'
      case 'login':
      case 'logout':
        return 'bg-gray-500/20 text-gray-400'
      default:
        return 'bg-purple-500/20 text-purple-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatUserAgent = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown'
    
    // Simple user agent parsing
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Other'
  }

  const filteredActivities = activities.filter(activity => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      activity.action.toLowerCase().includes(searchLower) ||
      activity.users.email.toLowerCase().includes(searchLower) ||
      (activity.target_type && activity.target_type.toLowerCase().includes(searchLower))
    )
  })

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60">You don't have permission to access activity logs.</p>
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
                <span className="text-white">Activity Log</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Activity Log</h1>
              <p className="text-white/60">Monitor admin actions and system events</p>
            </div>
            <Button onClick={fetchActivities} variant="outline">
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
                    placeholder="Search by action, user, or target..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Actions</option>
                    <option value="user_delete">User Delete</option>
                    <option value="user_create">User Create</option>
                    <option value="job_delete">Job Delete</option>
                    <option value="job_update">Job Update</option>
                    <option value="settings_update">Settings Update</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
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

        {/* Activity List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                  <p className="text-white/60 text-sm">{filteredActivities.length} activities found</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
                  <p className="text-white/60">Loading activities...</p>
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No activities found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getActionIcon(activity.action)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                                {activity.action.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-white font-medium">
                                {activity.users.email}
                              </span>
                              {activity.target_type && (
                                <span className="text-white/60 text-sm">
                                  → {activity.target_type}
                                  {activity.target_id && ` (${activity.target_id.slice(0, 8)}...)`}
                                </span>
                              )}
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-4 text-sm text-white/60">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(activity.created_at)}</span>
                              </div>
                              
                              {activity.ip_address && (
                                <div className="flex items-center space-x-1">
                                  <Globe className="w-4 h-4" />
                                  <span>{activity.ip_address}</span>
                                </div>
                              )}
                              
                              {activity.user_agent && (
                                <div className="flex items-center space-x-1">
                                  <Monitor className="w-4 h-4" />
                                  <span>{formatUserAgent(activity.user_agent)}</span>
                                </div>
                              )}
                            </div>
                            
                            {activity.details && Object.keys(activity.details).length > 0 && (
                              <div className="mt-2 p-2 bg-white/5 rounded text-xs">
                                <details>
                                  <summary className="cursor-pointer text-white/80 hover:text-white">
                                    View Details
                                  </summary>
                                  <pre className="mt-2 text-white/60 whitespace-pre-wrap">
                                    {JSON.stringify(activity.details, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}
                          </div>
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