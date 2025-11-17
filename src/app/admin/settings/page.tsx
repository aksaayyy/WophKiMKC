'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  Clock,
  Users,
  Video,
  Shield,
  Globe
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface SystemSettings {
  maxFileSize: number
  maxClipsPerJob: number
  fileRetentionHours: number
  allowedFileTypes: string[]
  maintenanceMode: boolean
  maxConcurrentJobs: number
  defaultQuality: string
  enableYouTubeDownload: boolean
  enableTeamFeatures: boolean
  maxUsersPerTeam: number
}

export default function AdminSettingsPage() {
  const { user, session } = useAuth()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isAdmin = user?.email === 'admin@videoclipper.com' || user?.email?.includes('admin')

  useEffect(() => {
    if (isAdmin && session) {
      fetchSettings()
    }
  }, [isAdmin, session])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/admin/settings', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        setError('Failed to fetch settings')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save settings')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb} MB`
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60">You don't have permission to access system settings.</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading settings...</p>
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
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Link href="/admin" className="text-white/60 hover:text-white transition-colors">
                  Admin
                </Link>
                <span className="text-white/40">/</span>
                <span className="text-white">Settings</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
              <p className="text-white/60">Configure global system parameters</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={fetchSettings} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Status Messages */}
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

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">{success}</span>
            </div>
          </motion.div>
        )}

        {/* Settings Form */}
        {settings && (
          <div className="space-y-6">
            {/* File & Processing Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">File & Processing</h3>
                      <p className="text-white/60 text-sm">Configure file upload and processing limits</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Max File Size (MB)
                      </label>
                      <Input
                        type="number"
                        value={Math.round(settings.maxFileSize / (1024 * 1024))}
                        onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
                        min="1"
                        max="2048"
                      />
                      <p className="text-xs text-white/40 mt-1">
                        Current: {formatFileSize(settings.maxFileSize)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Max Clips Per Job
                      </label>
                      <Input
                        type="number"
                        value={settings.maxClipsPerJob}
                        onChange={(e) => updateSetting('maxClipsPerJob', parseInt(e.target.value))}
                        min="1"
                        max="50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        File Retention (Hours)
                      </label>
                      <Input
                        type="number"
                        value={settings.fileRetentionHours}
                        onChange={(e) => updateSetting('fileRetentionHours', parseInt(e.target.value))}
                        min="1"
                        max="168"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Max Concurrent Jobs
                      </label>
                      <Input
                        type="number"
                        value={settings.maxConcurrentJobs}
                        onChange={(e) => updateSetting('maxConcurrentJobs', parseInt(e.target.value))}
                        min="1"
                        max="20"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Quality & Platform Settings */}
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
                      <h3 className="text-lg font-semibold text-white">Quality & Platform</h3>
                      <p className="text-white/60 text-sm">Configure video quality and platform settings</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Default Quality Preset
                      </label>
                      <select
                        value={settings.defaultQuality}
                        onChange={(e) => updateSetting('defaultQuality', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="low">Low (Fast)</option>
                        <option value="medium">Medium (Balanced)</option>
                        <option value="high">High (Quality)</option>
                        <option value="ultra">Ultra (Best)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Allowed File Types
                      </label>
                      <Input
                        type="text"
                        value={settings.allowedFileTypes.join(', ')}
                        onChange={(e) => updateSetting('allowedFileTypes', e.target.value.split(',').map(s => s.trim()))}
                        placeholder="mp4, mov, avi, mkv, webm"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Feature Toggles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Feature Toggles</h3>
                      <p className="text-white/60 text-sm">Enable or disable system features</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Maintenance Mode</h4>
                        <p className="text-white/60 text-sm">Disable new job submissions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.maintenanceMode}
                          onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">YouTube Download</h4>
                        <p className="text-white/60 text-sm">Allow users to download from YouTube</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.enableYouTubeDownload}
                          onChange={(e) => updateSetting('enableYouTubeDownload', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Team Features</h4>
                        <p className="text-white/60 text-sm">Enable team collaboration features</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.enableTeamFeatures}
                          onChange={(e) => updateSetting('enableTeamFeatures', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Team Settings */}
            {settings.enableTeamFeatures && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Team Settings</h3>
                        <p className="text-white/60 text-sm">Configure team collaboration limits</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Max Users Per Team
                      </label>
                      <Input
                        type="number"
                        value={settings.maxUsersPerTeam}
                        onChange={(e) => updateSetting('maxUsersPerTeam', parseInt(e.target.value))}
                        min="2"
                        max="100"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}