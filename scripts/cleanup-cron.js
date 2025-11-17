#!/usr/bin/env node

/**
 * Automated File Cleanup Cron Job
 * 
 * This script should be run periodically (e.g., every 6 hours) to clean up expired files.
 * 
 * Usage:
 * node scripts/cleanup-cron.js
 * 
 * Or add to crontab:
 * 0 */6 * * * cd /path/to/video-clipper-pro && node scripts/cleanup-cron.js
 */

const fetch = require('node-fetch')

const CLEANUP_URL = process.env.CLEANUP_URL || 'http://localhost:3002/api/v1/admin/cleanup'
const ADMIN_KEY = process.env.ADMIN_CLEANUP_KEY || 'admin-cleanup-key'

async function runCleanup() {
  try {
    console.log(`[${new Date().toISOString()}] Starting automated file cleanup...`)
    
    const response = await fetch(CLEANUP_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Cleanup API returned ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    console.log(`[${new Date().toISOString()}] Cleanup completed:`)
    console.log(`  - Jobs processed: ${result.stats.jobsProcessed}`)
    console.log(`  - Files deleted: ${result.stats.filesDeleted}`)
    console.log(`  - Space freed: ${result.stats.bytesFreedFormatted}`)
    
    if (result.stats.errors.length > 0) {
      console.log(`  - Errors: ${result.stats.errors.length}`)
      result.stats.errors.forEach(error => {
        console.log(`    * ${error}`)
      })
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cleanup failed:`, error.message)
    process.exit(1)
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  runCleanup()
}

module.exports = { runCleanup }