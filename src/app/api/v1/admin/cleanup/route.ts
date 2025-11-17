/**
 * File Cleanup API Endpoint
 * Handles automatic cleanup of expired video files
 */

import { NextRequest, NextResponse } from 'next/server'
import { runFileCleanup, formatBytes } from '../../../../../lib/fileCleanup'

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization (you can implement proper admin auth here)
    const authHeader = request.headers.get('authorization')
    const adminKey = process.env.ADMIN_CLEANUP_KEY || 'admin-cleanup-key'
    
    if (!authHeader || !authHeader.includes(adminKey)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting file cleanup process...')
    const result = await runFileCleanup()

    const response = {
      success: true,
      message: 'File cleanup completed',
      stats: {
        jobsProcessed: result.jobsProcessed,
        filesDeleted: result.filesDeleted,
        bytesFreed: result.bytesFreed,
        bytesFreedFormatted: formatBytes(result.bytesFreed),
        errors: result.errors
      }
    }

    console.log('Cleanup result:', response.stats)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Cleanup API error:', error)
    return NextResponse.json(
      { 
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Allow GET for status check
export async function GET() {
  return NextResponse.json({
    message: 'File cleanup endpoint is active',
    retentionHours: 48,
    endpoint: 'POST /api/v1/admin/cleanup'
  })
}