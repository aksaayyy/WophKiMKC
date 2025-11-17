'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Download, FileVideo } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface VideoFile {
  filename: string
  size?: number
  duration?: number
  url?: string
}

interface VideoPreviewProps {
  jobId: string
  files: VideoFile[]
  onDownload?: (filename: string) => void
}

interface VideoPreviewPropsExtended extends VideoPreviewProps {
  filesExpired?: boolean
  expiryInfo?: {
    expired: boolean
    expiresAt?: string
    expiredAt?: string
    hoursRemaining?: number
    minutesRemaining?: number
    message: string
  }
}

export function VideoPreview({ 
  jobId, 
  files, 
  onDownload, 
  filesExpired = false, 
  expiryInfo 
}: VideoPreviewPropsExtended) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  const getVideoUrl = (filename: string) => {
    return `/api/v1/video/${jobId}/${filename}`
  }

  const getVideoThumbnail = (filename: string) => {
    const baseName = filename.replace(/\.(mp4|mov|avi|mkv|webm)$/i, '')
    const thumbnailFilename = `thumbnails/${baseName}_thumb.jpg`
    return `/api/v1/video/${jobId}/${thumbnailFilename}`
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getClipNumber = (filename: string) => {
    const match = filename.match(/clip_(\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  const getPlatformName = (filename: string) => {
    if (filename.includes('instagram')) return 'Instagram'
    if (filename.includes('youtube')) return 'YouTube'
    if (filename.includes('tiktok')) return 'TikTok'
    if (filename.includes('twitter')) return 'Twitter'
    return 'General'
  }

  const handleDownload = (filename: string) => {
    if (onDownload) {
      onDownload(filename)
    } else {
      const videoUrl = getVideoUrl(filename)
      const link = document.createElement('a')
      link.href = videoUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (!files || files.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20" />
        <div className="relative p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500/20 to-purple-600/20 backdrop-blur-sm border border-primary-500/30 flex items-center justify-center"
          >
            <FileVideo className="w-10 h-10 text-primary-400" />
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-semibold text-white mb-2"
          >
            No clips generated yet
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/60"
          >
            Your video clips will appear here once processing is complete
          </motion.p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20" />
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Generated Clips</h2>
              <p className="text-white/60 text-sm">
                {files.length} clip{files.length !== 1 ? 's' : ''} {filesExpired ? 'generated (files expired)' : 'ready for download'}
              </p>
              {expiryInfo && (
                <p className={`text-xs mt-1 ${expiryInfo.expired ? 'text-red-400' : 'text-yellow-400'}`}>
                  {expiryInfo.message}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {filesExpired ? (
                <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium">
                  ⏰ Files Expired
                </div>
              ) : (
                <>
                  <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium">
                    ✓ Complete
                  </div>
                  <Button
                    onClick={() => files.forEach(file => handleDownload(file.filename))}
                    className="bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 border-0"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Video Player */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative overflow-hidden rounded-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20" />
            <div className="relative p-6">
              <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-white/10">
                <video
                  key={selectedVideo}
                  controls
                  className="w-full h-full"
                  preload="metadata"
                >
                  <source src={getVideoUrl(selectedVideo)} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{selectedVideo}</h3>
                  <p className="text-white/60 text-sm">
                    {getPlatformName(selectedVideo)} • {formatFileSize(files.find(f => f.filename === selectedVideo)?.size)}
                  </p>
                </div>
                <Button
                  onClick={() => handleDownload(selectedVideo)}
                  className="bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 border-0"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.map((file, index) => {
          const clipNumber = getClipNumber(file.filename)
          const platformName = getPlatformName(file.filename)
          
          return (
            <motion.div
              key={file.filename}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20" />
                
                <div className="relative">
                  {/* Video Thumbnail */}
                  <div 
                    className="aspect-video bg-gradient-to-br from-gray-900 to-black relative overflow-hidden cursor-pointer"
                    onClick={() => !filesExpired && setSelectedVideo(file.filename)}
                  >
                    <img
                      src={getVideoThumbnail(file.filename)}
                      alt={`Thumbnail for ${file.filename}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    
                    {/* Clip Number Badge */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{clipNumber}</span>
                    </div>
                    
                    {/* Play Button Overlay */}
                    {!filesExpired && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-current ml-1" />
                        </div>
                      </div>
                    )}

                    {/* File Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                      <p className="text-white text-sm font-semibold mb-1">
                        Clip {clipNumber}
                      </p>
                      <p className="text-white/70 text-xs">
                        {platformName} • {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4">
                    {filesExpired ? (
                      <div className="text-center">
                        <p className="text-red-400 text-sm mb-2">Files Expired</p>
                        <p className="text-white/60 text-xs">
                          Video files are only available for 48 hours after processing
                        </p>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setSelectedVideo(file.filename)}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 text-white font-medium"
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          onClick={() => handleDownload(file.filename)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0 text-white font-medium"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}