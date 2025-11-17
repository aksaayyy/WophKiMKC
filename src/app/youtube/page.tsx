'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

interface ProcessingOptions {
  quality: 'standard' | 'high' | 'premium'
  clipCount: number
  platform: 'tiktok' | 'instagram' | 'youtube_shorts'
  enhanceAudio: boolean
  colorCorrection: boolean
  smartSelection: boolean
  minClipLength: number
  maxClipLength: number
}

export default function YouTubePage() {
  const { user, session, loading } = useAuth()
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [jobId, setJobId] = useState('')
  const [options, setOptions] = useState<ProcessingOptions>({
    quality: 'high',
    clipCount: 3,
    platform: 'tiktok',
    enhanceAudio: false,
    colorCorrection: false,
    smartSelection: true,
    minClipLength: 15,
    maxClipLength: 60
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth/login'
    }
  }, [user, loading])

  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\//,
      /^https?:\/\/(www\.)?youtube\.com\/live\//
    ]
    return patterns.some(pattern => pattern.test(url))
  }

  const handleProcess = async () => {
    if (!youtubeUrl.trim()) {
      alert('Please enter a YouTube URL')
      return
    }

    if (!validateYouTubeUrl(youtubeUrl)) {
      alert('Please enter a valid YouTube URL')
      return
    }

    if (!session?.access_token) {
      alert('Authentication error. Please login again.')
      window.location.href = '/auth/login'
      return
    }

    setIsProcessing(true)
    setProcessingStatus('Starting YouTube video processing...')

    try {
      const response = await fetch('/api/v1/youtube/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          youtube_url: youtubeUrl,
          ...options
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Processing failed')
      }

      setJobId(result.job_id)
      setProcessingStatus('Processing started! Downloading and analyzing video...')
      
      // Start polling for status updates
      pollJobStatus(result.job_id, session.access_token)

    } catch (error) {
      console.error('Processing error:', error)
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsProcessing(false)
    }
  }

  const pollJobStatus = async (jobId: string, token: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/status/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const status = await response.json()

        if (status.status === 'completed') {
          setProcessingStatus('✅ Processing completed! Your clips are ready.')
          setIsProcessing(false)
          clearInterval(pollInterval)
          // Redirect to downloads page when processing is complete
          setTimeout(() => {
            window.location.href = `/dashboard/job/${jobId}`
          }, 2000)
        } else if (status.status === 'failed') {
          setProcessingStatus(`❌ Processing failed: ${status.error || 'Unknown error'}`)
          setIsProcessing(false)
          clearInterval(pollInterval)
        } else {
          setProcessingStatus(`🔄 ${status.message || 'Processing in progress...'}`)
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 3000)

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      if (isProcessing) {
        setProcessingStatus('⏰ Processing is taking longer than expected. Check back later.')
        setIsProcessing(false)
      }
    }, 600000)
  }

  // Format numbers with leading zeros for better visibility
  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Redirecting to login...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation would be here in the layout */}
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              YouTube Video Clipper
            </h1>
            <p className="text-xl text-gray-300">
              Transform YouTube videos into viral clips with AI-powered smart selection
            </p>
          </div>

          {/* Main Processing Card */}
          <Card className="p-8 mb-8 bg-white/10 backdrop-blur-lg border border-white/20">
            <div className="space-y-6">
              {/* YouTube URL Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  YouTube URL
                </label>
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full bg-white/10 border-white/30 text-white placeholder-white/50 focus:border-primary-400"
                />
                <p className="text-sm text-gray-300 mt-1">
                  Supports YouTube videos, shorts, and live streams
                </p>
              </div>

              {/* Processing Options */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Target Platform
                  </label>
                  <select
                    value={options.platform}
                    onChange={(e) => setOptions({...options, platform: e.target.value as any})}
                    className="w-full p-3 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-primary-500 text-white"
                  >
                    <option value="tiktok" className="bg-gray-800">TikTok (9:16)</option>
                    <option value="instagram" className="bg-gray-800">Instagram Reels (9:16)</option>
                    <option value="youtube_shorts" className="bg-gray-800">YouTube Shorts (9:16)</option>
                  </select>
                </div>

                {/* Quality Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Quality
                  </label>
                  <select
                    value={options.quality}
                    onChange={(e) => setOptions({...options, quality: e.target.value as any})}
                    className="w-full p-3 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-primary-500 text-white"
                  >
                    <option value="standard" className="bg-gray-800">Standard (Fast)</option>
                    <option value="high" className="bg-gray-800">High Quality</option>
                    <option value="premium" className="bg-gray-800">Premium (Best)</option>
                  </select>
                </div>

                {/* Clip Count */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Number of Clips: <span className="font-bold text-primary-400">{formatNumber(options.clipCount)}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={options.clipCount}
                    onChange={(e) => setOptions({...options, clipCount: parseInt(e.target.value)})}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500"
                  />
                  <div className="flex justify-between text-sm text-gray-300 mt-1">
                    <span>1 clip</span>
                    <span>10 clips</span>
                  </div>
                </div>

                {/* Clip Length Settings */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Clip Length: <span className="font-bold text-primary-400">{formatNumber(options.minClipLength)}-{formatNumber(options.maxClipLength)}s</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={options.minClipLength}
                      onChange={(e) => setOptions({...options, minClipLength: parseInt(e.target.value)})}
                      className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500"
                    />
                    <input
                      type="range"
                      min="30"
                      max="120"
                      value={options.maxClipLength}
                      onChange={(e) => setOptions({...options, maxClipLength: parseInt(e.target.value)})}
                      className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-300 mt-1">
                    <span>5-30s</span>
                    <span>30-120s</span>
                  </div>
                </div>

                {/* Enhancement Options */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-white">
                    Enhancement Options
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={options.smartSelection}
                      onChange={(e) => setOptions({...options, smartSelection: e.target.checked})}
                      className="w-5 h-5 rounded bg-white/10 border-white/30 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-white">Smart Selection (AI-powered)</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={options.enhanceAudio}
                      onChange={(e) => setOptions({...options, enhanceAudio: e.target.checked})}
                      className="w-5 h-5 rounded bg-white/10 border-white/30 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-white">Audio Enhancement</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={options.colorCorrection}
                      onChange={(e) => setOptions({...options, colorCorrection: e.target.checked})}
                      className="w-5 h-5 rounded bg-white/10 border-white/30 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-white">Color Correction</span>
                  </label>
                </div>
              </div>

              {/* Process Button */}
              <Button
                onClick={handleProcess}
                disabled={isProcessing || !youtubeUrl.trim()}
                className="w-full py-4 text-lg bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700"
              >
                {isProcessing ? 'Processing...' : 'Generate Clips'}
              </Button>

              {/* Processing Status */}
              {processingStatus && (
                <div className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                  <p className="text-blue-100 font-medium">{processingStatus}</p>
                  {jobId && (
                    <p className="text-sm text-blue-200 mt-1">
                      Job ID: <span className="font-mono">{jobId}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 text-center bg-white/10 backdrop-blur-lg border border-white/20">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Selection</h3>
              <p className="text-gray-300">AI identifies the most engaging moments automatically</p>
            </Card>

            <Card className="p-6 text-center bg-white/10 backdrop-blur-lg border border-white/20">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-white mb-2">Fast Processing</h3>
              <p className="text-gray-300">Optimized chunked downloading and processing</p>
            </Card>

            <Card className="p-6 text-center bg-white/10 backdrop-blur-lg border border-white/20">
              <div className="text-3xl mb-4">🎨</div>
              <h3 className="text-lg font-semibold text-white mb-2">Professional Quality</h3>
              <p className="text-gray-300">Enhanced audio, color correction, and optimization</p>
            </Card>
          </div>

          {/* Pricing Info */}
          <Card className="p-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/20 backdrop-blur-lg">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">YouTube Processing Pricing</h3>
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">Free</div>
                  <div className="text-sm text-gray-300">3 videos/month</div>
                  <div className="text-sm text-gray-300">Standard quality</div>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">Pro - $9.99</div>
                  <div className="text-sm text-gray-300">50 videos/month</div>
                  <div className="text-sm text-gray-300">High quality + AI features</div>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">Business - $29.99</div>
                  <div className="text-sm text-gray-300">Unlimited videos</div>
                  <div className="text-sm text-gray-300">Premium quality + priority</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}