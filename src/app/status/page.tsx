'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, CheckCircle, AlertTriangle, XCircle, Clock, Zap, Server, Database } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const services = [
  {
    name: 'API Gateway',
    status: 'operational',
    uptime: '99.98%',
    responseTime: '45ms',
    description: 'Main API endpoints and authentication'
  },
  {
    name: 'Video Processing',
    status: 'operational', 
    uptime: '99.95%',
    responseTime: '2.3s',
    description: 'AI-powered video analysis and clipping'
  },
  {
    name: 'File Storage',
    status: 'operational',
    uptime: '99.99%',
    responseTime: '12ms',
    description: 'Video upload and download services'
  },
  {
    name: 'Web Dashboard',
    status: 'operational',
    uptime: '99.97%',
    responseTime: '180ms',
    description: 'User interface and web application'
  },
  {
    name: 'Database',
    status: 'operational',
    uptime: '99.99%',
    responseTime: '8ms',
    description: 'User data and processing metadata'
  },
  {
    name: 'CDN',
    status: 'degraded',
    uptime: '98.2%',
    responseTime: '320ms',
    description: 'Content delivery network for global access'
  }
]

const incidents = [
  {
    id: 1,
    title: 'CDN Performance Degradation',
    status: 'investigating',
    severity: 'minor',
    startTime: '2025-01-27T14:30:00Z',
    description: 'Some users may experience slower download speeds for processed videos.',
    updates: [
      {
        time: '2025-01-27T15:15:00Z',
        message: 'We have identified the issue with our CDN provider and are working on a resolution.'
      },
      {
        time: '2025-01-27T14:45:00Z', 
        message: 'Investigating reports of slower download speeds in EU regions.'
      }
    ]
  },
  {
    id: 2,
    title: 'Scheduled Maintenance - Database Optimization',
    status: 'completed',
    severity: 'maintenance',
    startTime: '2025-01-26T02:00:00Z',
    endTime: '2025-01-26T04:30:00Z',
    description: 'Routine database maintenance to improve performance.',
    updates: [
      {
        time: '2025-01-26T04:30:00Z',
        message: 'Maintenance completed successfully. All services are fully operational.'
      },
      {
        time: '2025-01-26T02:00:00Z',
        message: 'Maintenance window started. Some API requests may experience brief delays.'
      }
    ]
  }
]

const metrics = [
  { label: 'Overall Uptime', value: '99.96%', change: '+0.02%', icon: Activity },
  { label: 'Avg Response Time', value: '127ms', change: '-15ms', icon: Zap },
  { label: 'Videos Processed', value: '1.2M', change: '+12%', icon: Server },
  { label: 'Active Users', value: '10.5K', change: '+8%', icon: Database }
]

export default function StatusPage() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-400'
      case 'degraded':
        return 'text-yellow-400'
      case 'outage':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getIncidentIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'major':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />
      case 'minor':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'maintenance':
        return <Clock className="w-5 h-5 text-blue-400" />
      default:
        return <CheckCircle className="w-5 h-5 text-green-400" />
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            System{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Status
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-4">
            Real-time status of Video Clipper Pro services and infrastructure
          </p>
          <p className="text-white/60">
            Last updated: {currentTime.toLocaleString()}
          </p>
        </motion.div>

        {/* Overall Status */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">All Systems Operational</h2>
                  <p className="text-white/70">All services are running normally</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">99.96%</div>
                <div className="text-white/60 text-sm">30-day uptime</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {metrics.map((metric, index) => (
            <Card key={metric.label}>
              <div className="text-center">
                <metric.icon className="w-8 h-8 text-primary-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                <div className="text-white/60 text-sm mb-2">{metric.label}</div>
                <div className={`text-xs ${metric.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {metric.change} vs last week
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Services Status */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Service Status</h2>
          <div className="space-y-4">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(service.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                        <p className="text-white/60 text-sm">{service.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="text-white font-medium">{service.uptime}</div>
                        <div className="text-white/60 text-xs">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-medium">{service.responseTime}</div>
                        <div className="text-white/60 text-xs">Response</div>
                      </div>
                      <div className={`capitalize font-medium ${getStatusColor(service.status)}`}>
                        {service.status}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Incidents */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Recent Incidents</h2>
          <div className="space-y-6">
            {incidents.map((incident, index) => (
              <Card key={incident.id}>
                <div className="flex items-start space-x-4">
                  {getIncidentIcon(incident.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{incident.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        incident.status === 'investigating' ? 'bg-yellow-500/20 text-yellow-400' :
                        incident.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-white/80 mb-4">{incident.description}</p>
                    <div className="space-y-3">
                      {incident.updates.map((update, i) => (
                        <div key={i} className="border-l-2 border-primary-500/30 pl-4">
                          <div className="text-white/60 text-xs mb-1">
                            {new Date(update.time).toLocaleString()}
                          </div>
                          <p className="text-white/80 text-sm">{update.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Status History Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <Card>
            <h2 className="text-2xl font-bold text-white mb-6">30-Day Uptime History</h2>
            <div className="grid grid-cols-30 gap-1 mb-4">
              {Array.from({ length: 30 }, (_, i) => (
                <div
                  key={i}
                  className={`h-8 rounded ${
                    Math.random() > 0.05 ? 'bg-green-500' : 
                    Math.random() > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  title={`Day ${30 - i}: ${Math.random() > 0.05 ? '100%' : '98.2%'} uptime`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>30 days ago</span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span>Operational</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded" />
                  <span>Degraded</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span>Outage</span>
                </div>
              </div>
              <span>Today</span>
            </div>
          </Card>
        </motion.div>

        {/* Subscribe to Updates */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <div className="text-center">
              <Activity className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Stay Updated</h2>
              <p className="text-white/80 mb-6">
                Subscribe to status updates and get notified about incidents and maintenance windows.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50"
                />
                <button className="bg-gradient-primary text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                  Subscribe
                </button>
              </div>
              <p className="text-white/60 text-sm mt-4">
                You can also follow us on <span className="text-primary-400">@videoclipperpro</span> for real-time updates.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}