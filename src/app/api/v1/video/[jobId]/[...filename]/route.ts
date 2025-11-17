/**
 * Public Video Serving Route
 * Serves processed videos without requiring authentication headers
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat, readdir } from 'fs/promises'
import { join } from 'path'
import { supabase } from '../../../../../../../lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string; filename: string[] } }
) {
  try {
    const { jobId } = params
    const filename = params.filename.join('/')

    // Get job details to verify it exists and get user info
    const { data: job, error: jobError } = await supabase
      .from('video_jobs')
      .select('user_id, status, output_files, files_expired, completed_at')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Only serve completed jobs
    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Video processing not completed' },
        { status: 404 }
      )
    }

    // Check if files have expired (48 hours after completion)
    if (job.files_expired) {
      return NextResponse.json(
        { 
          error: 'Files expired',
          message: 'Video files are only available for 48 hours after processing completion',
          expiredAt: job.completed_at
        },
        { status: 410 } // 410 Gone - resource no longer available
      )
    }

    // Verify the filename is in the job's output files
    const outputFiles = job.output_files || []
    let isValidFile = outputFiles.some((file: any) => 
      typeof file === 'string' ? file.includes(filename) : file.filename === filename
    )

    // If not found, try to find similar files (handle naming variations)
    if (!isValidFile) {
      // Check for common naming patterns
      const baseFilename = filename.replace(/\.(mp4|mov|avi|mkv|webm|jpg|png)$/i, '')
      isValidFile = outputFiles.some((file: any) => {
        const filePath = typeof file === 'string' ? file : file.filename || ''
        return filePath.includes(baseFilename) || baseFilename.includes(filePath.split('/').pop()?.replace(/\.(mp4|mov|avi|mkv|webm|jpg|png)$/i, '') || '')
      })
    }

    if (!isValidFile) {
      console.log('File not found in outputs:', filename)
      console.log('Available files:', outputFiles)
      return NextResponse.json(
        { error: 'File not found in job outputs' },
        { status: 404 }
      )
    }

    // Construct file path - try multiple naming patterns
    const jobDir = join(process.cwd(), 'public', 'processed', job.user_id, jobId)
    let filePath = join(jobDir, filename)
    let fileBuffer: Buffer
    

    
    try {
      // First try exact filename
      await stat(filePath)
      fileBuffer = await readFile(filePath)
    } catch (exactError) {
      // Try to find similar files with different naming patterns
      try {
        const files = await readdir(jobDir, { recursive: true })
        const baseFilename = filename.replace(/\.(mp4|mov|avi|mkv|webm|jpg|png)$/i, '')
        
        // Look for files that match the pattern
        let matchedFile = files.find(f => {
          const fStr = f.toString()
          return fStr === filename || 
                 fStr.includes(baseFilename) || 
                 baseFilename.includes(fStr.replace(/\.(mp4|mov|avi|mkv|webm|jpg|png)$/i, ''))
        })
        
        // Special handling for common patterns
        if (!matchedFile) {
          if (filename.startsWith('clip_') && filename.includes('.mp4')) {
            const clipNumber = filename.match(/clip_(\d+)/)?.[1]
            
            // Try different platform variations
            const platformVariations = ['instagram', 'youtube', 'tiktok', 'twitter', 'general']
            for (const platform of platformVariations) {
              matchedFile = files.find(f => f.toString().includes(`clip_${clipNumber}_${platform}.mp4`))
              if (matchedFile) break
            }
            
            // Fallback to any clip with that number
            if (!matchedFile) {
              matchedFile = files.find(f => f.toString().includes(`clip_${clipNumber}_`))
            }
          } else if (filename.includes('.jpg') || filename.includes('.png')) {
            // Handle thumbnail requests - look in thumbnails directory
            if (filename.startsWith('thumbnails/')) {
              // Direct path match
              matchedFile = files.find(f => f.toString() === filename)
            } else {
              // Look for thumbnail in thumbnails directory
              const baseFilename = filename.replace(/\.(jpg|png)$/i, '')
              const clipNumber = baseFilename.match(/clip_(\d+)/)?.[1]
              
              if (clipNumber) {
                // Try different platform variations for thumbnails
                const platformVariations = ['instagram', 'youtube', 'tiktok', 'twitter', 'general']
                for (const platform of platformVariations) {
                  matchedFile = files.find(f => {
                    const fStr = f.toString()
                    return fStr.includes('thumbnails/') && fStr.includes(`clip_${clipNumber}_${platform}_thumb.jpg`)
                  })
                  if (matchedFile) break
                }
              }
              
              // Fallback to any thumbnail with similar name
              if (!matchedFile) {
                const thumbFilename = filename.replace(/\.(jpg|png)$/i, '_thumb.jpg')
                matchedFile = files.find(f => {
                  const fStr = f.toString()
                  return fStr.includes('thumbnails/') && fStr.includes(thumbFilename)
                })
              }
            }
          }
        }
        
        if (matchedFile) {
          filePath = join(jobDir, matchedFile.toString())
          await stat(filePath)
          fileBuffer = await readFile(filePath)
          console.log(`Found alternative file: ${matchedFile} for requested: ${filename}`)
        } else {
          throw new Error('No matching file found')
        }
      } catch (searchError) {
        console.error('File search error:', searchError)
        return NextResponse.json(
          { error: 'File not found on disk' },
          { status: 404 }
        )
      }
    }
      
      // Determine content type based on file extension
      const extension = filename.split('.').pop()?.toLowerCase()
      let contentType = 'application/octet-stream'
      
      switch (extension) {
        case 'mp4':
          contentType = 'video/mp4'
          break
        case 'mov':
          contentType = 'video/quicktime'
          break
        case 'avi':
          contentType = 'video/x-msvideo'
          break
        case 'mkv':
          contentType = 'video/x-matroska'
          break
        case 'webm':
          contentType = 'video/webm'
          break
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg'
          break
        case 'png':
          contentType = 'image/png'
          break
      }

      // Create response with proper headers for video streaming
      const response = new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileBuffer.length.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'X-Content-Type-Options': 'nosniff',
          // Allow embedding in iframes for video preview
          'X-Frame-Options': 'SAMEORIGIN'
        },
      })
      
      return response
  } catch (error) {
    console.error('Video serving error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}