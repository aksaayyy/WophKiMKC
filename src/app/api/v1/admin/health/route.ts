/**
 * Admin System Health API
 * Provides detailed system health checks and monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../../lib/supabase'
import { promises as fs } from 'fs'
import path from 'path'

function isAdminUser(email?: string): boolean {
  if (!email) return false
  return email.includes('admin') || email === 'admin@videoclipper.com'
}

interface HealthCheck {
  name: string
  status: 'healthy' | 'warning' | 'critical'
  message: string
  details?: any
  responseTime?: number
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user || !isAdminUser(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const healthChecks: HealthCheck[] = []

    // Database Health Check
    const dbStart = Date.now()
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1)
      
      const dbResponseTime = Date.now() - dbStart
      
      if (error) {
        healthChecks.push({
          name: 'Database',
          status: 'critical',
          message: 'Database connection failed',
          details: error.message,
          responseTime: dbResponseTime
        })
      } else {
        healthChecks.push({
          name: 'Database',
          status: dbResponseTime > 1000 ? 'warning' : 'healthy',
          message: dbResponseTime > 1000 ? 'Slow database response' : 'Database connection healthy',
          responseTime: dbResponseTime
        })
      }
    } catch (err) {
      healthChecks.push({
        name: 'Database',
        status: 'critical',
        message: 'Database connection error',
        details: err instanceof Error ? err.message : 'Unknown error'
      })
    }

    // File System Health Check
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads')
      const processedDir = path.join(process.cwd(), 'processed')
      
      // Check if directories exist and are writable
      const uploadsExists = await fs.access(uploadsDir).then(() => true).catch(() => false)
      const processedExists = await fs.access(processedDir).then(() => true).catch(() => false)
      
      if (!uploadsExists || !processedExists) {
        healthChecks.push({
          name: 'File System',
          status: 'warning',
          message: 'Some directories are missing',
          details: {
            uploadsExists,
            processedExists
          }
        })
      } else {
        // Check disk space (simplified check)
        const stats = await fs.stat(uploadsDir)
        healthChecks.push({
          name: 'File System',
          status: 'healthy',
          message: 'File system accessible',
          details: {
            uploadsExists,
            processedExists
          }
        })
      }
    } catch (err) {
      healthChecks.push({
        name: 'File System',
        status: 'critical',
        message: 'File system check failed',
        details: err instanceof Error ? err.message : 'Unknown error'
      })
    }

    // Job Processing Health Check
    try {
      const { data: processingJobs, error } = await supabaseAdmin
        .from('video_jobs')
        .select('id, created_at, started_at')
        .eq('status', 'processing')
        .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Jobs older than 30 minutes

      if (error) {
        healthChecks.push({
          name: 'Job Processing',
          status: 'warning',
          message: 'Unable to check job processing status',
          details: error.message
        })
      } else {
        const stuckJobs = processingJobs?.length || 0
        healthChecks.push({
          name: 'Job Processing',
          status: stuckJobs > 5 ? 'critical' : stuckJobs > 0 ? 'warning' : 'healthy',
          message: stuckJobs > 0 ? `${stuckJobs} jobs may be stuck` : 'Job processing healthy',
          details: {
            stuckJobs,
            threshold: '30 minutes'
          }
        })
      }
    } catch (err) {
      healthChecks.push({
        name: 'Job Processing',
        status: 'critical',
        message: 'Job processing check failed',
        details: err instanceof Error ? err.message : 'Unknown error'
      })
    }

    // Memory Usage Check (simplified)
    try {
      const memoryUsage = process.memoryUsage()
      const memoryUsageMB = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      }

      const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

      healthChecks.push({
        name: 'Memory Usage',
        status: heapUsagePercent > 90 ? 'critical' : heapUsagePercent > 70 ? 'warning' : 'healthy',
        message: `Heap usage: ${heapUsagePercent.toFixed(1)}%`,
        details: memoryUsageMB
      })
    } catch (err) {
      healthChecks.push({
        name: 'Memory Usage',
        status: 'warning',
        message: 'Unable to check memory usage',
        details: err instanceof Error ? err.message : 'Unknown error'
      })
    }

    // API Response Time Check
    const apiStart = Date.now()
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/v1/status/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Admin-Health-Check'
        }
      })
      
      const apiResponseTime = Date.now() - apiStart
      
      healthChecks.push({
        name: 'API Response',
        status: apiResponseTime > 2000 ? 'warning' : 'healthy',
        message: apiResponseTime > 2000 ? 'Slow API response' : 'API responding normally',
        responseTime: apiResponseTime
      })
    } catch (err) {
      healthChecks.push({
        name: 'API Response',
        status: 'critical',
        message: 'API health check failed',
        details: err instanceof Error ? err.message : 'Unknown error'
      })
    }

    // Overall system health
    const criticalCount = healthChecks.filter(check => check.status === 'critical').length
    const warningCount = healthChecks.filter(check => check.status === 'warning').length
    
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (criticalCount > 0) {
      overallStatus = 'critical'
    } else if (warningCount > 0) {
      overallStatus = 'warning'
    }

    const healthReport = {
      overall: {
        status: overallStatus,
        message: `${criticalCount} critical, ${warningCount} warnings`,
        timestamp: new Date().toISOString()
      },
      checks: healthChecks,
      summary: {
        total: healthChecks.length,
        healthy: healthChecks.filter(check => check.status === 'healthy').length,
        warning: warningCount,
        critical: criticalCount
      }
    }

    return NextResponse.json(healthReport)

  } catch (error) {
    console.error('Admin health check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}