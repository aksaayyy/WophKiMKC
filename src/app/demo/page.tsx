'use client'

import { useState } from 'react'
import { VideoUpload } from '@/components/features/VideoUpload'
import { ProcessingStatus } from '@/components/features/ProcessingStatus'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function DemoPage() {
  return (
    <AuthGuard>
      <DemoPageContent />
    </AuthGuard>
  )
}

function DemoPageContent() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    
    // The VideoUpload component now handles the actual upload
    // and processing will start automatically
    console.log('File uploaded:', file.name)
  }

  const testWithSampleVideo = async () => {
    try {
      const response = await fetch('/api/v1/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer vcp_demo_key_12345678901234567890'
        },
        body: JSON.stringify({
          video_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          platform: 'tiktok',
          quality: 'high',
          clip_count: 3
        })
      })

      if (response.ok) {
        const result = await response.json()
        setJobId(result.job_id)
      }
    } catch (error) {
      console.error('Error starting processing:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Video Processing Demo
          </h1>
          <p className="text-gray-300 text-lg">
            Test the video processing capabilities of Video Clipper Pro
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* File Upload Section */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Upload Video File
            </h2>
            <VideoUpload onFileUpload={handleFileUpload} />
            
            {uploadedFile && (
              <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-300">
                  ✅ File uploaded: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <p className="text-green-200 text-sm mt-1">
                  Processing has started automatically. Check the status below.
                </p>
              </div>
            )}
          </Card>

          {/* Sample Video Test */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Test with Sample Video
            </h2>
            <p className="text-gray-300 mb-4">
              Try processing with a sample video URL to test the API
            </p>
            <Button 
              onClick={testWithSampleVideo}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Process Sample Video
            </Button>
          </Card>

          {/* Processing Status */}
          {jobId && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Processing Status
              </h2>
              <ProcessingStatus 
                file={null} 
                config={{}} 
                jobId={jobId} 
              />
            </Card>
          )}

          {/* API Information */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">
              API Endpoints
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <code className="bg-black/30 px-2 py-1 rounded text-green-300">
                  POST /api/v1/upload
                </code>
                <p className="text-gray-300 mt-1">Upload video file for processing</p>
              </div>
              <div>
                <code className="bg-black/30 px-2 py-1 rounded text-green-300">
                  POST /api/v1/process
                </code>
                <p className="text-gray-300 mt-1">Process video from URL</p>
              </div>
              <div>
                <code className="bg-black/30 px-2 py-1 rounded text-green-300">
                  GET /api/v1/status/:jobId
                </code>
                <p className="text-gray-300 mt-1">Check processing status</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}